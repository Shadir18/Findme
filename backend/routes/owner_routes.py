from flask import Blueprint, jsonify, request
from database.db import db
from bson.objectid import ObjectId
import datetime

owner_bp = Blueprint('owner_routes', __name__)

@owner_bp.route('/api/owner/dashboard', methods=['GET'])
def get_dashboard_data():
    owner_id = request.args.get('owner_id')
    # If no data in DB, return default empty state but we'll use some mock realistic data if DB is completely empty for demo.
    
    # 1. Fetch Courts
    courts = list(db.courts.find({"owner_id": owner_id}))
    for c in courts:
        c['_id'] = str(c['_id'])

    # 2. Fetch Bookings and attach player details
    bookings_cursor = list(db.bookings.find({"owner_id": owner_id}))
    bookings = []
    
    for b in bookings_cursor:
        b['id'] = str(b['_id'])  # map _id to id for frontend
        del b['_id']
        
        # Try to attach user phone if player_id is available
        if 'player_id' in b:
            try:
                player = db.users.find_one({"_id": ObjectId(b['player_id'])})
                if player:
                    b['user_phone'] = player.get('phone', player.get('mobile', 'N/A'))
                    # can also pull email, etc
                    b['user_email'] = player.get('email', 'N/A')
            except Exception:
                pass
                
        # Fallback if DB structure directly stores phone in booking
        if 'user_phone' not in b:
            b['user_phone'] = b.get('phone', b.get('mobile', 'N/A'))
            
        if 'user_email' not in b:
            b['user_email'] = b.get('email', 'N/A')

        bookings.append(b)

    # 3. Dynamic Analytics Calculation
    # Calculate real monthly revenue, peak hours, and sport breakdown from bookings
    
    # Initialize default empty analytics structures
    monthly_revenue_dict = {}
    peak_hours_dict = {}
    sport_breakdown_dict = {}
    
    for b in bookings:
        if b.get('status') == 'Cancelled':
            continue  # Skip cancelled bookings for revenue and stats

        # Extract date and time
        # Assume date format "YYYY-MM-DD" and time format "HH:00 - HH:00"
        b_date_str = b.get('date', '')
        b_time_str = b.get('time', '')
        b_amount = float(b.get('amount', 0))
        b_sport = b.get('sport', 'Unknown')
        
        # Monthly Revenue (e.g. "Oct", "Nov")
        if b_date_str:
            try:
                date_obj = datetime.datetime.strptime(b_date_str, "%Y-%m-%d")
                month_name = date_obj.strftime("%b")
                monthly_revenue_dict[month_name] = monthly_revenue_dict.get(month_name, 0) + b_amount
            except ValueError:
                pass

        # Peak Hours
        if b_time_str:
            # "14:00 - 15:00" -> extract "14:00" -> convert to "2PM" format usually
            start_time = b_time_str.split(' - ')[0]
            try:
                hour_obj = datetime.datetime.strptime(start_time, "%H:%M")
                hour_formatted = hour_obj.strftime("%I%p").lstrip("0") # e.g. "2PM"
                peak_hours_dict[hour_formatted] = peak_hours_dict.get(hour_formatted, 0) + 1
            except ValueError:
                pass

        # Sport Breakdown
        sport_breakdown_dict[b_sport] = sport_breakdown_dict.get(b_sport, 0) + 1

    # Format for frontend Recharts
    # Sort months by typical calendar order or just pass as-is
    months_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_revenue = [{"month": m, "revenue": monthly_revenue_dict.get(m, 0)} for m in months_order if m in monthly_revenue_dict]
    if not monthly_revenue:
        # Default empty state for chart
        monthly_revenue = [{"month": datetime.datetime.now().strftime("%b"), "revenue": 0}]

    peak_hours = [{"hour": h, "bookings": count} for h, count in peak_hours_dict.items()]
    if not peak_hours:
        peak_hours = [{"hour": "12PM", "bookings": 0}]
        
    sport_breakdown = [{"sport": s, "count": count} for s, count in sport_breakdown_dict.items()]
    if not sport_breakdown:
        sport_breakdown = [{"sport": "No Data", "count": 1}] # Needs 1 for empty pie chart

    analytics = {
        "monthlyRevenue": monthly_revenue,
        "peakHours": peak_hours,
        "sportBreakdown": sport_breakdown
    }

    # 4. Fetch Real Notifications
    notifs_cursor = db.notifications.find({"owner_id": owner_id}).sort("created_at", -1).limit(10)
    real_notifs = []
    for n in notifs_cursor:
        n['_id'] = str(n['_id'])
        n['id'] = str(n['_id'])
        real_notifs.append(n)

    # Fetch latest user data to ensure frontend has up-to-date profile info
    user_latest = db.users.find_one({"_id": ObjectId(owner_id)})
    if user_latest:
        user_latest['_id'] = str(user_latest['_id'])
        if 'password' in user_latest: del user_latest['password']

    return jsonify({
        "courts": courts,
        "bookings": bookings,
        "analytics": analytics,
        "notifications": real_notifs,
        "user": user_latest
    })

