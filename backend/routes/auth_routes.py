from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    try:
        # Get the data sent from our React form
        data = request.json
        email = data.get("email")
        password = data.get("password")
        role = data.get("role")

        # 1. Check if the email is already registered in the 'users' collection
        if db.users.find_one({"email": email}):
            return jsonify({"error": "An account with this email already exists."}), 400

        # 2. Scramble the password for security
        hashed_password = generate_password_hash(password)

        # 3. Create the base profile that BOTH players and owners share
        new_account = {
            "email": email,
            "phone": data.get("phone"),
            "password": hashed_password,
            "role": role,
            "name": data.get("name") # This is either the Player's name or the Owner's personal name
        }

        # 4. SMART ROUTING: Add the specific data depending on their role
        if role == 'player':
            new_account["dob"] = data.get("dob")
            new_account["area"] = data.get("area")
            
        elif role == 'turf_owner':
            new_account["indoor_name"] = data.get("indoor_name")
            new_account["address"] = data.get("address") # This contains province, district, town, etc.
            new_account["timing"] = data.get("timing")
            new_account["pricing"] = data.get("pricing") # This contains our dynamic 2x2 pricing matrix
            new_account["facilities"] = data.get("facilities")
            
            # Note: We save the image string directly. In a production app, you'd save this to AWS S3, 
            # but for a university project, saving the Base64 string to MongoDB is perfectly fine!
            new_account["turf_image"] = data.get("turf_image")

        # 5. Save the complete package to the database (Make sure it's db.users plural!)
        db.users.insert_one(new_account)

        return jsonify({"message": "Account created successfully!"}), 201

    except Exception as e:
        # If anything goes wrong, we send the exact error back to React so we can read it
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        user = db.users.find_one({"email": email})

        if user and check_password_hash(user["password"], password):
            return jsonify({
                "message": "Login successful!",
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role")
            }), 200
        else:
            return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500