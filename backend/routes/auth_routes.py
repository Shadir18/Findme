import random
import requests
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db
from extensions import mail

auth_bp = Blueprint('auth', __name__)

# Mock storage for pending OTPs (In production, use Redis or a DB collection)
pending_otps = {} 

@auth_bp.route('/api/signup-request', methods=['POST'])
def signup_request():
    try:
        data = request.json
        email = data.get("email")
        
        # 1. Check if the email is already registered
        if db.users.find_one({"email": email}):
            return jsonify({"error": "An account with this email already exists."}), 400

        # 2. Generate a 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # 3. Store OTP and the data for 10 minutes
        pending_otps[email] = {
            "otp": otp,
            "data": data,
            "expires_at": datetime.now() + timedelta(minutes=10)
        }

        # 4. SEND REAL EMAIL
        try:
            msg = Message(
                subject="FINDME - Verify Your Account",
                recipients=[email],
                html=f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1d4ed8; text-align: center; font-style: italic;">FINDME</h2>
                    <p>Hello <strong>{data.get('name')}</strong>,</p>
                    <p>Thank you for choosing FINDME! Use the code below to verify your account:</p>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #111827;">{otp}</span>
                    </div>
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">This code will expire in 10 minutes.</p>
                </div>
                """
            )
            mail.send(msg)
            print(f"[SUCCESS] Real email sent to {email}")
        except Exception as mail_err:
            print(f"[WARNING] Could not send real email: {mail_err}")

        # 4.5 SEND REAL SMS (NOTIFY.LK)
        try:
            phone = data.get('phone', '')
            # Clean phone number (Lanka numbers usually start with 0, Notify.lk needs 94)
            if phone.startswith('0'):
                phone = '94' + phone[1:]
            
            sms_payload = {
                'user_id': current_app.config['NOTIFY_USER_ID'],
                'api_key': current_app.config['NOTIFY_API_KEY'],
                'sender_id': current_app.config['NOTIFY_SENDER_ID'],
                'to': phone,
                'message': f"Your FINDME verification code is: {otp}"
            }
            
            sms_response = requests.get('https://app.notify.lk/api/v1/send', params=sms_payload)
            if sms_response.status_code == 200:
                print(f"[SUCCESS] Real SMS sent to {phone}")
            else:
                print(f"[ERROR] Notify.lk returned status {sms_response.status_code}")
                
        except Exception as sms_err:
            print(f"[WARNING] Could not send real SMS: {sms_err}")

        # 5. MOCK LOG (Terminal only)
        print(f"\n[OTP VERIFICATION] TO: {email} / {data.get('phone')}")
        print(f"[OTP CODE]: {otp}")
        print("--------------------------------------------------\n")

        # For the university project, we'll return the OTP in the response 
        # so the user doesn't have to check the terminal, but in prod you'd remove this.
        return jsonify({
            "message": "OTP sent to your email and phone!",
            "debug_otp": otp # REMOVE THIS FOR PRODUCTION
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get("email")
        submitted_otp = data.get("otp")

        # 1. Check if we have a pending OTP for this email
        if email not in pending_otps:
            return jsonify({"error": "No verification session found."}), 400
        
        record = pending_otps[email]
        
        # 2. Check expiration
        if datetime.now() > record["expires_at"]:
            del pending_otps[email]
            return jsonify({"error": "OTP has expired. Please try again."}), 400

        # 3. Securely check OTP (simple string comparison for now)
        if record["otp"] != submitted_otp:
            return jsonify({"error": "Invalid OTP code."}), 401

        # 4. OTP IS VALID! Now finalize the registration
        user_data = record["data"]
        password = user_data.get("password")
        role = user_data.get("role")
        hashed_password = generate_password_hash(password)

        new_account = {
            "email": email,
            "phone": user_data.get("phone"),
            "password": hashed_password,
            "role": role,
            "name": user_data.get("name"),
            "address": user_data.get("address")
        }

        if role == 'player':
            new_account["dob"] = user_data.get("dob")
            new_account["area"] = user_data.get("area")
        elif role == 'turf_owner':
            new_account["indoor_name"] = user_data.get("indoor_name")
            new_account["timing"] = user_data.get("timing")
            new_account["pricing"] = user_data.get("pricing")
            new_account["facilities"] = user_data.get("facilities")
            new_account["turf_image"] = user_data.get("turf_image")

        # 5. Insert into Database
        result = db.users.insert_one(new_account)
        owner_id = str(result.inserted_id)

        # 6. Auto-generate courts for owners
        if role == 'turf_owner':
            facilities = new_account.get("facilities", [])
            for fac in facilities:
                sport = fac.get("sport", "Unknown")
                count = int(fac.get("count", 1))
                for i in range(count):
                    court_name = f"{sport} Court {i+1}" if count > 1 else f"{sport} Court"
                    db.courts.insert_one({
                        "owner_id": owner_id,
                        "name": court_name,
                        "sport": sport,
                        "capacity": 10 if sport in ['Futsal', 'Football'] else 4,
                        "status": "Available",
                        "available": True
                    })

        # 7. Cleanup
        del pending_otps[email]

        return jsonify({"message": "Verification successful! Account created."}), 201

    except Exception as e:
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
                "_id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role")
            }), 200
        else:
            return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500