@owner_bp.route('/api/owner/courts/<court_id>/status', methods=['POST'])
def update_court_status(court_id):
    data = request.json
    new_status = data.get('status', 'Available') # 'Available', 'Maintenance', 'Holiday'
    
    court = db.courts.find_one({"_id": ObjectId(court_id)})
    if not court:
        return jsonify({"error": "Court not found"}), 404
    
    db.courts.update_one(
        {"_id": ObjectId(court_id)}, 
        {"$set": {"status": new_status, "available": new_status == 'Available'}}
    )
    return jsonify({"success": True, "status": new_status, "available": new_status == 'Available'})

@owner_bp.route('/api/owner/courts/<court_id>', methods=['PUT'])
def update_court_details(court_id):
    data = request.json
    update_fields = {}
    if 'name' in data:
        update_fields['name'] = data['name']
    if 'sport' in data:
        update_fields['sport'] = data['sport']
    if 'capacity' in data:
        update_fields['capacity'] = int(data['capacity'])
    if 'price_per_hour' in data:
        update_fields['price_per_hour'] = float(data['price_per_hour']) if data['price_per_hour'] else ''
    if 'pricing' in data:
        update_fields['pricing'] = data['pricing']
    
    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    court = db.courts.find_one({"_id": ObjectId(court_id)})
    if not court:
        return jsonify({"error": "Court not found"}), 404
        
    db.courts.update_one(
        {"_id": ObjectId(court_id)},
        {"$set": update_fields}
    )
    
    update_fields['_id'] = str(court_id)
    return jsonify({"success": True, "court": update_fields})

@owner_bp.route('/api/owner/bookings/manual', methods=['POST'])
def manual_booking():
    data = request.json
    owner_id = data.get('owner_id')
    
    # Required: Customer Name, Phone, Time Slot, Court, Sport, Date
    new_booking = {
        "owner_id": owner_id,
        "team": data.get('customerName', 'Manual Walk-in'),
        "user_phone": data.get('phoneNumber', ''),
        "date": data.get('date', datetime.datetime.now().strftime("%Y-%m-%d")),
        "time": data.get('timeSlot', '00:00 - 00:00'),
        "court": data.get('courtName', 'Court'),
        "sport": data.get('sport', 'Unknown'),
        "players": int(data.get('players', 2)),
        "amount": float(data.get('amount', 0)),
        "status": "Confirmed",  # Manual bookings are typically auto-confirmed
        "type": "manual"
    }

    result = db.bookings.insert_one(new_booking)
    new_booking['id'] = str(result.inserted_id)
    new_booking['_id'] = str(result.inserted_id)

    return jsonify({"success": True, "booking": new_booking})

@owner_bp.route('/api/owner/bookings/<booking_id>/status', methods=['POST'])
def update_booking_status(booking_id):
    data = request.json
    status = data.get('status')
    if status not in ['Confirmed', 'Cancelled', 'Pending']:
        return jsonify({"error": "Invalid status"}), 400
        
    db.bookings.update_one({"_id": ObjectId(booking_id)}, {"$set": {"status": status}})
    return jsonify({"success": True, "status": status})

@owner_bp.route('/api/owner/profile', methods=['PUT'])
def update_owner_profile():
    try:
        data = request.json
        owner_id = data.get('owner_id')
        if not owner_id:
            return jsonify({"error": "Owner ID missing"}), 400

        # Build update fields (don't allow sensitive field overwrites without validation)
        update_fields = {}
        allowed = ['name', 'phone', 'email', 'indoor_name', 'province', 'district', 'city', 'latitude', 'longitude']
        for key in allowed:
            if key in data:
                update_fields[key] = data[key]

        if not update_fields:
            return jsonify({"error": "No update fields provided"}), 400

        db.users.update_one({"_id": ObjectId(owner_id)}, {"$set": update_fields})
        
        # Get updated user to return
        updated_user = db.users.find_one({"_id": ObjectId(owner_id)})
        updated_user['_id'] = str(updated_user['_id'])
        if 'password' in updated_user: del updated_user['password']

        return jsonify({"success": True, "user": updated_user})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
