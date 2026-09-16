from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer
from users.permissions import IsStaffOrAdmin

class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related('customer', 'pet', 'appointment', 'boarding_booking').prefetch_related('payments').all()

        if user.role == 'CUSTOMER' and not user.is_superuser:
            queryset = queryset.filter(customer__user=user)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(payment_status=status_param.upper())

        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search) |
                Q(pet__name__icontains=search)
            )

        return queryset

class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER' and not user.is_superuser:
            return Invoice.objects.filter(customer__user=user)
        return Invoice.objects.all()

class PaymentCreateView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, invoice_id):
        try:
            invoice = Invoice.objects.get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

        amount = request.data.get('amount')
        method = request.data.get('payment_method', invoice.payment_method)
        txn = request.data.get('transaction_id', '')
        notes = request.data.get('notes', '')

        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            invoice=invoice,
            amount=amount,
            payment_method=method,
            transaction_id=txn,
            notes=notes
        )

        total_paid = sum(float(p.amount) for p in invoice.payments.all())
        if total_paid >= float(invoice.total_amount):
            invoice.payment_status = Invoice.PaymentStatus.PAID
            invoice.paid_at = timezone.now()
        elif total_paid > 0:
            invoice.payment_status = Invoice.PaymentStatus.PARTIALLY_PAID
        invoice.save()

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
