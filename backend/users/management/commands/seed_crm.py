from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta, time
from decimal import Decimal

from users.models import User
from customers.models import Customer, CustomerNote
from pets.models import Pet
from services.models import Service
from appointments.models import Appointment
from boarding.models import Room, BoardingBooking, BoardingChecklist, DailyCareLog
from vaccinations.models import Vaccination
from medical.models import MedicalRecord, Medication, MedicationLog, FeedingSchedule, FeedingLog
from billing.models import Invoice, Payment
from notifications.models import Notification

class Command(BaseCommand):
    help = 'Seeds database with realistic Pet Care CRM demo data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Seeding Pet Care CRM demo data..."))

        # 1. Create Users
        admin_user, _ = User.objects.get_or_create(
            email='admin@petcare.com',
            defaults={
                'first_name': 'Eleanor',
                'last_name': 'Vance',
                'role': User.Role.ADMIN,
                'phone': '+1 (555) 019-2831',
                'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('Admin@123')
        admin_user.save()

        staff_user, _ = User.objects.get_or_create(
            email='staff@petcare.com',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'role': User.Role.STAFF,
                'phone': '+1 (555) 014-9922',
                'avatar': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                'is_staff': True
            }
        )
        staff_user.set_password('Staff@123')
        staff_user.save()

        vet_user, _ = User.objects.get_or_create(
            email='vet.alex@petcare.com',
            defaults={
                'first_name': 'Dr. Alex',
                'last_name': 'Rivera',
                'role': User.Role.STAFF,
                'phone': '+1 (555) 018-7733',
                'avatar': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
                'is_staff': True
            }
        )
        vet_user.set_password('Staff@123')
        vet_user.save()

        customer_user, _ = User.objects.get_or_create(
            email='customer@petcare.com',
            defaults={
                'first_name': 'Emily',
                'last_name': 'Watson',
                'role': User.Role.CUSTOMER,
                'phone': '+1 (555) 012-4488',
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
        )
        customer_user.set_password('Customer@123')
        customer_user.save()

        # 2. Services
        services_data = [
            {'name': 'Full Grooming & Spa', 'category': Service.Category.GROOMING, 'price': 65.00, 'duration_minutes': 90, 'description': 'Full shampoo bath, blowout, styling haircut, ear cleaning, and paw pad balm.'},
            {'name': 'Express Bath & Blowout', 'category': Service.Category.BATHING, 'price': 40.00, 'duration_minutes': 45, 'description': 'Hypoallergenic bath, high-velocity blowout, and thorough brush-out.'},
            {'name': 'Nail Trimming & Paw Care', 'category': Service.Category.NAIL_TRIMMING, 'price': 20.00, 'duration_minutes': 20, 'description': 'Gentle nail clip and grind with soothing paw moisturizing balm.'},
            {'name': 'Canine Behavioral Training', 'category': Service.Category.TRAINING, 'price': 80.00, 'duration_minutes': 60, 'description': 'One-on-one positive reinforcement session focusing on leash etiquette and reactivity.'},
            {'name': 'Puppy Socialization Class', 'category': Service.Category.TRAINING, 'price': 35.00, 'duration_minutes': 45, 'description': 'Safe supervised group playtime and early obedience basics for puppies under 6 months.'},
            {'name': 'Standard Boarding Suite', 'category': Service.Category.BOARDING, 'price': 45.00, 'duration_minutes': 1440, 'description': 'Cozy climate-controlled private kennel with orthopedic bed and 3 daily outdoor walks.'},
            {'name': 'VIP Luxury Penthouse Boarding', 'category': Service.Category.BOARDING, 'price': 85.00, 'duration_minutes': 1440, 'description': 'Spacious suite with web-cam access, private patio, organic treats, and evening cuddle session.'},
            {'name': 'Doggy Daycare (Full Day)', 'category': Service.Category.DAYCARE, 'price': 38.00, 'duration_minutes': 480, 'description': 'Supervised group agility play, splash pool access, and relaxing nap break.'},
            {'name': 'Veterinary Wellness Exam', 'category': Service.Category.VETERINARY, 'price': 65.00, 'duration_minutes': 30, 'description': 'Comprehensive nose-to-tail physical exam, vital signs, weight check, and dental evaluation.'},
            {'name': 'Pet Taxi Shuttle (One-Way)', 'category': Service.Category.TRANSPORTATION, 'price': 25.00, 'duration_minutes': 30, 'description': 'Safe air-conditioned door-to-door transport for your pet within a 15-mile radius.'},
        ]
        service_objs = {}
        for s in services_data:
            obj, _ = Service.objects.get_or_create(name=s['name'], defaults=s)
            service_objs[s['name']] = obj

        # 3. Boarding Rooms
        rooms_data = [
            {'room_number': '101', 'room_type': Room.RoomType.STANDARD, 'daily_rate': 45.00, 'capacity': 1, 'status': Room.Status.OCCUPIED},
            {'room_number': '102', 'room_type': Room.RoomType.STANDARD, 'daily_rate': 45.00, 'capacity': 1, 'status': Room.Status.AVAILABLE},
            {'room_number': '103', 'room_type': Room.RoomType.STANDARD, 'daily_rate': 45.00, 'capacity': 1, 'status': Room.Status.AVAILABLE},
            {'room_number': '201', 'room_type': Room.RoomType.PREMIUM, 'daily_rate': 65.00, 'capacity': 2, 'status': Room.Status.OCCUPIED},
            {'room_number': '202', 'room_type': Room.RoomType.PREMIUM, 'daily_rate': 65.00, 'capacity': 2, 'status': Room.Status.AVAILABLE},
            {'room_number': '301', 'room_type': Room.RoomType.LUXURY, 'daily_rate': 85.00, 'capacity': 2, 'status': Room.Status.AVAILABLE},
            {'room_number': '302', 'room_type': Room.RoomType.LUXURY, 'daily_rate': 85.00, 'capacity': 2, 'status': Room.Status.MAINTENANCE, 'notes': 'Deep sanitization after renovation'},
            {'room_number': 'D-01', 'room_type': Room.RoomType.DAYCARE, 'daily_rate': 38.00, 'capacity': 6, 'status': Room.Status.AVAILABLE},
        ]
        room_objs = {}
        for r in rooms_data:
            obj, _ = Room.objects.get_or_create(room_number=r['room_number'], defaults=r)
            room_objs[r['room_number']] = obj

        # 4. Customers
        customers_data = [
            {
                'user': customer_user,
                'first_name': 'Emily',
                'last_name': 'Watson',
                'email': 'customer@petcare.com',
                'phone': '+1 (555) 012-4488',
                'alternate_phone': '+1 (555) 012-4489',
                'address': '742 Evergreen Terrace',
                'city': 'Springfield',
                'date_of_birth': date(1992, 4, 15),
                'emergency_contact_name': 'Mark Watson (Spouse)',
                'emergency_contact_phone': '+1 (555) 012-4490',
                'notes': 'Prefers morning pickup. Milo is sensitive to high-pitched noises.',
                'status': Customer.Status.ACTIVE
            },
            {
                'user': None,
                'first_name': 'Marcus',
                'last_name': 'Sterling',
                'email': 'marcus.sterling@example.com',
                'phone': '+1 (555) 019-3321',
                'alternate_phone': '',
                'address': '128 Willow Creek Lane',
                'city': 'Oakville',
                'date_of_birth': date(1985, 8, 22),
                'emergency_contact_name': 'Diana Sterling',
                'emergency_contact_phone': '+1 (555) 019-3322',
                'notes': 'VIP client. Has 2 huskies that love agility workouts.',
                'status': Customer.Status.ACTIVE
            },
            {
                'user': None,
                'first_name': 'Samantha',
                'last_name': 'Hayes',
                'email': 'samantha.hayes@example.com',
                'phone': '+1 (555) 017-5544',
                'alternate_phone': '+1 (555) 017-5545',
                'address': '54 Elmwood Heights Apt 4B',
                'city': 'Springfield',
                'date_of_birth': date(1996, 11, 3),
                'emergency_contact_name': 'Chloe Hayes (Sister)',
                'emergency_contact_phone': '+1 (555) 017-5599',
                'notes': 'Oliver requires special wet food timing due to digestion.',
                'status': Customer.Status.ACTIVE
            },
            {
                'user': None,
                'first_name': 'David',
                'last_name': 'Kim',
                'email': 'david.kim@example.com',
                'phone': '+1 (555) 016-8812',
                'alternate_phone': '',
                'address': '890 Highland Road',
                'city': 'Riverdale',
                'date_of_birth': date(1989, 2, 18),
                'emergency_contact_name': 'Grace Kim',
                'emergency_contact_phone': '+1 (555) 016-8813',
                'notes': 'Always brings custom chew toys for Charlie.',
                'status': Customer.Status.ACTIVE
            },
            {
                'user': None,
                'first_name': 'Rachel',
                'last_name': 'Greenwood',
                'email': 'rachel.greenwood@example.com',
                'phone': '+1 (555) 015-7766',
                'alternate_phone': '',
                'address': '42 Pine Crest Avenue',
                'city': 'Oakville',
                'date_of_birth': date(1994, 6, 30),
                'emergency_contact_name': 'Tom Greenwood',
                'emergency_contact_phone': '+1 (555) 015-7788',
                'notes': 'First-time pet owner, very attentive to health alerts.',
                'status': Customer.Status.ACTIVE
            }
        ]
        customer_objs = {}
        for c in customers_data:
            obj, _ = Customer.objects.get_or_create(email=c['email'], defaults=c)
            customer_objs[c['email']] = obj

        # Customer notes
        CustomerNote.objects.get_or_create(
            customer=customer_objs['customer@petcare.com'],
            note="Customer called to inquire about VIP holiday boarding dates. Advised to reserve 2 weeks early.",
            defaults={'author': staff_user, 'interaction_type': CustomerNote.InteractionType.CALL}
        )
        CustomerNote.objects.get_or_create(
            customer=customer_objs['marcus.sterling@example.com'],
            note="Met in person during weekend pickup. Very pleased with Luna's grooming results and requested the same stylist.",
            defaults={'author': staff_user, 'interaction_type': CustomerNote.InteractionType.IN_PERSON}
        )

        # 5. Pets
        pets_data = [
            {
                'name': 'Milo',
                'owner': customer_objs['customer@petcare.com'],
                'species': Pet.Species.DOG,
                'breed': 'Golden Retriever',
                'gender': Pet.Gender.MALE,
                'date_of_birth': date(2021, 5, 12),
                'color': 'Honey Gold',
                'weight': Decimal('31.50'),
                'microchip_number': '985141002341901',
                'photo': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
                'blood_group': 'DEA 1.1 Pos',
                'allergies': 'Chicken by-products, Flea saliva',
                'medical_conditions': 'Mild seasonal atopic dermatitis',
                'special_needs': 'Gentle hip handling, orthopedic bedding preferred',
                'dietary_preferences': 'Salmon & sweet potato grain-free kibble, 2 cups twice daily',
                'personality_behavior': 'Extremely friendly, loves tennis balls, gentle around toddlers',
                'emergency_instructions': 'Contact owner immediately; emergency clinic is Valley Animal ER',
                'status': Pet.Status.ACTIVE
            },
            {
                'name': 'Coco',
                'owner': customer_objs['customer@petcare.com'],
                'species': Pet.Species.DOG,
                'breed': 'Miniature Poodle',
                'gender': Pet.Gender.FEMALE,
                'date_of_birth': date(2023, 1, 10),
                'color': 'Chocolate Brown',
                'weight': Decimal('6.20'),
                'microchip_number': '985141002341902',
                'photo': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&auto=format&fit=crop&q=80',
                'allergies': 'None known',
                'medical_conditions': 'None',
                'special_needs': 'Daily eye wipes',
                'dietary_preferences': 'Small bites chicken & rice formula',
                'personality_behavior': 'Playful, affectionate lap dog, vocal when excited',
                'emergency_instructions': 'Standard emergency procedures',
                'status': Pet.Status.ACTIVE
            },
            {
                'name': 'Luna',
                'owner': customer_objs['marcus.sterling@example.com'],
                'species': Pet.Species.DOG,
                'breed': 'Siberian Husky',
                'gender': Pet.Gender.FEMALE,
                'date_of_birth': date(2022, 3, 20),
                'color': 'Silver & White',
                'weight': Decimal('22.80'),
                'microchip_number': '985141004551209',
                'photo': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=300&auto=format&fit=crop&q=80',
                'blood_group': 'DEA 1.1 Neg',
                'allergies': 'Beef intolerance',
                'special_needs': 'High energy outlet required; escape artist if kennel latch is loose',
                'dietary_preferences': 'High protein raw salmon & kibble blend',
                'personality_behavior': 'High prey drive, vocal talker, dog park superstar',
                'emergency_instructions': 'Call Marcus first, backup contact Diana',
                'status': Pet.Status.ACTIVE
            },
            {
                'name': 'Oliver',
                'owner': customer_objs['samantha.hayes@example.com'],
                'species': Pet.Species.CAT,
                'breed': 'British Shorthair',
                'gender': Pet.Gender.MALE,
                'date_of_birth': date(2020, 9, 14),
                'color': 'Blue Grey',
                'weight': Decimal('5.40'),
                'microchip_number': '985141009871123',
                'photo': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&auto=format&fit=crop&q=80',
                'allergies': 'Corn starch',
                'medical_conditions': 'Prone to hairballs and urinary crystals',
                'special_needs': 'Water fountain must be refreshed twice daily',
                'dietary_preferences': 'Royal Canin Urinary SO wet gravy 1 pouch morning & night',
                'personality_behavior': 'Calm, dignified, dislikes loud barking dogs',
                'emergency_instructions': 'Feline ER on Maple Street',
                'status': Pet.Status.ACTIVE
            },
            {
                'name': 'Charlie',
                'owner': customer_objs['david.kim@example.com'],
                'species': Pet.Species.DOG,
                'breed': 'Beagle',
                'gender': Pet.Gender.MALE,
                'date_of_birth': date(2019, 7, 8),
                'color': 'Tri-color',
                'weight': Decimal('13.20'),
                'microchip_number': '985141001239845',
                'photo': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=300&auto=format&fit=crop&q=80',
                'allergies': 'None',
                'medical_conditions': 'Hypothyroidism (managed with medication)',
                'special_needs': 'Strict diet portioning to prevent obesity',
                'dietary_preferences': 'Weight management kibble',
                'personality_behavior': 'Driven by food scent, gentle temperament',
                'emergency_instructions': 'Call David Kim',
                'status': Pet.Status.ACTIVE
            },
            {
                'name': 'Bella',
                'owner': customer_objs['rachel.greenwood@example.com'],
                'species': Pet.Species.DOG,
                'breed': 'French Bulldog',
                'gender': Pet.Gender.FEMALE,
                'date_of_birth': date(2023, 8, 5),
                'color': 'Fawn with Black Mask',
                'weight': Decimal('11.00'),
                'microchip_number': '985141007894561',
                'photo': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
                'allergies': 'Dairy, Wheat gluten',
                'medical_conditions': 'Brachycephalic syndrome (keep cool in warm weather)',
                'special_needs': 'No strenuous exercise in temperatures above 75°F',
                'dietary_preferences': 'Hypoallergenic lamb & rice formula',
                'personality_behavior': 'Snuggly couch potato, loves short walks',
                'emergency_instructions': 'Cool down immediately with wet towel if panting heavily',
                'status': Pet.Status.ACTIVE
            }
        ]
        pet_objs = {}
        for p in pets_data:
            obj, _ = Pet.objects.get_or_create(microchip_number=p['microchip_number'], defaults=p)
            pet_objs[p['name']] = obj

        # 6. Vaccinations
        today = date.today()
        vax_data = [
            # Milo: Valid & Expiring Soon
            {'pet': pet_objs['Milo'], 'vaccine_name': 'Rabies 3-Year', 'vaccination_date': today - timedelta(days=500), 'expiry_date': today + timedelta(days=595), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2023-8821'},
            {'pet': pet_objs['Milo'], 'vaccine_name': 'DHPP (Distemper, Parvo)', 'vaccination_date': today - timedelta(days=350), 'expiry_date': today + timedelta(days=15), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2023-8822'}, # EXPIRING SOON!
            {'pet': pet_objs['Milo'], 'vaccine_name': 'Bordetella (Kennel Cough)', 'vaccination_date': today - timedelta(days=160), 'expiry_date': today + timedelta(days=205), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2023-8823'},
            
            # Luna: Expired vaccine!
            {'pet': pet_objs['Luna'], 'vaccine_name': 'Rabies 1-Year', 'vaccination_date': today - timedelta(days=400), 'expiry_date': today - timedelta(days=35), 'veterinarian': 'Valley Pet Clinic', 'certificate_number': 'VAX-2022-3311'}, # EXPIRED!
            {'pet': pet_objs['Luna'], 'vaccine_name': 'Bordetella', 'vaccination_date': today - timedelta(days=60), 'expiry_date': today + timedelta(days=305), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2024-1102'},
            
            # Oliver: Cat vaccines
            {'pet': pet_objs['Oliver'], 'vaccine_name': 'FVRCP (Feline Core)', 'vaccination_date': today - timedelta(days=200), 'expiry_date': today + timedelta(days=165), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-CAT-0091'},
            {'pet': pet_objs['Oliver'], 'vaccine_name': 'FeLV (Feline Leukemia)', 'vaccination_date': today - timedelta(days=380), 'expiry_date': today - timedelta(days=15), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-CAT-0092'}, # EXPIRED!
            
            # Bella:
            {'pet': pet_objs['Bella'], 'vaccine_name': 'Rabies 1-Year', 'vaccination_date': today - timedelta(days=100), 'expiry_date': today + timedelta(days=265), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2024-5501'},
            {'pet': pet_objs['Bella'], 'vaccine_name': 'DHPP', 'vaccination_date': today - timedelta(days=340), 'expiry_date': today + timedelta(days=25), 'veterinarian': 'Dr. Alex Rivera', 'certificate_number': 'VAX-2024-5502'}, # EXPIRING SOON!
        ]
        for v in vax_data:
            Vaccination.objects.get_or_create(
                pet=v['pet'],
                vaccine_name=v['vaccine_name'],
                defaults=v
            )

        # 7. Medical Records, Medications, Feeding
        MedicalRecord.objects.get_or_create(
            pet=pet_objs['Milo'],
            visit_date=today - timedelta(days=45),
            defaults={
                'veterinarian': 'Dr. Alex Rivera',
                'diagnosis': 'Seasonal Allergic Dermatitis',
                'symptoms': 'Redness on paws and belly, persistent scratching',
                'treatment': 'Medicated chlorhexidine shampoo and Apoquel course',
                'prescription': 'Apoquel 16mg once daily for 14 days, Medicated bath 2x weekly',
                'notes': 'Skin cleared up satisfactorily. Advised to continue omega-3 supplement.'
            }
        )

        MedicalRecord.objects.get_or_create(
            pet=pet_objs['Charlie'],
            visit_date=today - timedelta(days=90),
            defaults={
                'veterinarian': 'Dr. Alex Rivera',
                'diagnosis': 'Primary Hypothyroidism',
                'symptoms': 'Lethargy, bilateral symmetrical hair loss on flank, weight gain',
                'treatment': 'Levothyroxine sodium replacement therapy',
                'prescription': 'Thyro-Tabs 0.3mg BID',
                'notes': 'Follow up blood panel in 6 weeks to evaluate T4 levels.'
            }
        )

        # Medication with logs
        med_charlie, _ = Medication.objects.get_or_create(
            pet=pet_objs['Charlie'],
            medicine_name='Thyro-Tabs (Levothyroxine)',
            defaults={
                'dosage': '0.3 mg',
                'frequency': 'Twice daily (08:00 AM & 08:00 PM)',
                'start_date': today - timedelta(days=90),
                'instructions': 'Give on empty stomach 1 hour prior to feeding',
                'assigned_staff': staff_user,
                'status': Medication.Status.ACTIVE
            }
        )
        MedicationLog.objects.get_or_create(
            medication=med_charlie,
            notes='Administered morning 0.3mg pill smoothly with pill pocket',
            defaults={'staff': staff_user}
        )

        # Feeding schedules with logs
        feed_milo, _ = FeedingSchedule.objects.get_or_create(
            pet=pet_objs['Milo'],
            food_type='Purina Pro Plan Salmon Sensitive Skin',
            defaults={
                'quantity': '1.5 cups',
                'feeding_time': '08:00 AM & 05:30 PM',
                'frequency': 'Twice a day',
                'special_instructions': 'Add 1 pump wild Alaskan salmon oil on top',
                'assigned_staff': staff_user,
                'last_fed_at': timezone.now() - timedelta(hours=3)
            }
        )
        FeedingLog.objects.get_or_create(
            schedule=feed_milo,
            notes='Ate full meal with enthusiasm',
            defaults={'staff': staff_user, 'amount_eaten': 'All'}
        )

        feed_oliver, _ = FeedingSchedule.objects.get_or_create(
            pet=pet_objs['Oliver'],
            food_type='Royal Canin Feline Urinary S/O Wet Pouch',
            defaults={
                'quantity': '1 pouch (85g)',
                'feeding_time': '07:30 AM & 06:00 PM',
                'frequency': 'Twice a day',
                'special_instructions': 'Mix with 2 tbsp lukewarm water to encourage hydration',
                'assigned_staff': staff_user,
                'last_fed_at': timezone.now() - timedelta(hours=4)
            }
        )

        # 8. Appointments
        appointments_data = [
            {
                'customer': customer_objs['customer@petcare.com'],
                'pet': pet_objs['Milo'],
                'service': service_objs['Full Grooming & Spa'],
                'staff': staff_user,
                'date': today,
                'start_time': time(9, 30),
                'end_time': time(11, 0),
                'status': Appointment.Status.IN_PROGRESS,
                'notes': 'Teddy bear face trim requested. Extra conditioner for coat.',
                'amount': Decimal('65.00')
            },
            {
                'customer': customer_objs['customer@petcare.com'],
                'pet': pet_objs['Coco'],
                'service': service_objs['Express Bath & Blowout'],
                'staff': staff_user,
                'date': today,
                'start_time': time(11, 30),
                'end_time': time(12, 15),
                'status': Appointment.Status.CHECKED_IN,
                'notes': 'Gentle drying, sensitive to loud dryers.',
                'amount': Decimal('40.00')
            },
            {
                'customer': customer_objs['marcus.sterling@example.com'],
                'pet': pet_objs['Luna'],
                'service': service_objs['Canine Behavioral Training'],
                'staff': staff_user,
                'date': today + timedelta(days=1),
                'start_time': time(14, 0),
                'end_time': time(15, 0),
                'status': Appointment.Status.CONFIRMED,
                'notes': 'Focus on loose leash walking when passing other dogs.',
                'amount': Decimal('80.00')
            },
            {
                'customer': customer_objs['david.kim@example.com'],
                'pet': pet_objs['Charlie'],
                'service': service_objs['Veterinary Wellness Exam'],
                'staff': vet_user,
                'date': today + timedelta(days=2),
                'start_time': time(10, 0),
                'end_time': time(10, 30),
                'status': Appointment.Status.CONFIRMED,
                'notes': 'Routine thyroid follow up checkup.',
                'amount': Decimal('65.00')
            },
            {
                'customer': customer_objs['rachel.greenwood@example.com'],
                'pet': pet_objs['Bella'],
                'service': service_objs['Nail Trimming & Paw Care'],
                'staff': staff_user,
                'date': today + timedelta(days=3),
                'start_time': time(15, 0),
                'end_time': time(15, 20),
                'status': Appointment.Status.PENDING,
                'notes': 'Requested online booking via customer portal.',
                'amount': Decimal('20.00')
            },
            # Completed past appointment
            {
                'customer': customer_objs['customer@petcare.com'],
                'pet': pet_objs['Milo'],
                'service': service_objs['Doggy Daycare (Full Day)'],
                'staff': staff_user,
                'date': today - timedelta(days=7),
                'start_time': time(8, 30),
                'end_time': time(16, 30),
                'status': Appointment.Status.COMPLETED,
                'notes': 'Played very nicely with golden retrievers in group B.',
                'amount': Decimal('38.00')
            }
        ]
        created_apts = []
        for apt in appointments_data:
            obj, _ = Appointment.objects.get_or_create(
                customer=apt['customer'],
                pet=apt['pet'],
                service=apt['service'],
                date=apt['date'],
                start_time=apt['start_time'],
                defaults=apt
            )
            created_apts.append(obj)

        # 9. Boarding Bookings
        # Active booking currently checked-in
        brd_luna, _ = BoardingBooking.objects.get_or_create(
            customer=customer_objs['marcus.sterling@example.com'],
            pet=pet_objs['Luna'],
            check_in_date=today - timedelta(days=2),
            defaults={
                'room': room_objs['201'],
                'package': BoardingBooking.Package.PREMIUM,
                'expected_check_out_date': today + timedelta(days=3),
                'feeding_instructions': 'High protein kibble 2x daily; raw salmon treats at 4 PM.',
                'special_instructions': 'Keep away from male unneutered dogs. Double check kennel latch.',
                'emergency_contact': 'Marcus Sterling +1 (555) 019-3321',
                'status': BoardingBooking.Status.CHECKED_IN,
                'total_cost': Decimal('325.00'),
                'payment_status': BoardingBooking.PaymentStatus.PAID
            }
        )
        # Fill checklist for Luna
        chklst_luna = brd_luna.checklist
        chklst_luna.checkin_vaccination_verified = True
        chklst_luna.checkin_health_condition_checked = True
        chklst_luna.checkin_weight_recorded = Decimal('22.80')
        chklst_luna.checkin_belongings_received = True
        chklst_luna.checkin_belongings_notes = 'Plush duck toy, red harness, 5 lbs food bag'
        chklst_luna.checkin_feeding_recorded = True
        chklst_luna.checkin_medication_recorded = True
        chklst_luna.checkin_emergency_verified = True
        chklst_luna.checkin_owner_instructions = True
        chklst_luna.checkin_payment_checked = True
        chklst_luna.checkin_completed = True
        chklst_luna.checkin_completed_at = timezone.now() - timedelta(days=2)
        chklst_luna.checkin_staff = staff_user
        chklst_luna.save()

        DailyCareLog.objects.get_or_create(
            booking=brd_luna,
            care_type=DailyCareLog.CareType.EXERCISE,
            notes='Enjoyed 45 minutes of brisk play in outdoor yard. Caught frisbee repeatedly.',
            defaults={'staff': staff_user}
        )
        DailyCareLog.objects.get_or_create(
            booking=brd_luna,
            care_type=DailyCareLog.CareType.FEEDING,
            notes='Finished evening dinner completely.',
            defaults={'staff': staff_user}
        )

        # Booking checked in Room 101
        brd_oliver, _ = BoardingBooking.objects.get_or_create(
            customer=customer_objs['samantha.hayes@example.com'],
            pet=pet_objs['Oliver'],
            check_in_date=today - timedelta(days=1),
            defaults={
                'room': room_objs['101'],
                'package': BoardingBooking.Package.STANDARD,
                'expected_check_out_date': today + timedelta(days=2),
                'feeding_instructions': 'Royal Canin Urinary SO twice daily with water',
                'special_instructions': 'Brush coat once daily to prevent matting',
                'emergency_contact': 'Samantha Hayes +1 (555) 017-5544',
                'status': BoardingBooking.Status.CHECKED_IN,
                'total_cost': Decimal('135.00'),
                'payment_status': BoardingBooking.PaymentStatus.PAID
            }
        )

        # Reserved upcoming booking
        brd_milo, _ = BoardingBooking.objects.get_or_create(
            customer=customer_objs['customer@petcare.com'],
            pet=pet_objs['Milo'],
            check_in_date=today + timedelta(days=5),
            defaults={
                'room': room_objs['301'],
                'package': BoardingBooking.Package.LUXURY,
                'expected_check_out_date': today + timedelta(days=9),
                'feeding_instructions': 'Purina Pro Plan Salmon 2x daily',
                'special_instructions': 'Turn on soothing background music in luxury suite at night',
                'emergency_contact': 'Emily Watson +1 (555) 012-4488',
                'status': BoardingBooking.Status.RESERVED,
                'total_cost': Decimal('340.00'),
                'payment_status': BoardingBooking.PaymentStatus.PENDING
            }
        )

        # 10. Billing & Invoices
        # Invoice 1: Milo's completed Daycare stay (Paid)
        inv1, _ = Invoice.objects.get_or_create(
            customer=customer_objs['customer@petcare.com'],
            invoice_date=today - timedelta(days=7),
            defaults={
                'pet': pet_objs['Milo'],
                'items_data': [
                    {'description': 'Doggy Daycare (Full Day)', 'quantity': 1, 'unit_price': 38.00, 'total': 38.00},
                    {'description': 'Organic Peanut Butter Kong Snack', 'quantity': 1, 'unit_price': 6.00, 'total': 6.00}
                ],
                'subtotal': Decimal('44.00'),
                'discount': Decimal('0.00'),
                'tax_rate': Decimal('5.00'),
                'tax_amount': Decimal('2.20'),
                'total_amount': Decimal('46.20'),
                'payment_status': Invoice.PaymentStatus.PAID,
                'payment_method': Invoice.PaymentMethod.CARD,
                'due_date': today - timedelta(days=7),
                'paid_at': timezone.now() - timedelta(days=7),
                'notes': 'Thank you for your visit!'
            }
        )
        Payment.objects.get_or_create(
            invoice=inv1,
            defaults={
                'amount': Decimal('46.20'),
                'payment_method': Invoice.PaymentMethod.CARD,
                'transaction_id': 'TXN-90218829',
                'notes': 'Visa ending in 4242'
            }
        )

        # Invoice 2: Luna's Boarding Stay (Paid)
        inv2, _ = Invoice.objects.get_or_create(
            customer=customer_objs['marcus.sterling@example.com'],
            invoice_date=today - timedelta(days=2),
            defaults={
                'pet': pet_objs['Luna'],
                'boarding_booking': brd_luna,
                'items_data': [
                    {'description': 'Premium Suite Boarding (5 Nights)', 'quantity': 5, 'unit_price': 65.00, 'total': 325.00}
                ],
                'subtotal': Decimal('325.00'),
                'discount': Decimal('25.00'),
                'tax_rate': Decimal('5.00'),
                'tax_amount': Decimal('15.00'),
                'total_amount': Decimal('315.00'),
                'payment_status': Invoice.PaymentStatus.PAID,
                'payment_method': Invoice.PaymentMethod.CARD,
                'due_date': today - timedelta(days=2),
                'paid_at': timezone.now() - timedelta(days=2),
                'notes': 'Loyalty discount applied.'
            }
        )
        Payment.objects.get_or_create(
            invoice=inv2,
            defaults={
                'amount': Decimal('315.00'),
                'payment_method': Invoice.PaymentMethod.CARD,
                'transaction_id': 'TXN-88471102',
                'notes': 'Mastercard ending in 1890'
            }
        )

        # Invoice 3: Milo's upcoming boarding (Pending)
        inv3, _ = Invoice.objects.get_or_create(
            customer=customer_objs['customer@petcare.com'],
            invoice_date=today,
            defaults={
                'pet': pet_objs['Milo'],
                'boarding_booking': brd_milo,
                'items_data': [
                    {'description': 'VIP Luxury Penthouse Boarding (4 Nights)', 'quantity': 4, 'unit_price': 85.00, 'total': 340.00}
                ],
                'subtotal': Decimal('340.00'),
                'discount': Decimal('0.00'),
                'tax_rate': Decimal('5.00'),
                'tax_amount': Decimal('17.00'),
                'total_amount': Decimal('357.00'),
                'payment_status': Invoice.PaymentStatus.PENDING,
                'payment_method': Invoice.PaymentMethod.ONLINE,
                'due_date': today + timedelta(days=5),
                'notes': 'Due prior to check-in.'
            }
        )

        # 11. Notifications
        Notification.objects.get_or_create(
            recipient=customer_user,
            title='Vaccination Expiring Soon',
            defaults={
                'message': "Milo's DHPP vaccine expires in 15 days. Please schedule an update with our vet clinic.",
                'notification_type': Notification.NotificationType.VACCINATION_EXPIRY,
                'link': f"/pets/{pet_objs['Milo'].id}"
            }
        )
        Notification.objects.get_or_create(
            recipient=customer_user,
            title='Booking Confirmation: Luxury Suite',
            defaults={
                'message': f"Milo's boarding stay from {today + timedelta(days=5)} to {today + timedelta(days=9)} is confirmed!",
                'notification_type': Notification.NotificationType.BOOKING_CONFIRMATION,
                'link': "/boarding"
            }
        )
        Notification.objects.get_or_create(
            recipient=admin_user,
            title='Check-in Completed: Luna (Room 201)',
            defaults={
                'message': f"Luna was checked in by {staff_user.first_name} with all items verified.",
                'notification_type': Notification.NotificationType.CHECK_IN_REMINDER,
                'link': "/boarding"
            }
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Pet Care CRM demo data!"))
        self.stdout.write(self.style.SUCCESS("Demo credentials:"))
        self.stdout.write("  Admin: admin@petcare.com / Admin@123")
        self.stdout.write("  Staff: staff@petcare.com / Staff@123")
        self.stdout.write("  Customer: customer@petcare.com / Customer@123")
