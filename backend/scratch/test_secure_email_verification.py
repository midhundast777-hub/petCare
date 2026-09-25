import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
import random
import string
import unittest
from datetime import timedelta

# Set up Django environment to query models directly
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from django.utils import timezone
from users.models import User, EmailVerificationToken

BASE_URL = "http://127.0.0.1:8000"


def make_req(method, endpoint, payload=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    h = headers or {}
    if payload is not None and "Content-Type" not in h:
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed


class SecureEmailVerificationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rand_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
        cls.test_email = f"secure_suite_{cls.rand_suffix}@example.com"
        cls.test_phone = f"555{random.randint(1000000, 9999999)}"
        cls.password = "P@ssword123!"

    @classmethod
    def tearDownClass(cls):
        User.objects.filter(email=cls.test_email.lower()).delete()
        EmailVerificationToken.objects.filter(email=cls.test_email.lower()).delete()

    def test_01_user_registration_and_initial_unverified_state(self):
        """Req 1 & 2 & 10: Registration succeeds with requires_verification=True, user is not verified yet."""
        status, resp = make_req("POST", "/api/auth/register/", {
            "username": f"user_{self.rand_suffix}",
            "email": self.test_email,
            "phone": self.test_phone,
            "first_name": "Secure",
            "last_name": "Verifier",
            "role": "CUSTOMER",
            "password": self.password,
            "password_confirm": self.password
        })
        self.assertEqual(status, 201, f"Registration failed: {resp}")
        self.assertTrue(resp.get("requires_verification"), "Response must indicate requires_verification=True")

        # Database state: user must NOT be marked verified before clicking button (Req 10)
        user = User.objects.get(email=self.test_email.lower())
        self.assertFalse(user.is_email_verified, "User must NOT be verified merely upon creation")

    def test_02_secure_token_generation_and_expiry(self):
        """Req 2: Token is cryptographically secure (>=48 chars), single-use flag initial, 30 min expiry."""
        user = User.objects.get(email=self.test_email.lower())
        token_record = EmailVerificationToken.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(token_record, "EmailVerificationToken must be created for newly registered user")
        self.assertGreaterEqual(len(token_record.token), 48, "Token must be at least 48 characters")
        self.assertFalse(token_record.is_used, "Token must initially be unused")

        # Expiry time check: 30 minutes
        minutes_remaining = (token_record.expires_at - timezone.now()).total_seconds() / 60.0
        self.assertTrue(25 <= minutes_remaining <= 31, f"Token expiry should be ~30 min, got {minutes_remaining}")

    def test_03_login_blocked_for_unverified_customer(self):
        """Security: Unverified customer cannot log in; receives HTTP 403 and requires_email_verification flag."""
        status, resp = make_req("POST", "/api/auth/login/", {
            "email": self.test_email,
            "password": self.password
        })
        self.assertEqual(status, 403, f"Expected 403 Forbidden, got {status}")
        self.assertTrue(resp.get("requires_email_verification"), "Expected requires_email_verification=True")

    def test_04_invalid_token_rejected(self):
        """Req 8: Invalid token returns HTTP 400 and exact spec message."""
        status, resp = make_req("GET", "/api/auth/verify-email/?token=invalid_dummy_token_9999")
        self.assertEqual(status, 400)
        self.assertIn(
            "This verification link is invalid or has expired. Please request a new verification email.",
            str(resp)
        )

    def test_05_valid_token_verification_and_success_message(self):
        """Req 5, 6, 7: Clicking 'Yes, It's Me' validates token, marks email verified, invalidates token, shows spec success."""
        user = User.objects.get(email=self.test_email.lower())
        token_record = EmailVerificationToken.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(token_record)

        status, resp = make_req("GET", f"/api/auth/verify-email/?token={token_record.token}")
        self.assertEqual(status, 200)
        self.assertIn(
            "Email verified successfully. You can now continue using your account.",
            str(resp)
        )

        user.refresh_from_db()
        token_record.refresh_from_db()
        self.assertTrue(user.is_email_verified, "User must be marked is_email_verified=True")
        self.assertTrue(token_record.is_used, "Token must be invalidated (is_used=True) after use")

    def test_06_single_use_enforcement(self):
        """Req 6 & 8: Re-using the same token must fail with spec error message."""
        user = User.objects.get(email=self.test_email.lower())
        used_token = EmailVerificationToken.objects.filter(user=user, is_used=True).first()
        self.assertIsNotNone(used_token)

        status, resp = make_req("GET", f"/api/auth/verify-email/?token={used_token.token}")
        self.assertEqual(status, 400)
        self.assertIn(
            "This verification link is invalid or has expired. Please request a new verification email.",
            str(resp)
        )

    def test_07_expired_token_rejected(self):
        """Req 6 & 8: Expired token returns HTTP 400 with spec error message."""
        user = User.objects.get(email=self.test_email.lower())
        expired = EmailVerificationToken.objects.create(
            user=user,
            email=user.email,
            token=f"exp_{self.rand_suffix}_{random.randint(100000, 999999)}",
            is_used=False,
            expires_at=timezone.now() - timedelta(minutes=10)
        )
        status, resp = make_req("GET", f"/api/auth/verify-email/?token={expired.token}")
        self.assertEqual(status, 400)
        self.assertIn(
            "This verification link is invalid or has expired. Please request a new verification email.",
            str(resp)
        )

    def test_08_resend_verification_endpoint_and_anti_enumeration(self):
        """Req 9 & Security: Resend verification email, anti-enumeration identical response, rate limiting."""
        user = User.objects.get(email=self.test_email.lower())
        user.is_email_verified = False
        user.save()

        # Age any previous tokens past 60s
        EmailVerificationToken.objects.filter(email=self.test_email.lower()).update(
            created_at=timezone.now() - timedelta(seconds=70)
        )

        status, resp = make_req("POST", "/api/auth/resend-verification/", {"email": self.test_email})
        self.assertEqual(status, 200)
        self.assertEqual(
            resp.get("detail"),
            "If an account exists with this email, a verification link has been sent."
        )

        # Anti-enumeration test for nonexistent email
        status_ghost, resp_ghost = make_req("POST", "/api/auth/resend-verification/", {
            "email": "nonexistent_ghost_address_9999@example.com"
        })
        self.assertEqual(status_ghost, 200)
        self.assertEqual(
            resp_ghost.get("detail"),
            "If an account exists with this email, a verification link has been sent."
        )

        # Rate limiting: immediate duplicate request must return HTTP 429
        status_rate, resp_rate = make_req("POST", "/api/auth/resend-verification/", {"email": self.test_email})
        self.assertEqual(status_rate, 429)


if __name__ == "__main__":
    unittest.main()
