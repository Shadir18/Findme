from pymongo import MongoClient
from bson.objectid import ObjectId

client = MongoClient("mongodb://localhost:27017")
db = client.FindMeDB

# 1. Clear 'deleted_by' fields to restore hidden chats 
res = db.join_requests.update_many({}, {"$set": {"deleted_by": []}})
print(f"Cleared 'deleted_by' in {res.modified_count} join_requests.")

# 2. Sync players collection from users (Repair MatchGrid)
players = db.users.find({"role": "player"})
db.players.delete_many({}) # Clear old broken collection
count = 0
for p in players:
    # Look for availability
    sched = db.availability_schedules.find_one({"player_id": str(p["_id"])})
    player_doc = {
        "name": p.get("name"),
        "sport": sched.get("sport", "Futsal") if sched else "Futsal",
        "city": p.get("address", {}).get("town", p.get("area", "Colombo")),
        "time_slot": sched.get("preferred_time", "Evening") if sched else "Evening"
    }
    db.players.insert_one(player_doc)
    count += 1
print(f"Synced {count} players to the legacy 'players' collection for public MatchGrid.")
