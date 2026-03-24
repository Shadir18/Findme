from flask import Flask
from flask_cors import CORS

# Import our new Blueprints
from routes.auth_routes import auth_bp
from routes.player_routes import player_bp
from routes.match_routes import match_bp

app = Flask(__name__)
CORS(app) 

@app.route('/')
def home():
    return "Find Me Backend is Running! (Now completely modular and clean!)"

# Plug the Blueprints into the app
app.register_blueprint(auth_bp)
app.register_blueprint(player_bp)
app.register_blueprint(match_bp)

if __name__ == '__main__':
    app.run(debug=True)