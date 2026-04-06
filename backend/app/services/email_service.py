import logging

from app.core.config import settings

logger = logging.getLogger('gym_tracker')


class EmailService:
    """Fire-and-forget transactional emails via Resend."""

    @staticmethod
    def is_available() -> bool:
        return bool(settings.resend_api_key)

    @staticmethod
    def _send(to: str, subject: str, html: str) -> None:
        if not EmailService.is_available():
            logger.debug('Email skipped — RESEND_API_KEY not configured')
            return
        try:
            import resend
            resend.api_key = settings.resend_api_key
            resend.Emails.send({
                'from': settings.from_email,
                'to': [to],
                'subject': subject,
                'html': html,
            })
        except Exception:
            logger.exception('Failed to send email to %s', to)

    # ── auth emails ──────────────────────────────────

    @staticmethod
    def send_verification_email(email: str, name: str | None, token: str) -> None:
        link = f'{settings.app_url}/verify-email?token={token}'
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">Verify your email</h2>
            <p>{greeting}</p>
            <p>Click the button below to verify your email and activate your account.</p>
            <a href="{link}"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Verify Email
            </a>
            <p style="color:#888;font-size:13px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
        """
        EmailService._send(email, 'Verify your email', html)

    @staticmethod
    def send_password_reset_email(email: str, name: str | None, token: str) -> None:
        link = f'{settings.app_url}/reset-password?token={token}'
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">Reset your password</h2>
            <p>{greeting}</p>
            <p>We received a password reset request for your account. Click the button below to set a new password.</p>
            <a href="{link}"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Reset Password
            </a>
            <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
        """
        EmailService._send(email, 'Reset your password', html)

    @staticmethod
    def send_welcome_email(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">Welcome! 🎉</h2>
            <p>{greeting}</p>
            <p>Your email is verified and your account is fully active. Start tracking your workouts and building your progression timeline.</p>
            <a href="{settings.app_url}/workouts"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Go to Dashboard
            </a>
        </div>
        """
        EmailService._send(email, 'Welcome to your training dashboard', html)

    # ── billing emails ───────────────────────────────

    @staticmethod
    def send_pro_welcome(email: str, name: str | None, plan: str) -> None:
        plan_label = 'monthly' if 'monthly' in plan else 'yearly'
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">Welcome to Pro! 🚀</h2>
            <p>{greeting}</p>
            <p>Your Pro {plan_label} subscription is now active. You have access to all features including AI Coach, advanced analytics, unlimited templates and exports.</p>
            <a href="{settings.app_url}/workouts"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Explore Pro Features
            </a>
        </div>
        """
        EmailService._send(email, 'Welcome to Pro', html)

    @staticmethod
    def send_subscription_cancelled(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2>Subscription cancelled</h2>
            <p>{greeting}</p>
            <p>Your Pro subscription has been cancelled. You'll retain Pro access until the end of your current billing period, then your account will revert to the free tier.</p>
            <p>Your workout data is safe — nothing is deleted.</p>
        </div>
        """
        EmailService._send(email, 'Your Pro subscription has been cancelled', html)

    @staticmethod
    def send_payment_failed(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#ef4444">Payment failed</h2>
            <p>{greeting}</p>
            <p>We weren't able to process your latest payment. Please update your payment method to keep your Pro features active.</p>
            <a href="{settings.app_url}/settings"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Update Payment
            </a>
        </div>
        """
        EmailService._send(email, 'Action needed: payment failed', html)
