from flask import Blueprint, request, jsonify, current_app
from extensions import mail
from flask_mail import Message
import requests
# NOTE: /api/turfs and /api/player/book are defined at the bottom
from database.db import db
from bson.objectid import ObjectId
import datetime
import re

player_bp = Blueprint('player', __name__)

# ── Sport capacities ──────────────────────────────────────────────────────────
SPORT_CAPACITIES = {
    "Futsal":          10,
    "Football":        10,
    "Indoor Cricket":  10,
    "Badminton":        4,
    "Basketball":      10,
    "Tennis":           4,
}


def _slot_start_end_parts(slot):
    """Split '07:00 PM - 08:00 PM' into (start_str, end_str)."""
    s = (slot or "").strip()
    if not s:
        return "", ""
    normalized = s.replace("\u2013", "-").replace("—", "-").replace(" – ", " - ")
    if " - " in normalized:
        a, b = normalized.split(" - ", 1)
        return a.strip(), b.strip()
    parts = [p.strip() for p in normalized.split("-", 1)]
    if len(parts) == 2:
        return parts[0], parts[1]
    return normalized, ""


def _parse_time_to_minutes(t):
    """Parse '07:00 PM', '7:00 PM', or '19:00' to minutes from midnight."""
    t = (t or "").strip().upper()
    if not t:
        return 0
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)\s*$", t)
    if m:
        h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
        if ap == "AM":
            if h == 12:
                h = 0
        else:
            if h != 12:
                h += 12
        return h * 60 + mi
    m2 = re.match(r"^(\d{1,2}):(\d{2})\s*$", t)
    if m2:
        return int(m2.group(1)) * 60 + int(m2.group(2))
    return 0


def _slot_start_minutes(slot):
    start_s, _ = _slot_start_end_parts(slot)
    return _parse_time_to_minutes(start_s)


def _join_slots_chrono(slots):
    """Join slot strings in chronological order (set intersection order is undefined)."""
    parts = [s.strip() for s in slots if s and str(s).strip()]
    if not parts:
        return ""
    if any(p.upper() == "ANYTIME" for p in parts):
        return ", ".join(parts)
    parts.sort(key=_slot_start_minutes)
    return ", ".join(parts)


def _parse_slot_range_minutes(slot_str):
    """Parse a single 'HH:MM - HH:MM' or 'H:MM AM - …' range to (start_min, end_min)."""
    s = (slot_str or "").strip()
    if not s:
        return None
    a, b = _slot_start_end_parts(s)
    if not a or not b:
        return None
    sm = _parse_time_to_minutes(a)
    em = _parse_time_to_minutes(b)
    if em <= sm:
        em += 24 * 60
    return sm, em


def _ranges_overlap(sm1, em1, sm2, em2):
    """Half-open [start, end) overlap."""
    return sm1 < em2 and sm2 < em1


def _minutes_to_player_slot_label(m):
    """Match player BookingModal hourly labels (e.g. 18:00 → '06:00 PM')."""
    total = int(m) % (24 * 60)
    h = total // 60
    period = "PM" if h >= 12 else "AM"
    display_h = h % 12
    if display_h == 0:
        display_h = 12
    return f"{display_h:02d}:00 {period}"


def _slot_range_to_player_booking_style(sm, em):
    return f"{_minutes_to_player_slot_label(sm)} - {_minutes_to_player_slot_label(em)}"


def _expand_busy_time_labels(t):
    """All string labels that should block the same physical slot in the UI/API."""
    out = set()
    if not t:
        return out
    t = str(t).strip()
    out.add(t)
    r = _parse_slot_range_minutes(t)
    if not r:
        return out
    sm, em = r
    out.add(_slot_range_to_player_booking_style(sm, em))
    sh, eh = sm // 60, em // 60
    out.add(f"{sh % 24:02d}:00 - {eh % 24:02d}:00")
    return out


def _owner_id_variants(oid):
    if oid is None:
        return []
    s = str(oid).strip()
    out = [s]
    if ObjectId.is_valid(s):
        out.append(ObjectId(s))
    return out


def _court_booking_conflicts(court_doc, owner_id, date, candidate_slot):
    """
    True if another non-cancelled booking overlaps this court+date+time.
    Handles manual bookings (no court_id) and mixed 12h/24h slot strings.
    """
    cand = _parse_slot_range_minutes(candidate_slot)
    if not cand:
        return True, "Invalid time slot."
    csm, cem = cand
    c_oid = str(court_doc["_id"])
    c_name = (court_doc.get("name") or "").strip()
    ovars = _owner_id_variants(owner_id)

    court_id_clauses = [{"court_id": c_oid}]
    if ObjectId.is_valid(c_oid):
        court_id_clauses.append({"court_id": ObjectId(c_oid)})

    q = {
        "date": date,
        "status": {"$ne": "Cancelled"},
        "$or": court_id_clauses + [
            {
                "$and": [
                    {"owner_id": {"$in": ovars}},
                    {"court": c_name},
                    {"$or": [{"court_id": {"$exists": False}}, {"court_id": None}, {"court_id": ""}]},
                ]
            }
        ],
    }

    for b in db.bookings.find(q):
        bt = b.get("time") or b.get("timeSlot") or ""
        br = _parse_slot_range_minutes(bt)
        if not br:
            continue
        bsm, bem = br
        if _ranges_overlap(csm, cem, bsm, bem):
            return True, "This court is already booked for that time."
    return False, ""


def _earliest_slot_start_str(time_str):
    """Start time of the earliest comma-separated slot (for schedules / parsing)."""
    if not time_str or str(time_str).strip().upper() == "ANYTIME":
        return ""
    parts = [x.strip() for x in str(time_str).split(",") if x.strip() and x.strip().upper() != "ANYTIME"]
    if not parts:
        return ""
    first = min(parts, key=_slot_start_minutes)
    start_s, _ = _slot_start_end_parts(first)
    return start_s


def _norm_player_id(pid):
    if pid is None:
        return ""
    if isinstance(pid, ObjectId):
        return str(pid)
    return str(pid).strip()


def _player_id_query_variants(pid):
    """BSON values that may appear in `players.player_id` for one logical user."""
    s = _norm_player_id(pid)
    if not s:
        return []
    out = [s]
    if ObjectId.is_valid(s):
        out.append(ObjectId(s))
    return out


def _sanitize_match_group_players(players):
    """Dedupe roster by player_id (string form); keeps first join order."""
    if not players:
        return []
    seen = set()
    out = []
    for p in players:
        if not isinstance(p, dict):
            continue
        key = _norm_player_id(p.get("player_id"))
        if not key or key in seen:
            continue
        seen.add(key)
        row = dict(p)
        row["player_id"] = key
        if not row.get("name"):
            row["name"] = "Unknown"
        out.append(row)
    return out


def _serialize(doc):
    """Convert MongoDB doc to JSON-safe dict."""
    doc["_id"] = str(doc["_id"])
    return doc

