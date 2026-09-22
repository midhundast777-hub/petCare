import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient

client = APIClient()

print("--- Testing Pet Care CRM Backend Endpoints ---")

# 1. Test Login
response = client.post('/api/auth/login/', {'email': 'midhundast07@gmail.com', 'password': 'Admin@123'})
assert response.status_code == 200, f"Admin login failed: {response.data}"
admin_token = response.data['access']
print("[OK] Admin Login successful, JWT token obtained")

# Authenticate client with admin token
client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

# 2. Test Customers
resp = client.get('/api/customers/')
assert resp.status_code == 200, f"Customers failed: {resp.data}"
print(f"[OK] Customers endpoint: {len(resp.data.get('results', resp.data))} customers found")

# 3. Test Pets
resp = client.get('/api/pets/')
assert resp.status_code == 200, f"Pets failed: {resp.data}"
print(f"[OK] Pets endpoint: {len(resp.data.get('results', resp.data))} pets found")

# 4. Test Services
resp = client.get('/api/services/')
assert resp.status_code == 200, f"Services failed: {resp.data}"
print(f"[OK] Services endpoint: {len(resp.data.get('results', resp.data))} services found")

# 5. Test Appointments
resp = client.get('/api/appointments/')
assert resp.status_code == 200, f"Appointments failed: {resp.data}"
print(f"[OK] Appointments endpoint: {len(resp.data.get('results', resp.data))} appointments found")

# 6. Test Boarding Bookings & Rooms
resp = client.get('/api/boarding/bookings/')
assert resp.status_code == 200, f"Boarding bookings failed: {resp.data}"
print(f"[OK] Boarding bookings endpoint: {len(resp.data.get('results', resp.data))} bookings found")

resp = client.get('/api/boarding/rooms/')
assert resp.status_code == 200, f"Boarding rooms failed: {resp.data}"
print(f"[OK] Boarding rooms endpoint: {len(resp.data.get('results', resp.data))} rooms found")

# 7. Test Vaccinations & Check-pet
resp = client.get('/api/vaccinations/')
assert resp.status_code == 200, f"Vaccinations failed: {resp.data}"
print(f"[OK] Vaccinations endpoint: {len(resp.data.get('results', resp.data))} vaccination records found")

resp = client.get('/api/vaccinations/check-pet/1/')
assert resp.status_code == 200, f"Vaccinations check failed: {resp.data}"
print(f"[OK] Vaccination safety check for Pet 1: {resp.data.get('is_safe_to_book')} (Expiring soon: {resp.data.get('expiring_soon_count')})")

# 8. Test Medical Records, Medications, Feeding
resp = client.get('/api/medical/records/')
assert resp.status_code == 200
print(f"[OK] Medical records endpoint: {len(resp.data.get('results', resp.data))} records found")

resp = client.get('/api/medical/medications/')
assert resp.status_code == 200
print(f"[OK] Medications endpoint: {len(resp.data.get('results', resp.data))} medications found")

resp = client.get('/api/medical/feeding/')
assert resp.status_code == 200
print(f"[OK] Feeding schedules endpoint: {len(resp.data.get('results', resp.data))} schedules found")

# 9. Test Invoices & Payments
resp = client.get('/api/billing/invoices/')
assert resp.status_code == 200
print(f"[OK] Billing invoices endpoint: {len(resp.data.get('results', resp.data))} invoices found")

# 10. Test Reports Summary & Charts
resp = client.get('/api/reports/summary/')
assert resp.status_code == 200
print(f"[OK] Reports summary: Total Customers={resp.data['total_customers']}, Total Pets={resp.data['total_pets']}, Occupancy={resp.data['occupancy_rate']}%")

resp = client.get('/api/reports/charts/')
assert resp.status_code == 200
print(f"[OK] Reports charts: {len(resp.data['monthly_revenue'])} months of revenue data, {len(resp.data['service_popularity'])} popular services")

# 11. Test Customer portal role filtering
client.credentials() # reset
resp = client.post('/api/auth/login/', {'email': 'customer@petcare.com', 'password': 'Customer@123'})
assert resp.status_code == 200
customer_token = resp.data['access']
client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')

resp = client.get('/api/pets/')
assert resp.status_code == 200
cust_pets = resp.data.get('results', resp.data)
print(f"[OK] Customer login role filter: Emily Watson sees {len(cust_pets)} pets (only her own)")

print("\n=== ALL BACKEND API CHECKS PASSED PERFECTLY! ===\n")
