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

    @staticmethod
    def send_dunning_reminder(email: str, name: str | None, days_overdue: int) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#f59e0b">Payment overdue ({days_overdue} days)</h2>
            <p>{greeting}</p>
            <p>Your payment is {days_overdue} days overdue. Please update your payment method to keep your Pro features active. Your Pro access will be suspended after 7 days.</p>
            <a href="{settings.app_url}/settings"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Update Payment
            </a>
        </div>
        """
        EmailService._send(email, f'Payment overdue — {days_overdue} days', html)

    # ── trial emails ─────────────────────────────────

    @staticmethod
    def send_trial_started_email(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">Your 14-day Pro trial has started! 🎉</h2>
            <p>{greeting}</p>
            <p>You now have full access to every Pro feature for the next 14 days — no credit card required.</p>
            <ul style="color:#888;font-size:14px;line-height:1.8">
                <li>AI Training Coach</li>
                <li>Advanced progress analytics</li>
                <li>Unlimited templates and goals</li>
                <li>Data export</li>
                <li>Equipment profiles</li>
            </ul>
            <a href="{settings.app_url}/ai-coach"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Try the AI Coach
            </a>
            <p style="color:#888;font-size:13px">Upgrade anytime from Settings to keep access after your trial.</p>
        </div>
        """
        EmailService._send(email, 'Your 14-day Pro trial has started', html)

    @staticmethod
    def send_trial_midpoint_email(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#a3e635">7 days of your Pro trial remaining</h2>
            <p>{greeting}</p>
            <p>You're halfway through your free trial. Have you tried the AI Coach yet?</p>
            <p>Chat with your personal AI training coach, get exercise tips, and auto-generate workouts from plain text.</p>
            <a href="{settings.app_url}/ai-coach"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Open AI Coach
            </a>
            <a href="{settings.app_url}/settings"
               style="display:inline-block;padding:12px 28px;background:transparent;color:#a3e635;
                      border:1px solid #a3e635;border-radius:8px;text-decoration:none;font-weight:600;
                      margin:16px 0 0 8px">
                Upgrade to Pro
            </a>
        </div>
        """
        EmailService._send(email, 'Reminder: 7 days left in your Pro trial', html)

    @staticmethod
    def send_trial_ending_email(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#f59e0b">Your Pro trial ends in 2 days</h2>
            <p>{greeting}</p>
            <p>Your 14-day Pro trial is almost over. Upgrade now to keep uninterrupted access to all Pro features.</p>
            <a href="{settings.app_url}/settings"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Upgrade to Pro — from $4.99/mo
            </a>
            <p style="color:#888;font-size:13px">Save 50% with the yearly plan ($29.99/yr).</p>
        </div>
        """
        EmailService._send(email, 'Your Pro trial ends in 2 days', html)

    @staticmethod
    def send_trial_expired_email(email: str, name: str | None) -> None:
        greeting = f'Hi {name},' if name else 'Hi there,'
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2>Your Pro trial has ended</h2>
            <p>{greeting}</p>
            <p>Your 14-day free trial has ended and your account has reverted to the free plan. Your workout data is safe.</p>
            <p>Upgrade to Pro to regain access to AI Coach, advanced analytics, unlimited templates, and data export.</p>
            <a href="{settings.app_url}/settings"
               style="display:inline-block;padding:12px 28px;background:#a3e635;color:#000;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Upgrade to Pro
            </a>
        </div>
        """
        EmailService._send(email, 'Your Pro trial has ended', html)
