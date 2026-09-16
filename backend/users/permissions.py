from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role == 'ADMIN' or request.user.is_superuser
        ))

class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ['ADMIN', 'STAFF'] or request.user.is_superuser
        ))

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER')

class IsOwnerOrStaffAdmin(permissions.BasePermission):
    """Allows staff/admin full access, or owners access to their own records."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['ADMIN', 'STAFF'] or request.user.is_superuser:
            return True
        # Check if object has user or customer link
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        if hasattr(obj, 'customer') and hasattr(obj.customer, 'user') and obj.customer.user == request.user:
            return True
        if hasattr(obj, 'owner') and hasattr(obj.owner, 'user') and obj.owner.user == request.user:
            return True
        return False
