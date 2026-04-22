from database.db import db
from bson.objectid import ObjectId

def check():
    print("--- USERS ---")
    for u in db.users.find():
        print(f"ID: {u['_id']}, Email: {u.get('email')}, Role: {u.get('role')}")

    print("\n--- BOOKINGS ---")
    count = db.bookings.count_documents({})
    print(f"Total Bookings: {count}")
    if count > 0:
        b = db.bookings.find_one()
        print(f"Sample Booking: PlayerID: {b.get('player_id')}, Date: {b.get('date')}, Status: {b.get('status')}")

    print("\n--- AVAILABILITY ---")
    count = db.availability_schedules.count_documents({})
    print(f"Total Schedules: {count}")
    
    print("\n--- MATCH GROUPS ---")
    count = db.match_groups.count_documents({})
    print(f"Total Match Groups: {count}")

if __name__ == "__main__":
    check()