def _is_player_busy(player_id, date, time_slots):
    """
    Checks if a player has any confirmed/pending booking or is in any active match group
    for the given date and any of the provided time slots.
    time_slots can be a string (single slot) or a list/set of slots.
    """
    if not date: return False, ""
    
    # Standardize time slots for comparison
    def normalize_time(t):
        if not t: return ""
        t = t.strip().upper()
        # If already matching our preferred format (06:00 AM - 07:00 AM), return as is
        if " AM" in t or " PM" in t:
            # But ensure 0 padding for consistency
            parts = [p.strip() for p in t.split(" - ")]
            if len(parts) == 2:
                for i in range(2):
                    if ":" in parts[i] and len(parts[i].split(":")[0]) == 1:
                        parts[i] = "0" + parts[i]
                return " - ".join(parts)
            return t
        
        # If in 24h format (18:00 - 19:00), convert to AM/PM
        parts = [p.strip() for p in t.split(" - ")]
        if len(parts) != 2: return t
        
        def to_ampm(p):
            try:
                h = int(p.split(":")[0])
                m = p.split(":")[1][:2]
                period = "PM" if h >= 12 else "AM"
                disp_h = h % 12
                if disp_h == 0: disp_h = 12
                return f"{disp_h:02d}:{m} {period}"
            except: return p
            
        return f"{to_ampm(parts[0])} - {to_ampm(parts[1])}"

    if isinstance(time_slots, str):
        slots_to_check = [normalize_time(s) for s in time_slots.split(",") if s.strip()]
    else:
        slots_to_check = [normalize_time(s) for s in (time_slots or [])]

    for slot in slots_to_check:
        if slot == "Anytime" or not slot: continue
        
        # 1. Check direct court bookings
        # We search with normalized slot AND original just in case
        existing_booking = db.bookings.find_one({
            "player_id": player_id,
            "date": date,
            "status": {"$ne": "Cancelled"},
            "$or": [{"time": slot}, {"timeSlot": slot}]
        })
        if existing_booking:
            return True, f"You already have a court booking for {date} at {slot}."

        # 2. Check match groups (squads)
        match_groups = db.match_groups.find({
            "players.player_id": player_id,
            "preferred_date": date,
            "status": {"$in": ["open", "confirmed", "booked", "fully_paid"]}
        })
        for group in match_groups:
            group_slots = [t.strip() for t in group.get("preferred_time", "").split(",") if t.strip()]
            if slot in group_slots or "Anytime" in group_slots:
                return True, f"You are already part of a {group.get('sport')} squad for {date} at {slot}."

    return False, ""


