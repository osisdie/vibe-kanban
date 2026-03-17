import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html_body: str) -> bool:
    settings = get_settings()
    if not settings.SMTP_HOST or not settings.SMTP_APP_PASSWORD:
        logger.warning("SMTP not configured, skipping email to %s", to)
        return False

    msg = EmailMessage()
    msg["From"] = settings.SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(html_body, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_APP_PASSWORD,
            start_tls=True,
        )
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
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
