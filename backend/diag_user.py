from pymongo import MongoClient
from bson.objectid import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client.FindMeDB # Correct DB name

# Try finding by exact email or case-insensitive
email_to_find = "mshadir499@icloud.com"
user = db.users.find_one({"email": {"$regex": f"^{email_to_find}$", "$options": "i"}})

if user:
    print("USER_DATA_FOUND:")
    for k, v in user.items():
        if k != 'password':
            print(f"{k}: {v}")
else:
    # List all users to see what's there
    print("USER_NOT_FOUND. LISTING ALL USERS:")
    for u in db.users.find().limit(5):
        print(f"Role: {u.get('role')} | Email: {u.get('email')} | Name: {u.get('name')}")
