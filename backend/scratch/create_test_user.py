
import datetime
from werkzeug.security import generate_password_hash
from database.db import db
import sys
import os

# Add the current directory and backend directory to sys.path so we can import from database.db
sys.path.append(os.getcwd())

def create_user():
    print("Creating a new user account...")
    
    email = "ronaldo@example.com"
    
    # Check if user already exists
    if db.users.find_one({"email": email}):
        print(f"User with email {email} already exists. Deleting it first...")
        db.users.delete_one({"email": email})

    password_hash = generate_password_hash("password123")
    
    new_user = {
        "name": "Cristiano Ronaldo",
        "email": email,
        "phone": "0770007777",
        "password": password_hash,
        "role": "player",
        "dob": "1985-02-05",
        "address": "Colombo",
        "city": "Colombo",
        "district": "Colombo",
        "province": "Western",
        "area": "Colombo"
    }
    
    res = db.users.insert_one(new_user)
    user_id = str(res.inserted_id)
    
    # Create an availability schedule for the new player so they show up in matchmaking
    today = datetime.datetime.now()
    dates = [(today + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 6)]
    
    db.availability_schedules.insert_one({
        "player_id": user_id,
        "sport": "Futsal",
        "area": "Colombo",
        "preferred_days": dates[:3],
        "preferred_time": "08:00 PM - 09:00 PM, 09:00 PM - 10:00 PM",
        "updated_at": datetime.datetime.utcnow()
    })
    
    print(f"Successfully created user: {new_user['name']}")
    print(f"Email: {email}")
    print(f"Password: password123")
    print(f"Role: {new_user['role']}")

if __name__ == "__main__":
    create_user()
