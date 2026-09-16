from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from django.utils import timezone

from customers.models import Customer
from pets.models import Pet
from appointments.models import Appointment
from boarding.models import Room, BoardingBooking
from vaccinations.models import Vaccination
from billing.models import Invoice, Payment
from services.models import Service

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        first_of_month = today.replace(day=1)
        user = request.user

        # Customer specific summary if customer
        if user.role == 'CUSTOMER' and not user.is_superuser:
            customer = Customer.objects.filter(user=user).first()
            if not customer:
                return Response({
                    'is_customer': True,
                    'total_pets': 0,
                    'upcoming_appointments': 0,
                    'active_boardings': 0,
                    'pending_invoices': 0,
                    'unpaid_balance': 0.0
                })
            
            pets_count = customer.pets.count()
            upcoming_apts = customer.appointments.filter(date__gte=today, status__in=['PENDING', 'CONFIRMED']).count()
            active_boardings = customer.boarding_bookings.filter(status='CHECKED_IN').count()
            pending_invoices = customer.invoices.filter(payment_status__in=['PENDING', 'PARTIALLY_PAID'])
            unpaid_balance = sum(float(inv.total_amount) - sum(float(p.amount) for p in inv.payments.all()) for inv in pending_invoices)
            
            return Response({
                'is_customer': True,
                'total_pets': pets_count,
                'upcoming_appointments': upcoming_apts,
                'active_boardings': active_boardings,
                'pending_invoices': pending_invoices.count(),
                'unpaid_balance': round(unpaid_balance, 2)
            })

        # Admin / Staff overall metrics
        total_customers = Customer.objects.count()
        total_pets = Pet.objects.count()
        today_appointments = Appointment.objects.filter(date=today).count()
        upcoming_appointments = Appointment.objects.filter(date__gt=today, status__in=['CONFIRMED', 'PENDING']).count()
        pets_currently_boarding = BoardingBooking.objects.filter(status='CHECKED_IN').count()
        pending_bookings = Appointment.objects.filter(status='PENDING').count() + BoardingBooking.objects.filter(status='RESERVED').count()
        
        # Vaccinations expiring within 30 days or expired
        vax_expiring_soon = Vaccination.objects.filter(expiry_date__gte=today, expiry_date__lte=today + timedelta(days=30)).count()
        vax_expired = Vaccination.objects.filter(expiry_date__lt=today).count()

        # Invoices and revenue
        pending_invoices = Invoice.objects.filter(payment_status__in=['PENDING', 'PARTIALLY_PAID'])
        pending_invoices_count = pending_invoices.count()
        
        today_payments = Payment.objects.filter(payment_date__date=today).aggregate(total=Sum('amount'))['total'] or 0.00
        monthly_payments = Payment.objects.filter(payment_date__date__gte=first_of_month).aggregate(total=Sum('amount'))['total'] or 0.00
        
        new_customers_this_month = Customer.objects.filter(registration_date__date__gte=first_of_month).count()

        # Boarding occupancy
        total_rooms = Room.objects.count()
        occupied_rooms = Room.objects.filter(status=Room.Status.OCCUPIED).count()
        occupancy_rate = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0.0

        # Recent activities (last 8)
        activities = []
        recent_apts = Appointment.objects.select_related('customer', 'pet', 'service').order_by('-created_at')[:4]
        for a in recent_apts:
            activities.append({
                'id': f"apt_{a.id}",
                'type': 'APPOINTMENT',
                'title': f"Appointment Booked: {a.service.name}",
                'description': f"{a.pet.name} ({a.customer.full_name}) for {a.date}",
                'status': a.status,
                'time': a.created_at
            })

        recent_brd = BoardingBooking.objects.select_related('customer', 'pet', 'room').order_by('-created_at')[:4]
        for b in recent_brd:
            activities.append({
                'id': f"brd_{b.id}",
                'type': 'BOARDING',
                'title': f"Boarding Stay: {b.get_package_display()}",
                'description': f"{b.pet.name} in Room {b.room.room_number if b.room else 'TBD'}",
                'status': b.status,
                'time': b.created_at
            })

        activities = sorted(activities, key=lambda x: x['time'], reverse=True)[:6]

        return Response({
            'total_customers': total_customers,
            'total_pets': total_pets,
            'today_appointments': today_appointments,
            'upcoming_appointments': upcoming_appointments,
            'pets_currently_boarding': pets_currently_boarding,
            'pending_bookings': pending_bookings,
            'vaccinations_expiring_soon': vax_expiring_soon,
            'vaccinations_expired': vax_expired,
            'pending_invoices_count': pending_invoices_count,
            'today_revenue': float(today_payments),
            'monthly_revenue': float(monthly_payments),
            'new_customers_this_month': new_customers_this_month,
            'occupancy_rate': occupancy_rate,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'recent_activities': activities
        })

class DashboardChartsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()

        # 1. Last 6 months revenue
        months = []
        for i in range(5, -1, -1):
            m_date = today - timedelta(days=i*30)
            m_start = m_date.replace(day=1)
            # month end
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                m_end = m_start.replace(month=m_start.month + 1, day=1) - timedelta(days=1)

            rev = Payment.objects.filter(payment_date__date__range=[m_start, m_end]).aggregate(total=Sum('amount'))['total'] or 0.0
            months.append({
                'month': m_start.strftime('%b %Y'),
                'revenue': float(rev)
            })

        # 2. Appointment statuses
        status_counts = Appointment.objects.values('status').annotate(count=Count('id'))
        status_map = {item['status']: item['count'] for item in status_counts}
        appointment_stats = [
            {'status': s, 'count': status_map.get(s, 0)}
            for s in ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        ]

        # 3. Service popularity
        service_pop = Appointment.objects.values('service__name', 'service__category').annotate(
            bookings=Count('id'),
            revenue=Sum('amount')
        ).order_by('-bookings')[:6]
        service_popularity = [
            {
                'name': s['service__name'],
                'category': s['service__category'],
                'bookings': s['bookings'],
                'revenue': float(s['revenue'] or 0.0)
            }
            for s in service_pop if s['service__name']
        ]

        # 4. Boarding rooms overview
        room_types = Room.objects.values('room_type').annotate(
            total=Count('id'),
            occupied=Count('id', filter=Q(status=Room.Status.OCCUPIED))
        )
        boarding_occupancy = [
            {
                'room_type': r['room_type'],
                'total': r['total'],
                'occupied': r['occupied'],
                'available': r['total'] - r['occupied']
            }
            for r in room_types
        ]

        # 5. Customer growth over last 6 months
        customer_growth = []
        for i in range(5, -1, -1):
            m_date = today - timedelta(days=i*30)
            m_start = m_date.replace(day=1)
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                m_end = m_start.replace(month=m_start.month + 1, day=1) - timedelta(days=1)

            count = Customer.objects.filter(registration_date__date__range=[m_start, m_end]).count()
            customer_growth.append({
                'month': m_start.strftime('%b'),
                'new_customers': count
            })

        return Response({
            'monthly_revenue': months,
            'appointment_stats': appointment_stats,
            'service_popularity': service_popularity,
            'boarding_occupancy': boarding_occupancy,
            'customer_growth': customer_growth
        })

class DetailedReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date', (date.today() - timedelta(days=30)).strftime('%Y-%m-%d'))
        end_date = request.query_params.get('end_date', date.today().strftime('%Y-%m-%d'))

        # Revenue
        total_revenue = Payment.objects.filter(payment_date__date__range=[start_date, end_date]).aggregate(total=Sum('amount'))['total'] or 0.0
        
        # Invoices breakdown
        invoices = Invoice.objects.filter(invoice_date__range=[start_date, end_date])
        total_invoiced = invoices.aggregate(total=Sum('total_amount'))['total'] or 0.0
        paid_invoices = invoices.filter(payment_status='PAID').count()
        pending_invoices = invoices.filter(payment_status__in=['PENDING', 'PARTIALLY_PAID']).count()
        unpaid_amount = float(total_invoiced) - float(total_revenue)

        # Appointments breakdown
        apts = Appointment.objects.filter(date__range=[start_date, end_date])
        total_apts = apts.count()
        completed_apts = apts.filter(status='COMPLETED').count()
        cancelled_apts = apts.filter(status='CANCELLED').count()

        # Boardings breakdown
        boardings = BoardingBooking.objects.filter(check_in_date__range=[start_date, end_date])
        total_boardings = boardings.count()

        return Response({
            'period': {'start_date': start_date, 'end_date': end_date},
            'revenue': {
                'total_collected': float(total_revenue),
                'total_invoiced': float(total_invoiced),
                'outstanding': max(float(unpaid_amount), 0.0),
                'paid_invoices_count': paid_invoices,
                'pending_invoices_count': pending_invoices
            },
            'appointments': {
                'total': total_apts,
                'completed': completed_apts,
                'cancelled': cancelled_apts,
            },
            'boardings': {
                'total': total_boardings
            }
        })