# ── 1. Save / update availability preferences ────────────────────────────────
@player_bp.route('/api/player/availability', methods=['POST'])
def save_availability():
    """
    Body: { player_id, sport, area, preferred_days[], preferred_time }
    """
    try:
        data = request.json
        player_id = data.get("player_id")
        if not player_id:
            return jsonify({"error": "player_id is required"}), 400

        # DOUBLE BOOKING CHECK
        p_time = data.get("preferred_time")
        for day in data.get("preferred_days", []):
            is_busy, msg = _is_player_busy(player_id, day, p_time)
            if is_busy:
                return jsonify({"error": msg}), 400

        prefs = {
            "player_id": player_id,
            "sport":      data.get("sport"),
            "area":       data.get("area", "").strip(),
            "province":   data.get("province", ""),
            "district":   data.get("district", ""),
            "town":       data.get("town", ""),
            "preferred_days":  data.get("preferred_days", []),
            "preferred_time":  data.get("preferred_time"),   # "morning" | "afternoon" | "evening"
            "is_team":         data.get("is_team", False),
            "updated_at": datetime.datetime.utcnow(),
        }

        db.availability_schedules.update_one(
            {"player_id": player_id},
            {"$set": prefs},
            upsert=True
        )

        # After saving, attempt auto-match
        _try_auto_match(player_id, prefs)

        return jsonify({"message": "Preferences saved!", "prefs": prefs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 2. Find compatible matches for a player ───────────────────────────────────
@player_bp.route('/api/player/find-matches', methods=['GET'])
def find_matches():
    """
    Query: player_id
    Returns pending match_groups that the player could join.
    """
    try:
        player_id = request.args.get("player_id")
        if not player_id:
            return jsonify({"error": "player_id is required"}), 400

        prefs = db.availability_schedules.find_one({"player_id": player_id})
        if not prefs:
            return jsonify({"groups": [], "message": "No preferences saved yet"}), 200

        sport = prefs.get("sport")
        area  = prefs.get("area", "")

        # Find open groups for same sport + area that player hasn't already joined
        pid_variants = _player_id_query_variants(player_id)
        groups_cursor = db.match_groups.find({
            "sport":  sport,
            "area":   area,
            "status": "open",
            "players": {"$not": {"$elemMatch": {"player_id": {"$in": pid_variants}}}},
        })

        groups = []
        for g in groups_cursor:
            g["_id"] = str(g["_id"])
            groups.append(g)

        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 3. Join a match group ─────────────────────────────────────────────────────
@player_bp.route('/api/matches/join', methods=['POST'])
def join_match():
    """
    Body: { player_id, group_id }
    """
    try:
        data      = request.json
        player_id = _norm_player_id(data.get("player_id"))
        group_id  = data.get("group_id")
        if not player_id:
            return jsonify({"error": "player_id is required"}), 400

        group = db.match_groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Match group not found"}), 404

        # DOUBLE BOOKING CHECK
        is_busy, msg = _is_player_busy(player_id, group.get("preferred_date"), group.get("preferred_time"))
        if is_busy:
            return jsonify({"error": msg}), 400

        # Check player not already in group (normalize ids — string vs ObjectId)
        already = any(_norm_player_id(p.get("player_id")) == player_id for p in group.get("players", []))
        if already:
            return jsonify({"error": "Already joined this group"}), 409

        # Fetch player info
        player = db.users.find_one({"_id": ObjectId(player_id)})
        player_entry = {
            "player_id": player_id,
            "name":      player.get("name", "Unknown") if player else "Unknown",
            "joined_at": datetime.datetime.utcnow(),
            "paid":      False,
        }

        pid_variants = _player_id_query_variants(player_id)
        res = db.match_groups.update_one(
            {
                "_id": ObjectId(group_id),
                "players": {"$not": {"$elemMatch": {"player_id": {"$in": pid_variants}}}},
            },
            {"$push": {"players": player_entry}, "$inc": {"player_count": 1}},
        )

        if res.modified_count > 0:
            # Check if group is now full → confirm booking
            updated = db.match_groups.find_one({"_id": ObjectId(group_id)})
            sport = updated.get("sport", "Futsal")
            group_capacity = SPORT_CAPACITIES.get(sport, 10)
            if updated.get("player_count", 0) >= group_capacity:
                _confirm_group(group_id, updated)

        return jsonify({"message": "Joined successfully!", "group_id": group_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/matches/<group_id>/leave', methods=['POST'])
def leave_match_group(group_id):
    """
    Body: { player_id }
    """
    try:
        data = request.json
        player_id = _norm_player_id(data.get("player_id"))
        if not player_id:
            return jsonify({"error": "player_id is required"}), 400

        oid = ObjectId(group_id)
        group = db.match_groups.find_one({"_id": oid})
        if not group:
            return jsonify({"error": "Match group not found"}), 404

        before = _sanitize_match_group_players(group.get("players") or [])
        after = [p for p in before if p["player_id"] != player_id]
        if len(after) == len(before):
            return jsonify({"error": "You are not in this squad"}), 404

        db.match_groups.update_one(
            {"_id": oid},
            {"$set": {"players": after, "player_count": len(after)}},
        )

        # check if empty -> cancel group
        updated = db.match_groups.find_one({"_id": oid})
        if updated and updated.get("player_count", 0) <= 0:
            db.match_groups.update_one(
                {"_id": oid},
                {"$set": {"status": "cancelled"}}
            )

        return jsonify({"message": "Left game successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 4. Get all match groups for a player ─────────────────────────────────────
@player_bp.route('/api/player/matches/<player_id>', methods=['GET'])
def get_player_matches(player_id):
    """Return all groups this player belongs to."""
    try:
        pid_variants = _player_id_query_variants(player_id)
        if not pid_variants:
            return jsonify({"groups": []}), 200
        groups_cursor = db.match_groups.find({
            "players": {"$elemMatch": {"player_id": {"$in": pid_variants}}}
        }).sort("created_at", -1)

        groups = []
        for g in groups_cursor:
            oid = g["_id"]
            g["_id"] = str(oid)
            raw = g.get("players") or []
            fixed = _sanitize_match_group_players(raw)
            n = len(fixed)
            if n != g.get("player_count", 0) or len(raw) != n:
                db.match_groups.update_one(
                    {"_id": oid},
                    {"$set": {"players": fixed, "player_count": n}},
                )
            g["players"] = fixed
            g["player_count"] = n
            groups.append(g)

        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 5. Simulate payment for a player in a group ───────────────────────────────
@player_bp.route('/api/matches/<group_id>/pay', methods=['POST'])
def pay_for_match(group_id):
    """
    Body: { player_id, card_number, card_name, expiry, cvv }
    Marks the player as paid. If all players paid → status = 'fully_paid'.
    """
    try:
        data      = request.json
        player_id = _norm_player_id(data.get("player_id"))

        group = db.match_groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Group not found"}), 404

        # Mark this player as paid
        pid_variants = _player_id_query_variants(player_id)
        db.match_groups.update_one(
            {"_id": ObjectId(group_id), "players": {"$elemMatch": {"player_id": {"$in": pid_variants}}}},
            {"$set": {"players.$.paid": True}}
        )

        # Check if everyone paid
        updated = db.match_groups.find_one({"_id": ObjectId(group_id)})
        all_paid = all(p.get("paid", False) for p in updated.get("players", []))
        if all_paid and updated.get("status") == "confirmed":
            db.match_groups.update_one(
                {"_id": ObjectId(group_id)},
                {"$set": {"status": "fully_paid"}}
            )

        # Push notification
        _push_notification(player_id, "Payment Confirmed ✅",
                           f"Your payment for the {group.get('sport')} match was successful!")

        return jsonify({"message": "Payment recorded!", "all_paid": all_paid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 6. Get notifications for a player ────────────────────────────────────────
@player_bp.route('/api/player/notifications', methods=['GET'])
def get_notifications():
    player_id = request.args.get("player_id")
    if not player_id:
        return jsonify({"error": "player_id required"}), 400
    try:
        notes = list(db.notifications.find(
            {"player_id": player_id},
            sort=[("created_at", -1)],
        ).limit(20))
        for n in notes:
            n["_id"] = str(n["_id"])
        return jsonify({"notifications": notes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 7. Mark notification as read ─────────────────────────────────────────────
@player_bp.route('/api/player/notifications/<notif_id>/read', methods=['POST'])
def mark_notif_read(notif_id):
    try:
        db.notifications.update_one(
            {"_id": ObjectId(notif_id)},
            {"$set": {"read": True}}
        )
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 8. Get all open match groups (public listing) ────────────────────────────
@player_bp.route('/api/matches/open', methods=['GET'])
def get_open_matches():
    try:
        sport = request.args.get("sport")
        area  = request.args.get("area")

        query = {"status": "open"}
        if sport:
            query["sport"] = sport
        if area:
            query["area"] = area

        groups = list(db.match_groups.find(query).sort("created_at", -1).limit(50))
        for g in groups:
            g["_id"] = str(g["_id"])
        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 9. Create a new match group ───────────────────────────────────────────────
@player_bp.route('/api/matches/create', methods=['POST'])
def create_match_group():
    """
    Body: { player_id, sport, area, preferred_time, preferred_date }
    Creates a new open group and adds the creator as the first player.
    """
    try:
        data      = request.json
        player_id = _norm_player_id(data.get("player_id"))
        sport     = data.get("sport")
        area      = data.get("area", "").strip()

        if not all([player_id, sport, area]):
            return jsonify({"error": "player_id, sport, and area are required"}), 400

        # Resolve player name
        player = db.users.find_one({"_id": ObjectId(player_id)})
        player_name = player.get("name", "Unknown") if player else "Unknown"

        capacity = SPORT_CAPACITIES.get(sport, 10)

        group = {
            "sport":          sport,
            "area":           area,
            "preferred_time": data.get("preferred_time", "evening"),
            "preferred_date": data.get("preferred_date", ""),
            "status":         "open",
            "capacity":       capacity,
            "player_count":   1,
            "players": [{
                "player_id": player_id,
                "name":      player_name,
                "joined_at": datetime.datetime.utcnow(),
                "paid":      False,
            }],
            "created_by": player_id,
            "created_at": datetime.datetime.utcnow(),
        }

        result = db.match_groups.insert_one(group)
        group["_id"] = str(result.inserted_id)

        _push_notification(player_id, "Match Group Created 🎮",
                           f"You created a {sport} match group in {area}. Waiting for players...")

        return jsonify({"message": "Match group created!", "group": group}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Internal helpers ──────────────────────────────────────────────────────────

def _try_auto_match(player_id, prefs):
    """
    After a player saves preferences, look for an open group for same sport+area.
    If found, auto-join. If not, create a new group.
    """
    player_id = _norm_player_id(player_id)
    if not player_id:
        return

    sport = prefs.get("sport")
    area  = prefs.get("area", "")
    if not sport or not area:
        return

    pid_variants = _player_id_query_variants(player_id)

    # Is player already in an open group for this sport+area?
    pref_days = prefs.get("preferred_days", [])
    pref_date = pref_days[0] if pref_days else ""

    existing = db.match_groups.find_one({
        "sport":  sport,
        "area":   area,
        "preferred_date": pref_date,
        "status": "open",
        "players.player_id": {"$in": pid_variants}
    })
    if existing:
        return  # already queued for this specific sport/area/date

    # Find open groups with space on the SAME DATE
    capacity = SPORT_CAPACITIES.get(sport, 10)
    groups_cursor = db.match_groups.find({
        "sport":          sport,
        "area":           area,
        "preferred_date": pref_date,
        "status":         "open",
        "player_count":   {"$lt": capacity},
        "players.player_id": {"$nin": pid_variants}
    })

    player = db.users.find_one({"_id": ObjectId(player_id)})
    player_name = player.get("name", "Unknown") if player else "Unknown"

    player_entry = {
        "player_id": player_id,
        "name":      player_name,
        "joined_at": datetime.datetime.utcnow(),
        "paid":      False,
    }

    matched_group = None
    for group in groups_cursor:
        # Join existing group ONLY if they have overlapping times
        curr_time = group.get("preferred_time", "")
        new_time = prefs.get("preferred_time", "")
        
        g_times = set(x.strip() for x in curr_time.split(",") if x.strip())
        p_times = set(x.strip() for x in new_time.split(",") if x.strip())
        
        if "Anytime" in g_times or not g_times:
            intersected = p_times
        elif "Anytime" in p_times:
            intersected = g_times
        else:
            intersected = g_times.intersection(p_times)

        if intersected:
            # JOIN THIS GROUP
            merged_time = _join_slots_chrono(intersected)
            res = db.match_groups.update_one(
                {
                    "_id": group["_id"],
                    "players.player_id": {"$nin": pid_variants},
                    "player_count": {"$lt": capacity}
                },
                {
                    "$push": {"players": player_entry},
                    "$inc": {"player_count": 1},
                    "$set": {"preferred_time": merged_time},
                },
            )
            if res.modified_count > 0:
                matched_group = db.match_groups.find_one({"_id": group["_id"]})
                if matched_group.get("player_count", 0) >= capacity:
                    _confirm_group(str(group["_id"]), matched_group)
                else:
                    _push_notification(player_id, "You've been queued! ⏳",
                                       f"You joined a {sport} group in {area}. {capacity - matched_group['player_count']} more players needed.")
                return # JOINED SUCCESSFULLY
    
    # If no compatible group was found, create a new one
    _create_new_group(player_id, player_entry, prefs, sport, area, capacity)

def _create_new_group(player_id, player_entry, prefs, sport, area, capacity):
        pref_days = prefs.get("preferred_days", [])
        pref_date = pref_days[0] if pref_days else ""

        # Create new group
        new_group = {
            "sport":          sport,
            "area":           area,
            "preferred_time": prefs.get("preferred_time", "evening"),
            "preferred_date": pref_date,
            "status":         "open",
            "capacity":       capacity,
            "player_count":   1,
            "players":        [player_entry],
            "created_by":     player_id,
            "created_at":     datetime.datetime.utcnow(),
        }
        db.match_groups.insert_one(new_group)
        _push_notification(player_id, "Queue Started 🌟",
                           f"A new {sport} group has been created for {area}. {capacity - 1} more players needed!")


def _confirm_group(group_id, group_doc):
    """Mark group as confirmed and notify all players. Checks for court availability first."""
    # 1. ATTEMPT AUTO-BOOKING FIRST
    booked_successfully = _auto_book_court(group_doc)
    
    sport = group_doc.get("sport", "a sport")
    area  = group_doc.get("area", "your area")
    
    if booked_successfully:
        # SUCCESS: Court found and booked
        db.match_groups.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": {"status": "booked", "confirmed_at": datetime.datetime.utcnow()}}
        )
        
        # Notify players of confirmation
        for p in group_doc.get("players", []):
            _push_notification(
                p["player_id"],
                "Match Confirmed! 🎉",
                f"Your {sport} match in {area} is FULL and CONFIRMED! We've found a court. Please complete payment to lock your spot."
            )
            # (Optionally send real notification here too if not already sent by _auto_book_court)
    else:
        # FAILURE: No courts available
        db.match_groups.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": {"status": "cancelled", "confirmed_at": datetime.datetime.utcnow(), "cancel_reason": "no_courts"}}
        )
        
        for p in group_doc.get("players", []):
            apology_msg = f"We're sorry! Your {sport} squad in {area} is full, but unfortunately no courts are available at your preferred time. We've had to cancel this match."
            _push_notification(
                p["player_id"],
                "Match Cancelled - No Courts Available 🏟️",
                apology_msg
            )
            # Send real notification for apology
            _send_real_notifications(p["player_id"], "FINDME: Match Update", apology_msg)


def _send_real_notifications(player_id, title, message_body):
    """Sends both Email and SMS to a player if contact info exists."""
    player = db.users.find_one({"_id": ObjectId(player_id)})
    if not player:
        return

    email = player.get("email")
    phone = player.get("phone") or player.get("mobile")

    # 1. SEND EMAIL
    if email:
        try:
            msg = Message(
                subject=title,
                recipients=[email],
                body=message_body
            )
            mail.send(msg)
            print(f"[SUCCESS] Email sent to {email}")
        except Exception as e:
            print(f"[ERROR] Could not send email: {e}")

    # 2. SEND SMS (Notify.lk)
    if phone:
        try:
            # Clean phone number (Lanka numbers usually start with 0, Notify.lk needs 94)
            clean_phone = str(phone).strip()
            if clean_phone.startswith('0'):
                clean_phone = '94' + clean_phone[1:]
            
            sms_payload = {
                'user_id': current_app.config.get('NOTIFY_USER_ID'),
                'api_key': current_app.config.get('NOTIFY_API_KEY'),
                'sender_id': current_app.config.get('NOTIFY_SENDER_ID'),
                'to': clean_phone,
                'message': message_body
            }
            res = requests.get('https://app.notify.lk/api/v1/send', params=sms_payload)
            if res.status_code == 200:
                print(f"[SUCCESS] SMS sent to {clean_phone}")
            else:
                print(f"[ERROR] SMS failed (Notify.lk status {res.status_code})")
        except Exception as e:
            print(f"[ERROR] Could not send SMS: {e}")


def _push_notification(player_id, title, message):
    db.notifications.insert_one({
        "player_id":  player_id,
        "title":      title,
        "message":    message,
        "read":       False,
        "created_at": datetime.datetime.utcnow(),
    })

def _auto_book_court(group_doc):
    """
    Called when a match group gets full. Finds an available court and books it.
    Returns True if a court was booked, False otherwise.
    """
    sport = group_doc.get("sport", "")
    area = group_doc.get("area", "")
    pref_date = group_doc.get("preferred_date", "")
    pref_times = group_doc.get("preferred_time", "")
    if not pref_date or not pref_times:
        return False
    
    times = [t.strip() for t in pref_times.split(",") if t.strip() and t.strip() != "Anytime"]
    if not times:
        return False
    times.sort(key=_slot_start_minutes)

    for t_slot in times:
        turfs = list(db.users.find({
            "role": "turf_owner",
            "$or": [{"address.town": area}, {"address.district": area}]
        }))
        
        for owner in turfs:
            owner_id = str(owner["_id"])
            courts = list(db.courts.find({"owner_id": owner_id, "sport": sport, "status": "Available"}))
            for court in courts:
                court_id = str(court["_id"])
                
                # USE THE ROBUST OVERLAP CHECK INSTEAD OF EXACT STRING MATCH
                busy_b, _ = _court_booking_conflicts(court, owner_id, pref_date, t_slot)
                
                if not busy_b:
                    rate = float(owner.get("pricing", {}).get("standard", 1500))
                    indoor_name = owner.get('indoor_name', '')
                    court_name = court['name']
                    
                    new_booking = {
                        "owner_id":    owner_id,
                        "player_id":   group_doc.get("created_by", group_doc["players"][0]["player_id"]),
                        "team":        f"{sport} Squad Auto-Match",
                        "user_phone":  "Auto-Match",
                        "user_email":  "Auto-Match",
                        "court":       court_name,
                        "court_id":    court_id,
                        "sport":       sport,
                        "date":        pref_date,
                        "time":        t_slot,
                        "amount":      rate,
                        "players":     group_doc.get("player_count", 10),
                        "status":      "Pending",
                        "type":        "player_online",
                        "indoor_name": indoor_name,
                        "booked_at":   datetime.datetime.utcnow(),
                        "group_id":    str(group_doc["_id"])
                    }
                    db.bookings.insert_one(new_booking)
                    
                    notif_msg = f"FindMe: Court Booked! Your {sport} match at {indoor_name} ({court_name}) on {pref_date} at {t_slot} is confirmed. Enjoy your game!"
                    for p in group_doc.get("players", []):
                        _push_notification(p["player_id"], "Court Booked! 🎯", notif_msg)
                        _send_real_notifications(p["player_id"], "FINDME: Court Booking Confirmed!", notif_msg)
                    
                    db.notifications.insert_one({
                        "owner_id": owner_id,
                        "title": "System Auto-Booking! 📅",
                        "message": f"An Auto-Matched Squad was booked for {court_name} on {pref_date} at {t_slot}.",
                        "read": False,
                        "type": "booking",
                        "created_at": datetime.datetime.utcnow()
                    })
                    
                    db.match_groups.update_one({"_id": group_doc["_id"]}, {"$set": {"status": "booked"}})
                    return True  # success
                    
    return False # could not find any court



# ── 10. Find substitute players ───────────────────────────────────────────────
@player_bp.route('/api/players/available', methods=['GET'])
def get_available_players():
    """
    Query: district (required), town (optional), sport (optional)
    Returns individual players who have set their preferences to this area and sport.
    """
    try:
        district = request.args.get("district", "").strip()
        town     = request.args.get("town", "").strip()
        sport    = request.args.get("sport", "").strip()
        is_team  = request.args.get("is_team", "false").lower() == "true"

        query = {}
        if is_team:
            query["is_team"] = True
        else:
            query["is_team"] = {"$ne": True}
            
        if district:
            query["district"] = district
        if town:
            query["town"] = town
        if sport:
            query["sport"] = sport

        schedules = list(db.availability_schedules.find(query))
        
        results = []
        for s in schedules:
            pid = str(s["player_id"])
            user = db.users.find_one({"_id": ObjectId(pid), "role": "player"})
            if not user:
                continue
                
            results.append({
                "player_id": pid,
                "name": user.get("name", "Player"),
                "sport": s.get("sport"),
                "preferred_days": s.get("preferred_days", []),
                "preferred_time": s.get("preferred_time", "Anytime"),
                "area": s.get("area", ""),
                "is_team": s.get("is_team", False)
            })

        return jsonify({"players": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11. Send a join request to a player ──────────────────────────────────────
@player_bp.route('/api/players/invite', methods=['POST'])
def invite_player():
    """
    Body: { from_player_id, to_player_id, sport, area, type }
    Creates a persistent join_request record + pushes a notification.
    """
    try:
        data    = request.json
        from_id = data.get("from_player_id")
        to_id   = data.get("to_player_id")
        sport   = data.get("sport", "a sport")
        area    = data.get("area", "your area")
        req_type = data.get("type", "invite")   # "invite" | "challenge"

        if not from_id or not to_id:
            return jsonify({"error": "Sender and receiver IDs required."}), 400

        # Prevent duplicate pending requests
        existing = db.join_requests.find_one({
            "from_id": from_id, "to_id": to_id,
            "sport": sport, "status": "pending"
        })
        if existing:
            return jsonify({"message": "Request already sent.", "request_id": str(existing["_id"])}), 200

        sender = db.users.find_one({"_id": ObjectId(from_id)})
        phone  = sender.get("phone", "N/A") if sender else "N/A"
        name   = sender.get("name", "A player") if sender else "A player"

        is_challenge = req_type == "challenge"

        recipient = db.users.find_one({"_id": ObjectId(to_id)})
        to_name   = recipient.get("name", "Player") if recipient else "Player"

        # Find the sender's open group to link
        open_group = db.match_groups.find_one({
            "status": "open",
            "sport": sport,
            "players": {"$elemMatch": {"player_id": from_id}}
        })
        group_id_str = str(open_group["_id"]) if open_group else None

        # Persist the request record
        req_doc = {
            "from_id":    from_id,
            "to_id":      to_id,
            "from_name":  name,
            "to_name":    to_name,
            "from_phone": phone,
            "sport":      sport,
            "area":       area,
            "type":       req_type,
            "group_id":   group_id_str,
            "status":     "pending",
            "created_at": datetime.datetime.utcnow(),
        }
        result = db.join_requests.insert_one(req_doc)
        req_id = str(result.inserted_id)

        if is_challenge:
            notif_msg  = f"{name}'s squad has challenged your team for a {sport} match in {area}! Open the app to Accept or Decline."
            title      = "Squad Challenge! ⚔️"
        else:
            notif_msg  = f"{name} wants you to join their {sport} team in {area}! Open the app to Accept or Decline."
            title      = "Join Request! 🏅"

        db.notifications.insert_one({
            "player_id":  to_id,
            "title":      title,
            "message":    notif_msg,
            "read":       False,
            "request_id": req_id,
            "created_at": datetime.datetime.utcnow(),
        })

        return jsonify({"message": "Request sent!", "request_id": req_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11a. Get incoming pending join requests for a player ──────────────────────
@player_bp.route('/api/players/requests', methods=['GET'])
def get_join_requests():
    """Query: player_id"""
    try:
        player_id = request.args.get("player_id")
        if not player_id:
            return jsonify({"error": "player_id required"}), 400
            
        # Also filter out chats deleted by this user
        reqs = list(db.join_requests.find(
            {"to_id": player_id, "deleted_by": {"$ne": player_id}},
            sort=[("created_at", -1)]
        ))
        for r in reqs:
            r["_id"] = str(r["_id"])
        return jsonify({"requests": reqs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11a-2. Get SENT (outgoing) requests by a player ──────────────────────────
@player_bp.route('/api/players/sent-requests', methods=['GET'])
def get_sent_requests():
    """Query: player_id — returns all requests this player sent (any status)."""
    try:
        player_id = request.args.get("player_id")
        if not player_id:
            return jsonify({"error": "player_id required"}), 400
            
        # Also filter out chats deleted by this user
        reqs = list(db.join_requests.find(
            {"from_id": player_id, "deleted_by": {"$ne": player_id}},
            sort=[("created_at", -1)]
        ))
        for r in reqs:
            r["_id"] = str(r["_id"])
        return jsonify({"requests": reqs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11b. Respond to a join request ───────────────────────────────────────────
@player_bp.route('/api/players/requests/<request_id>/respond', methods=['POST'])
def respond_to_request(request_id):
    """Body: { player_id, action: 'accept' | 'decline' }"""
    try:
        data      = request.json
        player_id = _norm_player_id(data.get("player_id"))
        action    = data.get("action")

        if action not in ("accept", "decline"):
            return jsonify({"error": "action must be 'accept' or 'decline'"}), 400
        if not player_id:
            return jsonify({"error": "player_id is required"}), 400

        req = db.join_requests.find_one({"_id": ObjectId(request_id)})
        if not req:
            return jsonify({"error": "Request not found"}), 404
        if _norm_player_id(req.get("to_id")) != player_id:
            return jsonify({"error": "Unauthorized"}), 403

        db.join_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": action + "d", "responded_at": datetime.datetime.utcnow()}}
        )

        player = db.users.find_one({"_id": ObjectId(player_id)})
        pname  = player.get("name", "The player") if player else "The player"

        if action == "accept":
            group_id = req.get("group_id")
            accepted_date = ""
            group = None
            
            if group_id:
                group = db.match_groups.find_one({"_id": ObjectId(group_id)})
                if group:
                    accepted_date = group.get("preferred_date", "")

            # KEY: remove this date from the available pool, but keep other dates
            player_pref = db.availability_schedules.find_one({"player_id": player_id})
            if player_pref:
                pref_days = player_pref.get("preferred_days", [])
                if accepted_date and accepted_date in pref_days:
                    pref_days.remove(accepted_date)
                
                if not pref_days or not accepted_date:
                    db.availability_schedules.delete_one({"player_id": player_id})
                else:
                    db.availability_schedules.update_one(
                        {"player_id": player_id},
                        {"$set": {"preferred_days": pref_days}}
                    )
            
            # Remove player from any other open match groups for this same date
            pid_variants = _player_id_query_variants(player_id)
            cleanup_query = {
                "status": "open",
                "_id": {"$ne": ObjectId(group_id)} if group_id else {"$exists": True},
                "players": {"$elemMatch": {"player_id": {"$in": pid_variants}}},
            }
            if accepted_date:
                cleanup_query["preferred_date"] = accepted_date

            for grp in db.match_groups.find(cleanup_query):
                before = _sanitize_match_group_players(grp.get("players") or [])
                after = [p for p in before if p["player_id"] != player_id]
                if len(after) == len(before):
                    continue
                db.match_groups.update_one(
                    {"_id": grp["_id"]},
                    {"$set": {"players": after, "player_count": len(after)}},
                )
            # Cleanup any groups that became empty due to this
            db.match_groups.update_many(
                {"status": "open", "player_count": {"$lte": 0}},
                {"$set": {"status": "cancelled"}}
            )
            
            if group_id and group and group.get("status") in ("open", "confirmed"):
                    player_entry = {
                        "player_id": player_id,
                        "name":      pname,
                        "joined_at": datetime.datetime.utcnow(),
                        "paid":      False,
                    }
                    res = db.match_groups.update_one(
                        {
                            "_id": ObjectId(group_id),
                            "players": {"$not": {"$elemMatch": {"player_id": {"$in": pid_variants}}}},
                        },
                        {
                            "$push": {"players": player_entry},
                            "$inc": {"player_count": 1}
                        }
                    )
                    
                    if res.modified_count > 0:
                        updated_group = db.match_groups.find_one({"_id": ObjectId(group_id)})
                        g_times = set(x.strip() for x in updated_group.get("preferred_time", "").split(",") if x.strip())
                        
                        if player_pref and player_pref.get("preferred_time"):
                            p_times = set(x.strip() for x in player_pref.get("preferred_time", "").split(",") if x.strip())
                            if "Anytime" in g_times or not g_times:
                                intersected = p_times
                            elif "Anytime" in p_times:
                                intersected = g_times
                            else:
                                intersected = g_times.intersection(p_times)
                                
                            new_pref_time = _join_slots_chrono(intersected) if intersected else updated_group.get("preferred_time", "")
                            
                            db.match_groups.update_one(
                                {"_id": ObjectId(group_id)},
                                {"$set": {"preferred_time": new_pref_time}}
                            )
                            updated_group["preferred_time"] = new_pref_time
                        
                        sport = updated_group.get("sport", "Futsal")
                        group_capacity = SPORT_CAPACITIES.get(sport, 10)
                        if updated_group.get("player_count", 0) >= group_capacity:
                            _confirm_group(group_id, updated_group)

            _push_notification(
                req["from_id"],
                "Player Confirmed ✅",
                f"{pname} accepted your request and will join your {req.get('sport','')} team in {req.get('area','')}!"
            )
            _push_notification(
                player_id,
                "You're In! 🏆",
                f"You accepted {req.get('from_name','')}'s request. Your availability has been removed. Good luck!"
            )
        else:
            _push_notification(
                req["from_id"],
                "Request Declined",
                f"Your join request for {req.get('sport','')} in {req.get('area','')} was declined."
            )

        return jsonify({"message": f"Request {action}d."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11c. Withdraw own sent request ────────────────────────────────────────────
@player_bp.route('/api/players/requests/<request_id>/withdraw', methods=['POST'])
def withdraw_request(request_id):
    """Body: { player_id }"""
    try:
        player_id = request.json.get("player_id")
        req = db.join_requests.find_one({"_id": ObjectId(request_id)})
        if not req:
            return jsonify({"error": "Request not found"}), 404
        if req["from_id"] != player_id:
            return jsonify({"error": "Unauthorized"}), 403
        db.join_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "withdrawn"}}
        )
        return jsonify({"message": "Request withdrawn."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@player_bp.route('/api/players/requests/<request_id>/delete', methods=['POST'])
def delete_join_request(request_id):
    """Permanently removes the join request, its chat thread, and related notifications."""
    try:
        if not ObjectId.is_valid(request_id):
            return jsonify({"error": "Invalid request id"}), 400
        data = request.json or {}
        player_id = _norm_player_id(data.get("player_id"))
        if not player_id:
            return jsonify({"error": "player_id required"}), 400

        req = db.join_requests.find_one({"_id": ObjectId(request_id)})
        if not req:
            return jsonify({"error": "Request not found"}), 404
        if _norm_player_id(req.get("from_id")) != player_id and _norm_player_id(req.get("to_id")) != player_id:
            return jsonify({"error": "Unauthorized"}), 403

        rid = str(request_id)
        db.chat_messages.delete_many({"group_id": f"req:{rid}"})
        db.notifications.delete_many({"request_id": rid})
        db.join_requests.delete_one({"_id": ObjectId(request_id)})
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@player_bp.route('/api/turfs', methods=['GET'])
def get_turfs():
    """
    Query: district (required), province (optional), town (optional), sport (optional)
    Returns list of turf owners whose address matches the given district.
    """
    try:
        district = request.args.get("district", "").strip()
        province = request.args.get("province", "").strip()
        town     = request.args.get("town", "").strip()
        sport    = request.args.get("sport", "").strip()

        query = {"role": "turf_owner"}
        if district:
            query["address.district"] = district
        if province:
            query["address.province"] = province
        if town:
            query["address.town"] = town

        owners = list(db.users.find(query, {
            "password": 0  # never send passwords
        }))

        results = []
        for o in owners:
            owner_id = str(o["_id"])
            o["_id"] = owner_id

            # Fetch courts for this owner
            court_query = {"owner_id": owner_id, "status": "Available"}
            if sport:
                court_query["sport"] = sport
            courts = list(db.courts.find(court_query))
            for c in courts:
                c["_id"] = str(c["_id"])

            if not courts:
                continue  # skip venues with no available courts

            results.append({
                "_id":         owner_id,
                "indoor_name": o.get("indoor_name", "Indoor Facility"),
                "address":     o.get("address", {}),
                "timing":      o.get("timing", {"open": "06:00", "close": "23:00"}),
                "pricing":     o.get("pricing", {}),
                "turf_image":  o.get("turf_image"),
                "phone":       o.get("phone", ""),
                "courts":      courts,
            })

        return jsonify({"turfs": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11. Player books a court slot ──────────────────────────────────────────────
@player_bp.route('/api/player/book', methods=['POST'])
def player_book_court():
    """
    Body: {
        player_id, owner_id, court_id, court_name, sport,
        date, time_slot, amount, indoor_name
    }
    Creates a booking visible on the owner's dashboard.
    """
    try:
        data      = request.json
        player_id = data.get("player_id")
        owner_id  = data.get("owner_id")
        court_id  = data.get("court_id")
        date      = data.get("date")
        time_slot = data.get("time_slot")
        indoor_name = data.get("indoor_name", "")
        court_name = data.get("court_name", "Court")

        if not all([player_id, owner_id, court_id]):
            return jsonify({"error": "player_id, owner_id, court_id are required"}), 400

        # Verify court exists and is available
        court = db.courts.find_one({"_id": ObjectId(court_id)})
        if not court:
            return jsonify({"error": "Court not found"}), 404
        if court.get("status") != "Available":
            return jsonify({"error": "Court is not available"}), 409

        co = {str(x) for x in _owner_id_variants(court.get("owner_id"))}
        ro = {str(x) for x in _owner_id_variants(owner_id)}
        if not (co & ro):
            return jsonify({"error": "Court does not belong to this facility."}), 403

        slot_busy, slot_msg = _court_booking_conflicts(court, owner_id, date, time_slot)
        if slot_busy:
            return jsonify({"error": slot_msg}), 409

        # DOUBLE BOOKING CHECK (same player, other commitments)
        is_busy, msg = _is_player_busy(player_id, date, time_slot)
        if is_busy:
            return jsonify({"error": msg}), 400

        # Fetch player info
        player = db.users.find_one({"_id": ObjectId(player_id)})
        player_name  = player.get("name", "Player") if player else "Player"
        player_phone = player.get("phone", "N/A")  if player else "N/A"
        player_email = player.get("email", "N/A")  if player else "N/A"

        new_booking = {
            "owner_id":    owner_id,
            "player_id":   player_id,
            "team":        player_name,
            "user_phone":  player_phone,
            "user_email":  player_email,
            "court":       court_name,
            "court_id":    court_id,
            "sport":       data.get("sport", court.get("sport", "Unknown")),
            "date":        data.get("date"),
            "time":        data.get("time_slot"),
            "amount":      float(data.get("amount", 0)),
            "players":     1,
            "status":      "Pending",
            "type":        "player_online",
            "indoor_name": data.get("indoor_name", ""),
            "booked_at":   datetime.datetime.utcnow(),
        }

        result = db.bookings.insert_one(new_booking)
        new_booking["_id"] = str(result.inserted_id)
        new_booking["id"]  = str(result.inserted_id)

        # Notify player
        _push_notification(player_id, "Booking Submitted",
                           f"Your booking at {data.get('indoor_name')} on {data.get('date')} ({data.get('time_slot')}) is pending confirmation.")

        # Notify Owner
        db.notifications.insert_one({
            "owner_id": owner_id,
            "title": "New Web Booking! 📅",
            "message": f"{player_name} booked {data.get('court_name', 'a court')} on {data.get('date')} at {data.get('time_slot')}.",
            "read": False,
            "type": "booking",
            "created_at": datetime.datetime.utcnow()
        })

        return jsonify({"message": "Booking created!", "booking": new_booking}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 12. Get player's court bookings ───────────────────────────────────────────
@player_bp.route('/api/player/bookings/<player_id>', methods=['GET'])
def get_player_bookings(player_id):
    """Return all direct court bookings made by this player."""
    try:
        bookings = list(db.bookings.find(
            {"player_id": player_id, "type": "player_online"},
            sort=[("booked_at", -1)]
        ))
        for b in bookings:
            b["_id"] = str(b["_id"])
        return jsonify({"bookings": bookings}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/player/bookings/<booking_id>/cancel', methods=['POST'])
def cancel_player_booking(booking_id):
    try:
        data = request.json
        player_id = data.get("player_id")

        booking = db.bookings.find_one({"_id": ObjectId(booking_id)})
        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        if booking.get("player_id") != player_id:
            return jsonify({"error": "Unauthorized"}), 403

        if booking.get("status") == "Cancelled":
            return jsonify({"error": "Booking already cancelled"}), 400

        db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"status": "Cancelled", "cancelled_at": datetime.datetime.utcnow()}}
        )

        owner_id = booking.get("owner_id")
        if owner_id:
            db.notifications.insert_one({
                "owner_id": owner_id,
                "title": "Booking Cancelled ❌",
                "message": f"A player cancelled their booking for {booking.get('court', 'a court')} on {booking.get('date')} at {booking.get('time')}.",
                "read": False,
                "type": "booking",
                "created_at": datetime.datetime.utcnow()
            })

        return jsonify({"message": "Booking Cancelled"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/courts/<court_id>/busy-slots', methods=['GET'])
def get_busy_slots(court_id):
    try:
        date = request.args.get('date')
        if not date:
            return jsonify({'busy': []}), 200
        court = db.courts.find_one({'_id': ObjectId(court_id)})
        if not court:
            return jsonify({'busy': []}), 200
        c_oid = str(court_id)
        court_id_clauses = [{"court_id": c_oid}]
        if ObjectId.is_valid(c_oid):
            court_id_clauses.append({"court_id": ObjectId(c_oid)})
        ovars = _owner_id_variants(court.get("owner_id"))
        c_name = (court.get("name") or "").strip()
        q = {
            "date": date,
            "status": {"$ne": "Cancelled"},
            "$or": court_id_clauses + [
                {
                    "$and": [
                        {"owner_id": {"$in": ovars}},
                        {"court": c_name},
                        {"$or": [{"court_id": {"$exists": False}}, {"court_id": None}, {"court_id": ""}]},
                    ]
                }
            ],
        }
        busy_labels = set()
        for b in db.bookings.find(q):
            t = b.get("time") or b.get("timeSlot")
            if t:
                busy_labels.update(_expand_busy_time_labels(t))
        return jsonify({'busy': list(busy_labels)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@player_bp.route('/api/player/profile', methods=['GET'])
def get_player_profile():
    try:
        player_id = request.args.get('player_id')
        if not player_id:
            return jsonify({"error": "Player ID missing"}), 400
        
        user = db.users.find_one({"_id": ObjectId(player_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user['_id'] = str(user['_id'])
        if 'password' in user: del user['password']
        
        # Ensure phone exists if mobile is there
        if 'phone' not in user and 'mobile' in user:
            user['phone'] = user['mobile']

        return jsonify({"success": True, "user": user})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/player/profile', methods=['PUT'])
def update_player_profile():
    try:
        data = request.json
        player_id = data.get('player_id')
        if not player_id:
            return jsonify({"error": "Player ID missing"}), 400

        # Build update fields
        update_fields = {}
        allowed = ['name', 'phone', 'email', 'province', 'district', 'city', 'profile_picture']
        for key in allowed:
            if key in data:
                update_fields[key] = data[key]

        # Also sync to 'address' object for compatibility
        if any(k in data for k in ['province', 'district', 'city']):
            update_fields['address'] = {
                'province': data.get('province') or '',
                'district': data.get('district') or '',
                'town': data.get('city') or ''   # Using town for compatibility with existing address structure
            }
            # For players, area is often stored at root
            update_fields['area'] = data.get('city') or ''

        if not update_fields:
            return jsonify({"error": "No update fields provided"}), 400

        db.users.update_one({"_id": ObjectId(player_id)}, {"$set": update_fields})
        
        # Get updated user
        user = db.users.find_one({"_id": ObjectId(player_id)})
        user['_id'] = str(user['_id'])
        if 'password' in user: del user['password']

        return jsonify({"success": True, "user": user})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _serialize_chat_message(doc):
    """Make chat docs JSON-safe (ObjectId/datetime → strings)."""
    if not doc:
        return doc
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out[k] = str(v)
        elif k == "player_id":
            out[k] = _norm_player_id(v)
        elif k == "group_id":
            out[k] = str(v) if v is not None else ""
        elif isinstance(v, (datetime.datetime, datetime.date)):
            out[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        else:
            out[k] = v
    return out


# ── 12. Group Chat ────────────────────────────────────────────────────────────
@player_bp.route('/api/matches/<group_id>/chat', methods=['POST'])
def send_chat_message(group_id):
    try:
        data = request.json or {}
        player_id = _norm_player_id(data.get("player_id"))
        if not player_id or not ObjectId.is_valid(player_id):
            return jsonify({"error": "Invalid player_id"}), 400
        user_doc = db.users.find_one({"_id": ObjectId(player_id)})
        sender_name = user_doc.get("name", "Unknown") if user_doc else "Unknown"

        body = (data.get("message") or "").strip()
        if not body:
            return jsonify({"error": "Message cannot be empty."}), 400

        msg = {
            "group_id": str(group_id),
            "player_id": player_id,
            "name": sender_name,
            "message": body,
            "created_at": datetime.datetime.utcnow()
        }
        result = db.chat_messages.insert_one(msg)
        msg["_id"] = str(result.inserted_id)
        return jsonify({"message": _serialize_chat_message(msg)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/matches/<group_id>/chat', methods=['GET'])
def get_chat_messages(group_id):
    try:
        messages = list(db.chat_messages.find({"group_id": str(group_id)}).sort("created_at", 1))
        return jsonify({"messages": [_serialize_chat_message(m) for m in messages]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── 12b. Direct Request Chat (captain ↔ player before/after payment) ──────────
@player_bp.route('/api/requests/<request_id>/chat', methods=['POST'])
def send_request_chat_message(request_id):
    try:
        if not ObjectId.is_valid(request_id):
            return jsonify({"error": "Invalid request id"}), 400

        data = request.json or {}
        player_id = _norm_player_id(data.get("player_id"))
        if not player_id or not ObjectId.is_valid(player_id):
            return jsonify({"error": "Invalid player_id"}), 400

        req = db.join_requests.find_one({"_id": ObjectId(request_id)})
        if not req:
            return jsonify({"error": "Request not found"}), 404
        if _norm_player_id(req.get("from_id")) != player_id and _norm_player_id(req.get("to_id")) != player_id:
            return jsonify({"error": "You are not a participant in this chat"}), 403

        user_doc = db.users.find_one({"_id": ObjectId(player_id)})
        sender_name = user_doc.get("name", "Unknown") if user_doc else "Unknown"

        body = (data.get("message") or "").strip()
        if not body:
            return jsonify({"error": "Message cannot be empty."}), 400

        msg = {
            "group_id": f"req:{request_id}",
            "player_id": player_id,
            "name": sender_name,
            "message": body,
            "created_at": datetime.datetime.utcnow()
        }
        result = db.chat_messages.insert_one(msg)
        msg["_id"] = str(result.inserted_id)
        return jsonify({"message": _serialize_chat_message(msg)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/requests/<request_id>/chat', methods=['GET'])
def get_request_chat_messages(request_id):
    try:
        if not ObjectId.is_valid(request_id):
            return jsonify({"error": "Invalid request id"}), 400
        player_id = _norm_player_id(request.args.get("player_id"))
        if not player_id or not ObjectId.is_valid(player_id):
            return jsonify({"error": "player_id query required"}), 400
        req = db.join_requests.find_one({"_id": ObjectId(request_id)})
        if not req:
            return jsonify({"error": "Request not found"}), 404
        if _norm_player_id(req.get("from_id")) != player_id and _norm_player_id(req.get("to_id")) != player_id:
            return jsonify({"error": "You are not a participant in this chat"}), 403

        messages = list(db.chat_messages.find({"group_id": f"req:{request_id}"}).sort("created_at", 1))
        return jsonify({"messages": [_serialize_chat_message(m) for m in messages]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── 13. Upcoming Schedule ─────────────────────────────────────────────────────
@player_bp.route('/api/player/upcoming/<player_id>', methods=['GET'])
def get_upcoming_schedule(player_id):
    try:
        from datetime import datetime
        now = datetime.now()
        upcoming = []

        # 1. Bookings
        bookings = list(db.bookings.find({
            "player_id": player_id,
            "status": {"$in": ["Pending", "Confirmed"]}
        }))
        for b in bookings:
            date_str = b.get("date")
            time_str = b.get("time")
            if date_str and time_str:
                start_time_str = _earliest_slot_start_str(time_str)
                if not start_time_str:
                    continue
                try:
                    dt_str = f"{date_str} {start_time_str}"
                    try:
                        dt = datetime.strptime(dt_str, "%Y-%m-%d %I:%M %p")
                    except:
                        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
                        
                    if dt > now:
                        upcoming.append({
                            "type": "booking",
                            "title": b.get("indoor_name", b.get("court", "Court Booking")),
                            "subtitle": f"{b.get('sport')} • {b.get('court')}",
                            "datetime_str": f"{date_str} at {start_time_str}",
                            "datetime": dt.isoformat()
                        })
                except Exception as ex:
                    print("Parse error booking:", ex)

        # 2. Match Groups
        groups = list(db.match_groups.find({
            "players.player_id": player_id,
            "status": {"$in": ["confirmed", "booked", "fully_paid"]}
        }))
        for g in groups:
            date_str = g.get("preferred_date")
            time_str = g.get("preferred_time")
            if date_str and time_str and time_str != "Anytime":
                start_time_str = _earliest_slot_start_str(time_str)
                if not start_time_str:
                    continue
                try:
                    dt_str = f"{date_str} {start_time_str}"
                    try:
                        dt = datetime.strptime(dt_str, "%Y-%m-%d %I:%M %p")
                    except:
                        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
                        
                    if dt > now:
                        upcoming.append({
                            "type": "match",
                            "title": f"Squad Match • {g.get('sport')}",
                            "subtitle": g.get("area", ""),
                            "datetime_str": f"{date_str} at {start_time_str}",
                            "datetime": dt.isoformat()
                        })
                except Exception as ex:
                    print("Parse error group:", ex)

        if not upcoming:
            return jsonify({"upcoming": None}), 200

        upcoming.sort(key=lambda x: x["datetime"])
        return jsonify({"upcoming": upcoming[0]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
