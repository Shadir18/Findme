import datetime
from database.db import db
from bson.objectid import ObjectId

def check_revenue():
    owner = db.users.find_one({"email": "owner_apex@example.com"})
    if not owner:
        print("Owner not found!")
        return
    
    owner_id = str(owner["_id"])
    print(f"Checking Revenue for Owner ID: {owner_id} ({owner['indoor_name']})")
    
    bookings = list(db.bookings.find({"owner_id": owner_id}))
    print(f"Total bookings found for this owner: {len(bookings)}")
    
    monthly_revenue_dict = {}
    for b in bookings:
        status = b.get('status')
        amount = b.get('amount', 0)
        date_str = b.get('date', '')
        
        if status == 'Cancelled':
            continue
            
        try:
            b_amount = float(amount)
            if date_str:
                date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                month_name = date_obj.strftime("%b")
                monthly_revenue_dict[month_name] = monthly_revenue_dict.get(month_name, 0) + b_amount
                print(f"  Added {b_amount} for {month_name} (Date: {date_str})")
        except Exception as e:
            print(f"  Error processing booking: {e}")

    print("\n--- RESULTS ---")
    print(monthly_revenue_dict)

if __name__ == "__main__":
    check_revenue()
