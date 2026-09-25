import os
import sys
import django

sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()



from django.utils import timezone
from users.models import User
from customers.models import Customer
from pets.models import Pet
from boarding.models import Room, BoardingBooking, BoardingChecklist, DailyCareLog
from rest_framework.test import APIRequestFactory, force_authenticate
from boarding.views import BoardingChecklistView, DailyCareLogListCreateView, PetDiaryListView

def run_tests():
    print("Testing Pet Digital Diary Backend Flow...")
    
    # 1. Setup admin and customer user
    admin_user = User.objects.filter(role=User.Role.ADMIN).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin_test', 'admin_test@petcare.com', 'adminpass123')
        admin_user.role = User.Role.ADMIN
        admin_user.save()

    customer_user = User.objects.filter(role=User.Role.CUSTOMER).first()
    if not customer_user:
        customer_user = User.objects.create_user('cust_test', 'cust_test@petcare.com', 'custpass123')
        customer_user.role = User.Role.CUSTOMER
        customer_user.save()

    customer, _ = Customer.objects.get_or_create(
        user=customer_user,
        defaults={'first_name': 'Sarah', 'last_name': 'Jenkins', 'email': customer_user.email, 'phone': '5551234567'}
    )

    pet, _ = Pet.objects.get_or_create(
        owner=customer,
        name='Buddy',
        defaults={'species': Pet.Species.DOG, 'breed': 'Golden Retriever', 'weight': 28.5}
    )

    room, _ = Room.objects.get_or_create(
        room_number='R-101',
        defaults={'room_type': Room.RoomType.LUXURY, 'daily_rate': 45.00}
    )

    # Create a boarding booking
    booking = BoardingBooking.objects.create(
        customer=customer,
        pet=pet,
        room=room,
        package=BoardingBooking.Package.LUXURY,
        check_in_date=timezone.now().date(),
        expected_check_out_date=timezone.now().date() + timezone.timedelta(days=3),
        status=BoardingBooking.Status.RESERVED
    )

    factory = APIRequestFactory()

    # 2. Check-In Pet and verify Arrival Diary Entry is auto-created
    print("\n[Step 1] Completing Check-In checklist...")
    request = factory.patch(
        f'/api/boarding/bookings/{booking.id}/checklist/',
        {
            'checkin_vaccination_verified': True,
            'checkin_health_condition_checked': True,
            'checkin_weight_recorded': 28.5,
            'checkin_belongings_received': True,
            'checkin_belongings_notes': 'Blue leash, chew toy, bag of organic salmon kibble',
            'checkin_completed': True
        },
        format='json'
    )
    force_authenticate(request, user=admin_user)
    view = BoardingChecklistView.as_view()
    response = view(request, booking_id=booking.id)
    assert response.status_code == 200, f"Check-in failed: {response.data}"

    booking.refresh_from_db()
    assert booking.status == BoardingBooking.Status.CHECKED_IN, f"Booking status expected CHECKED_IN, got {booking.status}"

    arrival_log = DailyCareLog.objects.filter(booking=booking, stage=DailyCareLog.Stage.ARRIVAL).first()
    assert arrival_log is not None, "Arrival diary entry was not auto-created!"
    print(f"[OK] Arrival diary entry created: {arrival_log.activity_title} | Belongings: {arrival_log.belongings_notes}")
    assert float(arrival_log.weight) == 28.5
    assert arrival_log.care_type == DailyCareLog.CareType.ARRIVAL

    # 3. Create Daily Stay Activities (e.g. Playtime, Feeding, Photo)
    print("\n[Step 2] Adding Daily Stay Activities...")
    request = factory.post(
        f'/api/boarding/bookings/{booking.id}/care-logs/',
        {
            'care_type': DailyCareLog.CareType.EXERCISE,
            'activity_title': 'Agility Park Sprint & Ball Fetch',
            'mood': DailyCareLog.Mood.PLAYFUL,
            'notes': 'Buddy was having a blast chasing tennis balls in the green agility yard! High energy and super friendly with staff.',
            'dietary_notes': 'Drank fresh bowl of water after playtime.'
        },
        format='json'
    )
    force_authenticate(request, user=admin_user)
    view = DailyCareLogListCreateView.as_view()
    response = view(request, booking_id=booking.id)
    assert response.status_code == 201, f"Create daily log failed: {response.data}"
    print(f"[OK] Playtime diary entry created: {response.data['activity_title']}")

    # 4. Check-Out Pet and verify Departure Diary Entry is auto-created
    print("\n[Step 3] Completing Check-Out checklist...")
    request = factory.patch(
        f'/api/boarding/bookings/{booking.id}/checklist/',
        {
            'checkout_condition_checked': True,
            'checkout_belongings_returned': True,
            'checkout_completed': True
        },
        format='json'
    )
    force_authenticate(request, user=admin_user)
    view = BoardingChecklistView.as_view()
    response = view(request, booking_id=booking.id)
    assert response.status_code == 200, f"Check-out failed: {response.data}"

    booking.refresh_from_db()
    assert booking.status == BoardingBooking.Status.CHECKED_OUT, f"Booking status expected CHECKED_OUT, got {booking.status}"

    departure_log = DailyCareLog.objects.filter(booking=booking, stage=DailyCareLog.Stage.DEPARTURE).first()
    assert departure_log is not None, "Departure diary entry was not auto-created!"
    print(f"[OK] Departure diary entry created: {departure_log.activity_title} | Condition: {departure_log.health_notes}")
    assert departure_log.care_type == DailyCareLog.CareType.DEPARTURE

    # 5. Query Pet Digital Diary endpoint (Both Staff and Pet Parent)
    print("\n[Step 4] Querying Pet Digital Diary endpoint...")
    request = factory.get(f'/api/boarding/pets/{pet.id}/diary/')
    force_authenticate(request, user=customer_user)
    view = PetDiaryListView.as_view()
    response = view(request, pet_id=pet.id)
    assert response.status_code == 200, f"Pet diary query failed: {response.data}"
    entries = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
    print(f"[OK] Customer successfully retrieved {len(entries)} diary entries for {pet.name}:")
    for entry in entries:
        print(f"   [{entry['stage']}] {entry['care_type_display']}: {entry['activity_title']} (Mood: {entry['mood_display']})")


    print("\n===> ALL DIGITAL DIARY TESTS PASSED SUCCESSFULLY! <===")


if __name__ == '__main__':
    run_tests()
