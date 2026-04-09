import os

file_path = "routes/player_routes.py"
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "@player_bp.route('/api/courts/<court_id>/busy-slots', methods=['GET'])" in line:
        skip = True
        new_lines.append("@player_bp.route('/api/courts/<court_id>/busy-slots', methods=['GET'])\n")
        new_lines.append("def get_busy_slots(court_id):\n")
        new_lines.append("    try:\n")
        new_lines.append("        date = request.args.get('date')\n")
        new_lines.append("        if not date: return jsonify({'busy': []}), 200\n")
        new_lines.append("        query = {'court_id': court_id, 'date': date, 'status': {'$ne': 'Cancelled'}}\n")
        new_lines.append("        busy = [b.get('time') for b in db.bookings.find(query) if b.get('time')]\n")
        new_lines.append("        court = db.courts.find_one({'_id': ObjectId(court_id)})\n")
        new_lines.append("        if court:\n")
        new_lines.append("            m_query = {'owner_id': court['owner_id'], 'court': court['name'], 'date': date, 'status': {'$ne': 'Cancelled'}, 'court_id': {'$exists': False}}\n")
        new_lines.append("            busy.extend([b.get('time') for b in db.bookings.find(m_query) if b.get('time')])\n")
        new_lines.append("        return jsonify({'busy': list(set(busy))}), 200\n")
        new_lines.append("    except Exception as e:\n")
        new_lines.append("        return jsonify({'error': str(e)}), 500\n")
        break
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("File fixed successfully")
