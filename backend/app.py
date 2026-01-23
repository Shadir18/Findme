from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app) 

# MongoDB Atlas Connection
# Ensure this URI is correct for your specific cluster
app.config["MONGO_URI"] = "mongodb+srv://mshadir287_db_user:it8oDNVQWClkwzjE@findme.j2uw9kp.mongodb.net/FindMe?retryWrites=true&w=majority"
mongo = PyMongo(app)

# Verification of database connection on startup
with app.app_context():
    try:
        mongo.cx.admin.command('ping')
        print("✅ Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# --- 1. AUTHENTICATION ROUTES ---

@app.route('/api/register', methods=['POST'])
def register_user():
    """Handles standard Athlete/Player registration."""
    try:
        data = request.json
        if mongo.db.Users.find_one({"email": data.get('email')}):
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
        
        # Convert _id to string for JSON return
        user_data['_id'] = str(user_data['_id'])
        return jsonify({"message": "User registered successfully!", "user": user_data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/register/owner', methods=['POST'])
def register_owner():
    """Handles Turf Owner registration with multi-sport and facility details."""
    try:
        data = request.json
        if mongo.db.Users.find_one({"email": data.get('email')}):
            return jsonify({"error": "Email already registered"}), 400

        # A. Create Owner Account in Users Collection
        owner_account = {
            "name": data.get('owner_name'),
            "email": data.get('email'),
            "password": data.get('password'),
            "phone": data.get('phone'),
            "role": "owner"
        }
        user_id = mongo.db.Users.insert_one(owner_account).inserted_id

        # B. Create Facility Entry in Indoors Collection
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
            "facilities": data.get('facilities', []), # Multi-sport array from frontend
            "calendar_availability": {} # Managed via Owner Dashboard
        }
        mongo.db.Indoors.insert_one(indoor_facility)

        owner_account['_id'] = str(user_id)
        return jsonify({"message": "Facility registered successfully!", "user": owner_account}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Generic login for both roles."""
    data = request.json
    user = mongo.db.Users.find_one({"email": data.get('email'), "password": data.get('password')})
    if user:
        user['_id'] = str(user['_id'])
        return jsonify({"status": "Success", "user": user}), 200
    return jsonify({"error": "Invalid email or password"}), 401

# --- 2. INDOOR & SCHEDULE MANAGEMENT ---

@app.route('/api/indoor/update-schedule', methods=['POST'])
def update_schedule():
    """Updates the 365-day calendar for a specific turf."""
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
        return jsonify({"message": "Calendar Sync Successful!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/indoors/nearby', methods=['GET'])
def get_nearby_indoors():
    """Fetches turfs based on location, sport type, or owner email."""
    email = request.args.get('email')
    town = request.args.get('town')
    sport = request.args.get('sport')
    
    query = {}
    if email:
        user = mongo.db.Users.find_one({"email": email})
        if user: query = {"owner_id": user['_id']}
    elif town:
        query["town"] = town
    
    if sport:
        # Searches within the multi-sport facilities array
        query["facilities.sport"] = sport

    indoors = list(mongo.db.Indoors.find(query))
    for i in indoors:
        i['_id'] = str(i['_id'])
        i['owner_id'] = str(i['owner_id'])
        
    return jsonify(indoors), 200

# --- 3. DISCOVERY & UTILITY ---

@app.route('/api/players', methods=['GET'])
def get_players():
    """Discovery route to find other players in the same area."""
    area = request.args.get('area')
    query = {"role": "player"}
    if area:
        query["area"] = area
    players = list(mongo.db.Users.find(query, {"_id": 0, "password": 0}))
    return jsonify(players), 200

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    """Simple OTP verification mock."""
    data = request.json
    if data.get('otp') == "123456":
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": "Invalid OTP"}), 400

if __name__ == '__main__':
    # Running on port 5000 as configured in your React fetch calls
    app.run(debug=True, port=5000)