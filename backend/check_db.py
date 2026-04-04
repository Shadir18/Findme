from database.db import db
user = db.users.find_one({'email': 'mshadir287@icloud.com'})
with open('output.txt', 'w') as f:
    f.write('User ID: ' + str(user['_id']) + '\n')
    if user:
        courts = list(db.courts.find({'owner_id': str(user['_id'])}))
        f.write(f'Found {len(courts)} courts:\n')
        for c in courts:
            f.write(str(c) + '\n')
