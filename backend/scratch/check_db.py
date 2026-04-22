from pymongo import MongoClient
import os

client = MongoClient("mongodb://localhost:27017")
db = client.FindMeDB

collections = db.list_collection_names()
print(f"Collections: {collections}")

for coll in collections:
    count = db[coll].count_documents({})
    print(f"{coll}: {count} documents")

# Check some sample join requests
print("\nSample Join Requests:")
for req in db.join_requests.find().limit(5):
    print(req)

# Check some sample availability
print("\nSample Availability:")
for pref in db.availability_schedules.find().limit(5):
    print(pref)
