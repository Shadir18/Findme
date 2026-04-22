from flask import Blueprint, jsonify, request
from database.db import db
from bson.objectid import ObjectId

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

@match_bp.route('/api/add_player', methods=['POST'])
def add_player():
    try:
        data = request.json
        if not data.get("name"):
            return jsonify({"error": "Name is required"}), 400
            
        # Add to the legacy players collection used by public MatchGrid
        db.players.insert_one({
            "name": data.get("name"),
            "sport": data.get("sport", "Futsal"),
            "city": data.get("city", "Colombo"),
            "time_slot": data.get("time_slot", "Saturday Morning")
        })
        return jsonify({"message": "Player added to waitlist!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
