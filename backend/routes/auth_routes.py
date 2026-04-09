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
                "role": user.get("role"),
                "address": user.get("address")
            }), 200
        else:
            return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/auth/forgot-password-request', methods=['POST'])
def forgot_password_request():
    try:
        data = request.json
        email = data.get("email") # Could be email or phone
        
        # Allow finding by email or phone
        user = db.users.find_one({
            "$or": [
                {"email": email},
                {"phone": email}
            ]
        })
        
        if not user:
            return jsonify({"error": "No account found with this email/phone."}), 404

        real_email = user.get("email")
        otp = str(random.randint(100000, 999999))
        
        pending_otps[f"reset_{real_email}"] = {
            "otp": otp,
            "expires_at": datetime.now() + timedelta(minutes=10)
        }

        # Send Reset Email (Styled like Google Security)
        try:
            msg = Message(
                subject="FINDME - Account Recovery Code",
                recipients=[real_email],
                html=f"""
                <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 24px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <span style="font-size: 24px; font-weight: 900; color: #2563eb; font-style: italic; letter-spacing: -1px;">FINDME</span>
                    </div>
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; text-align: center;">Account Recovery</h2>
                    <p style="font-size: 14px; color: #4b5563; line-height: 24px; text-align: center; margin-bottom: 32px;">
                        Use this verification code to reset your password. This code will expire in 10 minutes.
                    </p>
                    <div style="background: #eff6ff; padding: 24px; text-align: center; border-radius: 16px; margin-bottom: 32px; border: 1px solid #dbeafe;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1d4ed8; font-family: monospace;">{otp}</span>
                    </div>
                </div>
                """
            )
            mail.send(msg)
        except Exception:
            pass # Fallback to mobile if SMS is configured

        # Send SMS too if possible
        try:
            phone = user.get('phone', '')
            if phone:
                if phone.startswith('0'): phone = '94' + phone[1:]
                sms_payload = {
                    'user_id': current_app.config.get('NOTIFY_USER_ID'),
                    'api_key': current_app.config.get('NOTIFY_API_KEY'),
                    'sender_id': current_app.config.get('NOTIFY_SENDER_ID'),
                    'to': phone,
                    'message': f"FINDME Recovery Code: {otp}"
                }
                requests.get('https://app.notify.lk/api/v1/send', params=sms_payload)
        except Exception:
            pass

        print(f"\n[PASSWORD RESET CODE] TO: {real_email}")
        print(f"[CODE]: {otp}\n")

        return jsonify({
            "message": "Recovery code sent!",
            "email": real_email,
            "debug_otp": otp # Remove for prod
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/auth/reset-password-final', methods=['POST'])
def reset_password_final():
    try:
        data = request.json
        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("new_password")

        entry = pending_otps.get(f"reset_{email}")
        if not entry or entry["otp"] != otp:
            return jsonify({"error": "Invalid or expired OTP."}), 400
        
        if datetime.now() > entry["expires_at"]:
            return jsonify({"error": "OTP has expired."}), 400

        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"error": "User not found."}), 404

        # SECURITY: New password cannot be the same as the old password
        if check_password_hash(user["password"], new_password):
            return jsonify({"error": "Your new password cannot be same as older password."}), 400

        hashed_password = generate_password_hash(new_password)
        db.users.update_one({"email": email}, {"$set": {"password": hashed_password}})
        
        if f"reset_{email}" in pending_otps:
            del pending_otps[f"reset_{email}"]

        return jsonify({"success": True, "message": "Password updated successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500