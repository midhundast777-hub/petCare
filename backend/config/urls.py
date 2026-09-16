from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/pets/', include('pets.urls')),
    path('api/services/', include('services.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/boarding/', include('boarding.urls')),
    path('api/vaccinations/', include('vaccinations.urls')),
    path('api/medical/', include('medical.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
