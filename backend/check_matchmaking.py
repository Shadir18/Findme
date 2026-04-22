from pymongo import MongoClient
import json
from bson import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client["FindMeDB"]

print("--- Availability Schedules ---")
for s in db.availability_schedules.find():
    print(s)

print("\n--- Match Groups ---")
for g in db.match_groups.find():
    print(g)
