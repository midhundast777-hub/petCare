from django.urls import path
from .views import InvoiceListCreateView, InvoiceDetailView, PaymentCreateView

urlpatterns = [
    path('invoices/', InvoiceListCreateView.as_view(), name='invoice_list_create'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('invoices/<int:invoice_id>/payments/', PaymentCreateView.as_view(), name='payment_create'),
]
