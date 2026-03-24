from flask import Blueprint, jsonify
from database import db

match_bp = Blueprint('match', __name__)

@match_bp.route('/api/matches', methods=['GET'])
def get_matches():
    try:
        players = list(db.players.find({}, {"_id": 0}))
        teams = {}
        for player in players:
            sport = player.get("sport", "Unknown Sport")
            city = player.get("city", "Unknown City")
            time_slot = player.get("time_slot", "Unknown Time")
            
            match_label = f"{sport} in {city} ({time_slot})"
            if match_label not in teams:
                teams[match_label] = []
            teams[match_label].append(player.get("name"))
            
        return jsonify(teams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500