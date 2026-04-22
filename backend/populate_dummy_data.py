import datetime
import random
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
from database.db import db

def populate():
    print("Starting Dummy Data Injection...")

    # 1. Clear existing specific dummy data to avoid duplicates while keeping real users
    # We will delete users with @example.com to keep the developer's account safe.
    dummy_emails = ["owner_apex@example.com", "owner_elite@example.com", "john@example.com", "jane@example.com", "mike@example.com", "sarah@example.com", "david@example.com", "messi@example.com"]
    
    # Find IDs to cleanup related data
    dummy_users = list(db.users.find({"email": {"$in": dummy_emails}}))
    dummy_ids = [str(u["_id"]) for u in dummy_users]

    db.users.delete_many({"email": {"$in": dummy_emails}})
    db.courts.delete_many({"owner_id": {"$in": dummy_ids}})
    db.bookings.delete_many({"$or": [{"player_id": {"$in": dummy_ids}}, {"owner_id": {"$in": dummy_ids}}]})
    db.availability_schedules.delete_many({"player_id": {"$in": dummy_ids}})
    db.match_groups.delete_many({"created_by": {"$in": dummy_ids}})
    db.join_requests.delete_many({"$or": [{"from_id": {"$in": dummy_ids}}, {"to_id": {"$in": dummy_ids}}]})
    db.notifications.delete_many({"$or": [{"player_id": {"$in": dummy_ids}}, {"owner_id": {"$in": dummy_ids}}]})
    
    print("Cleaned up existing dummy data.")
    
    password_hash = generate_password_hash("password123")
    messi_password_hash = generate_password_hash("123456")
    
    # --- CREATE OWNERS ---
    owners = [
        {
            "name": "Alex Owner",
            "email": "owner_apex@example.com",
            "phone": "0771234567",
            "password": password_hash,
            "role": "turf_owner",
            "indoor_name": "Apex Arena",
            "address": "123 Port Road, Colombo 03",
            "timing": "6:00 AM - 12:00 AM",
            "facilities": [
                {"sport": "Futsal", "count": 2},
                {"sport": "Indoor Cricket", "count": 1}
            ]
        },
        {
            "name": "Samantha Owner",
            "email": "owner_elite@example.com",
            "phone": "0777654321",
            "password": password_hash,
            "role": "turf_owner",
            "indoor_name": "Elite Turf",
            "address": "45/A Havelock Road, Colombo 05",
            "timing": "24 Hours",
            "facilities": [
                {"sport": "Football", "count": 1},
                {"sport": "Futsal", "count": 1}
            ]
        }
    ]
    
    owner_ids = []
    for o in owners:
        res = db.users.insert_one(o)
        owner_ids.append(str(res.inserted_id))
        print(f"Added Owner: {o['indoor_name']}")

    # --- CREATE COURTS ---
    # (The auth_routes logic auto-creates courts on signup, but since we manually insert, we add them)
    courts_data = [
        {"owner_id": owner_ids[0], "name": "Apex Futsal A", "sport": "Futsal", "capacity": 10, "price_per_hour": 5000},
        {"owner_id": owner_ids[0], "name": "Apex Futsal B", "sport": "Futsal", "capacity": 10, "price_per_hour": 5000},
        {"owner_id": owner_ids[0], "name": "Apex Cricket", "sport": "Indoor Cricket", "capacity": 12, "price_per_hour": 3500},
        {"owner_id": owner_ids[1], "name": "Elite Main Pitch", "sport": "Football", "capacity": 22, "price_per_hour": 8000},
        {"owner_id": owner_ids[1], "name": "Elite Futsal", "sport": "Futsal", "capacity": 10, "price_per_hour": 4500},
    ]
    
    court_ids = []
    for c in courts_data:
        c["status"] = "Available"
        c["available"] = True
        res = db.courts.insert_one(c)
        court_ids.append(str(res.inserted_id))
    print(f"Added {len(court_ids)} Courts")

    # --- CREATE PLAYERS ---
    players = [
        {"name": "John Doe", "email": "john@example.com", "password": password_hash, "role": "player", "phone": "0771234567", "city": "Colombo", "district": "Colombo", "province": "Western"},
        {"name": "Jane Smith", "email": "jane@example.com", "password": password_hash, "role": "player", "phone": "0777654321", "city": "Kandy", "district": "Kandy", "province": "Central"},
        {"name": "Mike Ross", "email": "mike@example.com", "password": password_hash, "role": "player", "phone": "0711111111", "city": "Colombo", "district": "Colombo", "province": "Western"},
        {"name": "Sarah Connor", "email": "sarah@example.com", "password": password_hash, "role": "player", "phone": "0722222222", "city": "Colombo", "district": "Colombo", "province": "Western"},
        {"name": "David Gandy", "email": "david@example.com", "password": password_hash, "role": "player", "phone": "0755555555", "city": "Galle", "district": "Galle", "province": "Southern"},
        {"name": "Lionel Messi", "email": "messi@example.com", "password": messi_password_hash, "role": "player", "phone": "0770010101", "city": "Colombo", "district": "Colombo", "province": "Western"},
    ]
    
    player_ids = []
    for p in players:
        p["dob"] = "1995-05-15"
        res = db.users.insert_one(p)
        player_ids.append(str(res.inserted_id))
        print(f"Added Player: {p['name']}")

    # --- CREATE AVAILABILITY ---
    today = datetime.datetime.now()
    dates = [(today + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 6)]
    
    for pid in player_ids:
        db.availability_schedules.insert_one({
            "player_id": pid,
            "sport": "Futsal",
            "area": "Colombo",
            "preferred_days": random.sample(dates, 3),
            "preferred_time": "06:00 PM - 07:00 PM, 07:00 PM - 08:00 PM",
            "updated_at": datetime.datetime.utcnow()
        })
    print("Added Player Availability Schedules")

    # --- CREATE PAST BOOKINGS (For Analytics) ---
    past_dates = [(today - datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 30)]
    sports = ["Futsal", "Football", "Indoor Cricket"]
    
    for i in range(20):
        d = random.choice(past_dates)
        o_id = random.choice(owner_ids)
        p_id = random.choice(player_ids)
        s = random.choice(sports)
        
        db.bookings.insert_one({
            "owner_id": o_id,
            "player_id": p_id,
            "team": f"Team {random.randint(1,50)}",
            "date": d,
            "time": f"{random.randint(8, 22):02d}:00 - {random.randint(8, 22):02d}:00",
            "sport": s,
            "amount": random.choice([3000, 4500, 5000, 7500]),
            "status": "Confirmed",
            "type": "player_online",
            "indoor_name": "Apex Arena" if o_id == owner_ids[0] else "Elite Turf",
            "booked_at": datetime.datetime.utcnow()
        })
    print("Injected 20 Past Bookings for Analytics")

    # --- CREATE TODAY'S BOOKINGS (For initial Dashboard view) ---
    today_str = today.strftime("%Y-%m-%d")
    for i in range(3):
        o_id = random.choice(owner_ids)
        p_id = random.choice(player_ids)
        s = random.choice(sports)
        db.bookings.insert_one({
            "owner_id": o_id,
            "player_id": p_id,
            "team": f"Team {random.randint(1,50)}",
            "date": today_str,
            "time": f"{18 + i:02d}:00 - {19 + i:02d}:00",
            "sport": s,
            "amount": random.choice([3000, 4500, 5000]),
            "status": "Confirmed",
            "type": "player_online",
            "indoor_name": "Apex Arena" if o_id == owner_ids[0] else "Elite Turf",
            "booked_at": datetime.datetime.utcnow()
        })
    print("Added 3 Bookings for Today")

    # --- CREATE FUTURE BOOKINGS ---
    for i in range(5):
        d = random.choice(dates)
        db.bookings.insert_one({
            "owner_id": owner_ids[0],
            "player_id": player_ids[0],
            "team": "Strikers FC",
            "date": d,
            "time": "08:00 PM - 09:00 PM",
            "court": "Apex Futsal A",
            "sport": "Futsal",
            "amount": 5000,
            "status": "Confirmed",
            "type": "player_online",
            "booked_at": datetime.datetime.utcnow()
        })
    print("Added 5 Future Bookings")

    # --- CREATE MATCH GROUPS ---
    for i in range(3):
        db.match_groups.insert_one({
            "sport": "Futsal",
            "area": "Colombo",
            "preferred_time": "07:00 PM - 08:00 PM",
            "preferred_date": dates[i],
            "status": "open",
            "capacity": 10,
            "player_count": random.randint(1, 8),
            "players": [
                {"player_id": player_ids[0], "name": "John Doe", "paid": False, "joined_at": datetime.datetime.utcnow()}
            ],
            "created_by": player_ids[0],
            "created_at": datetime.datetime.utcnow()
        })
    print("Added 3 Open Match Groups")

    # --- CREATE JOIN REQUESTS ---
    # From Mike Ross (player_ids[2]) to John Doe (player_ids[0])
    req_res = db.join_requests.insert_one({
        "from_id": player_ids[2],
        "to_id": player_ids[0],
        "from_name": "Mike Ross",
        "to_name": "John Doe",
        "sport": "Futsal",
        "area": "Colombo",
        "status": "pending",
        "type": "invite",
        "created_at": datetime.datetime.utcnow()
    })
    req_id = str(req_res.inserted_id)

    # From Sarah Connor (player_ids[3]) to John Doe (player_ids[0])
    db.join_requests.insert_one({
        "from_id": player_ids[3],
        "to_id": player_ids[0],
        "from_name": "Sarah Connor",
        "to_name": "John Doe",
        "sport": "Football",
        "area": "Colombo",
        "status": "pending",
        "type": "challenge",
        "created_at": datetime.datetime.utcnow()
    })

    # Add notifications for these requests
    db.notifications.insert_one({
        "player_id": player_ids[0],
        "title": "Join Request! 🏅",
        "message": "Mike Ross wants you to join their Futsal team in Colombo! Open the app to Accept or Decline.",
        "read": False,
        "request_id": req_id,
        "created_at": datetime.datetime.utcnow()
    })
    print("Added 2 Join Requests and Notifications")

    # --- CREATE A CANCELLED BOOKING ---
    db.bookings.insert_one({
        "owner_id": owner_ids[0],
        "player_id": player_ids[0],
        "team": "John Doe",
        "date": dates[4],
        "time": "10:00 PM - 11:00 PM",
        "court": "Apex Futsal B",
        "sport": "Futsal",
        "amount": 5000,
        "status": "Cancelled",
        "type": "player_online",
        "booked_at": datetime.datetime.utcnow(),
        "cancelled_at": datetime.datetime.utcnow()
    })
    print("Added 1 Cancelled Booking")

    print("\nAll dummy data successfully injected! You can now login with:")
    print("Player (John): john@example.com / 123456")
    print("Player (Messi): messi@example.com / 123456")
    print("Owner: owner_apex@example.com / password123")

if __name__ == "__main__":
    populate()
