from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo
import random 

app = Flask(__name__)
CORS(app) 

app.config["MONGO_URI"] = "mongodb://localhost:27017/FindMe"
mongo = PyMongo(app)

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
            "password": data.get('password') 
        }
        
        mongo.db.Users.insert_one(user_data)
        
        return jsonify({
            "message": "User registered successfully!",
            "user": {
                "full_name": user_data["full_name"],
                "phone": user_data["phone"],
                "email": user_data["email"],
                "area": user_data["area"],
                "dob": user_data["dob"]
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import base64

@app.route('/api/user/update-photo', methods=['POST'])
def update_photo():
    try:
        data = request.json
        email = data.get('email')
        image_data = data.get('image') # Base64 string from frontend

        if not email:
            return jsonify({"error": "User email required"}), 400

        # Update the specific user's document in MongoDB
        mongo.db.Users.update_one(
            {"email": email},
            {"$set": {"profile_photo": image_data}}
        )
        
        return jsonify({"message": "Photo updated successfully", "photo": image_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/remove-photo', methods=['POST'])
def remove_photo():
    data = request.json
    email = data.get('email')
    
    mongo.db.Users.update_one(
        {"email": email},
        {"$set": {"profile_photo": None}}
    )
    return jsonify({"message": "Photo removed"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = mongo.db.Users.find_one({"email": email, "password": password})

    if user:
        return jsonify({
            "status": "Success",
            "user":{
                "full_name": user['full_name'],
                "email": user['email'],
                "area": user['area'],
                "phone": user['phone'],
                "dob": user['dob']
            }
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    user_otp = data.get('otp')
    actual_otp = "123456" 
    
    if user_otp == actual_otp:
        return jsonify({"status": "success", "message": "Phone verified!"}), 200
    else:
        return jsonify({"status": "error", "message": "Invalid OTP"}), 400

# --- Player Discovery Route (Merged & Fixed) ---

@app.route('/api/players', methods=['GET'])
def get_players():
    # Fetch area from query parameters (e.g., /api/players?area=Colombo)
    area = request.args.get('area')
    
    if area:
        # Filter by area
        players = list(mongo.db.Player.find({"area": area}, {"_id": 0}))
    else:
        # Get everyone
        players = list(mongo.db.Player.find({}, {"_id": 0}))
        
    return jsonify(players), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)