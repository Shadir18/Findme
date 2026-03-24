from flask import Blueprint, request, jsonify
from database import db

player_bp = Blueprint('player', __name__)

@player_bp.route('/api/add_player', methods=['POST'])
def add_player():
    try:
        player_data = request.json
        db.players.insert_one({
            "name": player_data.get("name"),
            "sport": player_data.get("sport"),
            "city": player_data.get("city"),            
            "time_slot": player_data.get("time_slot")   
        })
        return jsonify({"message": "Player added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@player_bp.route('/api/players', methods=['GET'])
def get_players():
    try:
        players = list(db.players.find({}, {"_id": 0}))
        return jsonify(players), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500