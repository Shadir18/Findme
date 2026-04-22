import requests

API = "http://127.0.0.1:5000"
JOHN_ID = "69e48f0449416d680ab7cda7"

def test():
    print(f"Testing for John ID: {JOHN_ID}")
    
    try:
        r = requests.get(f"{API}/api/player/matches/{JOHN_ID}")
        print(f"Matches Status: {r.status_code}")
        print(f"Matches: {r.json()}")
        
        r = requests.get(f"{API}/api/player/bookings/{JOHN_ID}")
        print(f"Bookings Status: {r.status_code}")
        print(f"Bookings: {r.json()}")
        
        r = requests.get(f"{API}/api/players/requests?player_id={JOHN_ID}")
        print(f"Requests Status: {r.status_code}")
        print(f"Requests: {r.json()}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
