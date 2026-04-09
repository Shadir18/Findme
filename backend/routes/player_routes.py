from flask import Blueprint, request, jsonify
# NOTE: /api/turfs and /api/player/book are defined at the bottom
from database.db import db
from bson.objectid import ObjectId
import datetime

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

def _serialize(doc):
    """Convert MongoDB doc to JSON-safe dict."""
    doc["_id"] = str(doc["_id"])
    return doc


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

        prefs = {
            "player_id": player_id,
            "sport":      data.get("sport"),
            "area":       data.get("area", "").strip(),
            "province":   data.get("province", ""),
            "district":   data.get("district", ""),
            "town":       data.get("town", ""),
            "preferred_days":  data.get("preferred_days", []),
            "preferred_time":  data.get("preferred_time"),   # "morning" | "afternoon" | "evening"
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
        groups_cursor = db.match_groups.find({
            "sport":  sport,
            "area":   area,
            "status": "open",
            "players": {"$not": {"$elemMatch": {"player_id": player_id}}}
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
        player_id = data.get("player_id")
        group_id  = data.get("group_id")

        group = db.match_groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Match group not found"}), 404

        # Check player not already in group
        already = any(p["player_id"] == player_id for p in group.get("players", []))
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

        db.match_groups.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"players": player_entry}, "$inc": {"player_count": 1}}
        )

        # Check if group is now full → confirm booking
        updated = db.match_groups.find_one({"_id": ObjectId(group_id)})
        capacity = SPORT_CAPACITIES.get(updated.get("sport", ""), 10)
        if updated.get("player_count", 0) >= capacity:
            _confirm_group(group_id, updated)

        return jsonify({"message": "Joined successfully!", "group_id": group_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 4. Get all match groups for a player ─────────────────────────────────────
@player_bp.route('/api/player/matches/<player_id>', methods=['GET'])
def get_player_matches(player_id):
    """Return all groups this player belongs to."""
    try:
        groups_cursor = db.match_groups.find({
            "players": {"$elemMatch": {"player_id": player_id}}
        }).sort("created_at", -1)

        groups = []
        for g in groups_cursor:
            g["_id"] = str(g["_id"])
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
        player_id = data.get("player_id")

        group = db.match_groups.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Group not found"}), 404

        # Mark this player as paid
        db.match_groups.update_one(
            {"_id": ObjectId(group_id), "players.player_id": player_id},
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
        player_id = data.get("player_id")
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
    sport = prefs.get("sport")
    area  = prefs.get("area", "")
    if not sport or not area:
        return

    # Is player already in an open group for this sport+area?
    existing = db.match_groups.find_one({
        "sport":  sport,
        "area":   area,
        "status": "open",
        "players": {"$elemMatch": {"player_id": player_id}},
    })
    if existing:
        return  # already queued

    # Find an open group with space
    capacity = SPORT_CAPACITIES.get(sport, 10)
    open_group = db.match_groups.find_one({
        "sport":        sport,
        "area":         area,
        "status":       "open",
        "player_count": {"$lt": capacity},
        "players": {"$not": {"$elemMatch": {"player_id": player_id}}},
    })

    player = db.users.find_one({"_id": ObjectId(player_id)})
    player_name = player.get("name", "Unknown") if player else "Unknown"

    player_entry = {
        "player_id": player_id,
        "name":      player_name,
        "joined_at": datetime.datetime.utcnow(),
        "paid":      False,
    }

    if open_group:
        # Join existing group
        db.match_groups.update_one(
            {"_id": open_group["_id"]},
            {"$push": {"players": player_entry}, "$inc": {"player_count": 1}}
        )
        updated = db.match_groups.find_one({"_id": open_group["_id"]})
        if updated.get("player_count", 0) >= capacity:
            _confirm_group(str(open_group["_id"]), updated)
        else:
            _push_notification(player_id, "You've been queued! ⏳",
                               f"You joined a {sport} group in {area}. {capacity - updated['player_count']} more players needed.")
    else:
        # Create new group
        new_group = {
            "sport":          sport,
            "area":           area,
            "preferred_time": prefs.get("preferred_time", "evening"),
            "preferred_date": "",
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
    """Mark group as confirmed and notify all players."""
    db.match_groups.update_one(
        {"_id": ObjectId(group_id)},
        {"$set": {"status": "confirmed", "confirmed_at": datetime.datetime.utcnow()}}
    )
    sport   = group_doc.get("sport", "")
    area    = group_doc.get("area", "")
    players = group_doc.get("players", [])

    for p in players:
        _push_notification(
            p["player_id"],
            "Match Confirmed! 🎉",
            f"Your {sport} match in {area} is FULL and CONFIRMED! Please complete payment to lock your spot."
        )


def _push_notification(player_id, title, message):
    db.notifications.insert_one({
        "player_id":  player_id,
        "title":      title,
        "message":    message,
        "read":       False,
        "created_at": datetime.datetime.utcnow(),
    })



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

        query = {}
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
                "area": s.get("area", "")
            })

        return jsonify({"players": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 11. Send a direct invite to a player ──────────────────────────────────────
@player_bp.route('/api/players/invite', methods=['POST'])
def invite_player():
    """
    Body: { from_player_id, to_player_id, sport, area, message }
    """
    try:
        data = request.json
        from_id = data.get("from_player_id")
        to_id   = data.get("to_player_id")
        sport   = data.get("sport", "a sport")
        area    = data.get("area", "your area")
        
        if not from_id or not to_id:
            return jsonify({"error": "Sender and receiver IDs required."}), 400

        sender = db.users.find_one({"_id": ObjectId(from_id)})
        phone  = sender.get("phone", "N/A") if sender else "N/A"
        name   = sender.get("name", "A player") if sender else "A player"

        notif_msg = f"{name} is looking for a ringer for a {sport} match in {area}! Call them at {phone} to join their team."
        
        _push_notification(to_id, "Substitution Request! 🏅", notif_msg)

        return jsonify({"message": "Invite sent successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── 12. Browse available turfs by location ────────────────────────────────────
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

        if not all([player_id, owner_id, court_id]):
            return jsonify({"error": "player_id, owner_id, court_id are required"}), 400

        # Verify court exists and is available
        court = db.courts.find_one({"_id": ObjectId(court_id)})
        if not court:
            return jsonify({"error": "Court not found"}), 404
        if court.get("status") != "Available":
            return jsonify({"error": "Court is not available"}), 409

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
            "court":       data.get("court_name", court.get("name", "Court")),
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

@player_bp.route('/api/courts/<court_id>/busy-slots', methods=['GET'])
def get_busy_slots(court_id):
    try:
        date = request.args.get('date')
        if not date: return jsonify({'busy': []}), 200
        query = {'court_id': court_id, 'date': date, 'status': {'$ne': 'Cancelled'}}
        busy = [b.get('time') for b in db.bookings.find(query) if b.get('time')]
        court = db.courts.find_one({'_id': ObjectId(court_id)})
        if court:
            m_query = {'owner_id': court['owner_id'], 'court': court['name'], 'date': date, 'status': {'$ne': 'Cancelled'}, 'court_id': {'$exists': False}}
            busy.extend([b.get('time') for b in db.bookings.find(m_query) if b.get('time')])
        return jsonify({'busy': list(set(busy))}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
