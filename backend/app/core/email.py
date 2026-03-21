import logging
from email.message import EmailMessage

import aiosmtplib
import resend

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def _send_smtp(to: str, subject: str, html_body: str) -> bool:
    settings = get_settings()
    if not settings.SMTP_HOST or not settings.SMTP_APP_PASSWORD:
        logger.warning("SMTP not configured, skipping email to %s", to)
        return False

    msg = EmailMessage()
    msg["From"] = settings.SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(html_body, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_APP_PASSWORD,
        start_tls=True,
    )
    return True


def _send_resend(to: str, subject: str, html_body: str) -> bool:
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email to %s", to)
        return False

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(
        {
            "from": f"vibe-kanban <{settings.RESEND_FROM_EMAIL}>",
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
    )
    return True


async def send_email(to: str, subject: str, html_body: str) -> bool:
    settings = get_settings()
    try:
        if settings.EMAIL_PROVIDER == "resend":
            ok = _send_resend(to, subject, html_body)
        else:
            ok = await _send_smtp(to, subject, html_body)
        if ok:
            logger.info("Email sent via %s to %s: %s", settings.EMAIL_PROVIDER, to, subject)
        return ok
    except Exception:
        logger.exception("Failed to send email to %s via %s", to, settings.EMAIL_PROVIDER)
        return False


async def send_password_reset_email(to: str, reset_token: str) -> bool:
    settings = get_settings()
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af;">Reset Your Password</h2>
        <p>You requested a password reset for your vibe-kanban account.</p>
        <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
        <a href="{reset_url}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white;
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
            Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">vibe-kanban &mdash; Ticket Tracker</p>
    </div>
    """
    return await send_email(to, "Reset Your Password — vibe-kanban", html)


async def send_verification_email(to: str, display_name: str, code: str, verify_token: str) -> bool:
    settings = get_settings()
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af;">Verify Your Email</h2>
        <p>Hi {display_name},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700;
                         letter-spacing: 6px; color: #1e40af; background: #eff6ff;
                         padding: 12px 24px; border-radius: 8px; display: inline-block;">
                {code}
            </span>
        </div>
        <p>Enter this code on the verification page, or click the button below:</p>
        <a href="{verify_url}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white;
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
            Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">
            This code expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">vibe-kanban &mdash; Ticket Tracker</p>
    </div>
    """
    return await send_email(to, f"Your verification code is {code} — vibe-kanban", html)


async def send_welcome_email(to: str, display_name: str) -> bool:
    settings = get_settings()
    login_url = f"{settings.FRONTEND_URL}/login"
    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af;">Welcome to vibe-kanban!</h2>
        <p>Hi {display_name},</p>
        <p>Your account has been created successfully. You can now create projects,
           manage Kanban boards, and integrate AI agents via the API.</p>
        <a href="{login_url}"
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white;
                  text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
            Go to vibe-kanban
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">vibe-kanban &mdash; Ticket Tracker</p>
    </div>
    """
    return await send_email(to, "Welcome to vibe-kanban!", html)
