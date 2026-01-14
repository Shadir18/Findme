from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app) 

# MongoDB Atlas Connection
app.config["MONGO_URI"] = "mongodb+srv://mshadir287_db_user:it8oDNVQWClkwzjE@findme.j2uw9kp.mongodb.net/FindMe?retryWrites=true&w=majority"
mongo = PyMongo(app)

with app.app_context():
    try:
        mongo.cx.admin.command('ping')
        print("✅ Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# --- Authentication Routes ---

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        existing_user = mongo.db.Users.find_one({"email": data.get('email')})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        user_data = {
            "full_name": data.get('full_name'),
            "phone": data.get('phone'),
            "dob": data.get('dob'),
            "area": data.get('area'),
            "email": data.get('email'),
            "password": data.get('password'),
            "role": "player",
            "profile_photo": None
        }
        
        mongo.db.Users.insert_one(user_data)
        return jsonify({"message": "User registered successfully!", "user": user_data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/register/owner', methods=['POST'])
def register_owner():
    try:
        data = request.json
        existing_user = mongo.db.Users.find_one({"email": data.get('email')})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        owner_account = {
            "name": data.get('owner_name'),
            "email": data.get('email'),
            "password": data.get('password'),
            "phone": data.get('phone'),
            "role": "owner"
        }
        user_id = mongo.db.Users.insert_one(owner_account).inserted_id

        indoor_facility = {
            "owner_id": user_id,
            "name": data.get('indoor_name'),
            "address": data.get('address'),
            "province": data.get('province'),
            "district": data.get('district'),
            "town": data.get('town'),
            "rate": f"Rs. {data.get('hourly_rate')}",
            "opening_time": data.get('opening_time'),
            "closing_time": data.get('closing_time'),
            "turf_image": data.get('turf_image'),
            "calendar_availability": {} # The 365-day schedule object
        }
        mongo.db.Indoors.insert_one(indoor_facility)

        return jsonify({"message": "Owner and Facility registered!", "user": owner_account}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = mongo.db.Users.find_one({"email": email, "password": password})

    if user:
        user['_id'] = str(user['_id'])
        return jsonify({"status": "Success", "user": user}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# --- Indoor & Calendar Management ---

@app.route('/api/indoor/update-schedule', methods=['POST'])
def update_schedule():
    """Consolidated route to update the calendar availability."""
    try:
        data = request.json
        email = data.get('email')
        new_calendar = data.get('calendar_availability')

        user = mongo.db.Users.find_one({"email": email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        mongo.db.Indoors.update_one(
            {"owner_id": user['_id']},
            {"$set": {"calendar_availability": new_calendar}}
        )
        return jsonify({"message": "Calendar Updated Successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/indoors/nearby', methods=['GET'])
def get_nearby_indoors():
    """Supports fetching by town for players or by email for the owner dashboard."""
    email = request.args.get('email')
    town = request.args.get('town')
    
    if email:
        user = mongo.db.Users.find_one({"email": email})
        if user:
            indoors = list(mongo.db.Indoors.find({"owner_id": user['_id']}))
        else:
            return jsonify([]), 404
    elif town:
        indoors = list(mongo.db.Indoors.find({"town": town}))
    else:
        indoors = list(mongo.db.Indoors.find())

    # Format for JSON
    for i in indoors:
        i['_id'] = str(i['_id'])
        i['owner_id'] = str(i['owner_id'])
        
    return jsonify(indoors), 200

# --- Photo Management ---

@app.route('/api/user/update-photo', methods=['POST'])
def update_photo():
    try:
        data = request.json
        mongo.db.Users.update_one(
            {"email": data.get('email')},
            {"$set": {"profile_photo": data.get('image')}}
        )
        return jsonify({"message": "Photo updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Player Discovery ---

@app.route('/api/players', methods=['GET'])
def get_players():
    area = request.args.get('area')
    query = {"role": "player"}
    if area:
        query["area"] = area
    players = list(mongo.db.Users.find(query, {"_id": 0, "password": 0}))
    return jsonify(players), 200

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    if data.get('otp') == "123456":
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)