
import datetime
import random
from werkzeug.security import generate_password_hash
from database.db import db
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.getcwd())

def create_accounts():
    print("Creating 3 more user accounts...")
    
    password_hash = generate_password_hash("password123")
    today = datetime.datetime.now()
    dates = [(today + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 6)]

    # 1. Player: Neymar Jr
    neymar = {
        "name": "Neymar Jr",
        "email": "neymar@example.com",
        "phone": "0771113333",
        "password": password_hash,
        "role": "player",
        "dob": "1992-02-05",
        "address": "Colombo",
        "city": "Colombo",
        "district": "Colombo",
        "province": "Western",
        "area": "Colombo"
    }
    
    if db.users.find_one({"email": neymar["email"]}):
        db.users.delete_one({"email": neymar["email"]})
    
    res = db.users.insert_one(neymar)
    pid = str(res.inserted_id)
    db.availability_schedules.insert_one({
        "player_id": pid,
        "sport": "Futsal",
        "area": "Colombo",
        "preferred_days": random.sample(dates, 3),
        "preferred_time": "07:00 PM - 08:00 PM, 08:00 PM - 09:00 PM",
        "updated_at": datetime.datetime.utcnow()
    })
    print("Created Player: Neymar Jr")

    # 2. Player: Kylian Mbappe
    mbappe = {
        "name": "Kylian Mbappe",
        "email": "mbappe@example.com",
        "phone": "0774445555",
        "password": password_hash,
        "role": "player",
        "dob": "1998-12-20",
        "address": "Kandy",
        "city": "Kandy",
        "district": "Kandy",
        "province": "Central",
        "area": "Kandy"
    }
    
    if db.users.find_one({"email": mbappe["email"]}):
        db.users.delete_one({"email": mbappe["email"]})
        
    res = db.users.insert_one(mbappe)
    pid = str(res.inserted_id)
    db.availability_schedules.insert_one({
        "player_id": pid,
        "sport": "Futsal",
        "area": "Kandy",
        "preferred_days": random.sample(dates, 3),
        "preferred_time": "06:00 PM - 07:00 PM, 07:00 PM - 08:00 PM",
        "updated_at": datetime.datetime.utcnow()
    })
    print("Created Player: Kylian Mbappe")

    # 3. Owner: Zinedine Zidane
    zidane = {
        "name": "Zinedine Zidane",
        "email": "zidane@example.com",
        "phone": "0771112222",
        "password": password_hash,
        "role": "turf_owner",
        "indoor_name": "Zizou Arena",
        "address": "789 Galle Road, Colombo 04",
        "timing": "6:00 AM - 11:00 PM",
        "facilities": [{"sport": "Futsal", "count": 2}]
    }
    
    if db.users.find_one({"email": zidane["email"]}):
        # Clean up related courts too
        old_user = db.users.find_one({"email": zidane["email"]})
        db.courts.delete_many({"owner_id": str(old_user["_id"])})
        db.users.delete_one({"email": zidane["email"]})
        
    res = db.users.insert_one(zidane)
    oid = str(res.inserted_id)
    
    # Create courts for Zidane
    for i in range(2):
        db.courts.insert_one({
            "owner_id": oid,
            "name": f"Zizou Futsal {chr(65+i)}",
            "sport": "Futsal",
            "capacity": 10,
            "price_per_hour": 4500,
            "status": "Available",
            "available": True
        })
    print("Created Owner: Zinedine Zidane (Zizou Arena)")

if __name__ == "__main__":
    create_accounts()
