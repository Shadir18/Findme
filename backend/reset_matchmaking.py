from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["FindMeDB"]

# Clear match groups to restart testing
res_g = db.match_groups.delete_many({})
# Clear availability to allow re-saving same date/time
res_a = db.availability_schedules.delete_many({})

print(f"Cleared {res_g.deleted_count} match groups.")
print(f"Cleared {res_a.deleted_count} availability schedules.")
print("Database is ready for a clean 4-player matchmaking test!")
