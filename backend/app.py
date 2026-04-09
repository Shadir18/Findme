from flask import Flask
from flask_cors import CORS
from extensions import mail

# Import our new Blueprints
from routes.auth_routes import auth_bp
from routes.player_routes import player_bp
from routes.match_routes import match_bp
from routes.owner_routes import owner_bp

app = Flask(__name__)
CORS(app) 

# --- EMAIL CONFIGURATION (GMAIL) ---
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'mshadir287@gmail.com'
app.config['MAIL_PASSWORD'] = 'maod xupe hlow kjkn'    
app.config['MAIL_DEFAULT_SENDER'] = 'mshadir287@gmail.com'

mail.init_app(app)

# --- SMS CONFIGURATION (NOTIFY.LK) ---
app.config['NOTIFY_USER_ID'] = '31446'   
app.config['NOTIFY_API_KEY'] = 'Br6JdKSWlNNeUNonKt9z'    
app.config['NOTIFY_SENDER_ID'] = 'NotifyDEMO'    
# -------------------------------------

@app.route('/')
def home():
    return "Find Me Backend is Running! (Now completely modular and clean!)"

# Plug the Blueprints into the app
app.register_blueprint(auth_bp)
app.register_blueprint(player_bp)
app.register_blueprint(match_bp)
app.register_blueprint(owner_bp)

if __name__ == '__main__':
    app.run(debug=True)
