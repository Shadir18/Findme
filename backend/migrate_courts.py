from database.db import db
users = db.users.find({'role': 'turf_owner'})
for u in users:
    facilities = u.get('facilities', [])
    owner_id = str(u['_id'])
    existing_courts = list(db.courts.find({'owner_id': owner_id}))
    if len(existing_courts) == 0:
        print(f"Migrating courts for {u.get('email')}...")
        for fac in facilities:
            sport = fac.get('sport', 'Unknown')
            count = int(fac.get('count', 1))
            for i in range(count):
                court_name = f"{sport} Court {i+1}" if count > 1 else f"{sport} Court"
                db.courts.insert_one({
                    'owner_id': owner_id,
                    'name': court_name,
                    'sport': sport,
                    'capacity': 10 if sport in ['Futsal', 'Football'] else 4,
                    'status': 'Available',
                    'available': True
                })
print('Migration complete!')
