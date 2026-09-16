import urllib.request
import json

print("Testing live HTTP servers...")

# Check Frontend on 5173
try:
    with urllib.request.urlopen("http://localhost:5173/") as response:
        print(f"[OK] Vite Frontend is live on http://localhost:5173/ (HTTP {response.status})")
except Exception as e:
    print(f"[ERROR] Frontend failed: {e}")

# Check Backend on 8000
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login/",
        data=json.dumps({"email": "admin@petcare.com", "password": "Admin@123"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        token = data['access']
        user = data['user']
        print(f"[OK] Django Backend is live on http://127.0.0.1:8000/ (HTTP {response.status})")
        print(f"     Logged in as {user['full_name']} ({user['role']})")
        print(f"     JWT Access Token received: {token[:25]}...")
except Exception as e:
    print(f"[ERROR] Backend login failed: {e}")

# Check Reports endpoint on 8000 with JWT
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/reports/summary/",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as response:
        summary = json.loads(response.read().decode('utf-8'))
        print(f"[OK] Reports API live check: Customers={summary['total_customers']}, Pets={summary['total_pets']}, Occupancy={summary['occupancy_rate']}%")
except Exception as e:
    print(f"[ERROR] Reports API failed: {e}")

print("Live server integration verification complete!")
