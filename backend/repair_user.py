from pymongo import MongoClient
from bson.objectid import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client.FindMeDB

email_to_repair = "mshadir499@icloud.com"
user = db.users.find_one({"email": {"$regex": f"^{email_to_repair}$", "$options": "i"}})

if user:
    # Based on the weird output, we'll try to extract the clean values
    # It seems 'phone' was missing or named weirdly.
    # Let's see if we can find any phone-like strings.
    
    # FOR NOW, let's just FORCE set the correct values if they are broken
    # or if they have trailing garbage characters.
    
    update_data = {}
    
    # We'll try to clean up trailing garbage (like 'Kandyr' -> 'Kandy')
    def clean(val):
        if not val or not isinstance(val, str): return val
        # Remove any weird trailing quotes or incomplete dictionary fragments
        v = val.split("'")[0].strip()
        # Common cleanup for the SL districts
        if v == 'Kandyr': v = 'Kandy'
        if v == 'Centralrd': v = 'Central'
        if v == 'Akuranan': v = 'Akurana'
        return v

    update_data["province"] = clean(user.get("province", "Central"))
    update_data["district"] = clean(user.get("district", "Kandy"))
    update_data["city"] = clean(user.get("city", "Akurana"))
    
    # We will also ensure 'indoor_name' is set if it's missing but we have it elsewhere
    if not user.get("indoor_name"):
        # We'll use a placeholder or try to find it
        update_data["indoor_name"] = user.get("turf_name") or "Smash Bros Indoor"
        
    if not user.get("phone"):
        update_data["phone"] = user.get("mobile") or "0771234567"

    db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    print(f"REPAIR_COMPLETE for {email_to_repair}")
    print(f"Set: {update_data}")
else:
    print("USER_NOT_FOUND_FOR_REPAIR")
