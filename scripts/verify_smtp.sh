#!/usr/bin/env bash
# Verify email credentials and send a test email.
# Usage: ./scripts/verify_smtp.sh --provider gmail     # test SMTP (Gmail)
#        ./scripts/verify_smtp.sh --provider resend     # test Resend API
#
# Gmail   — requires SMTP_USER, SMTP_APP_PASSWORD in .env
# Resend  — requires RESEND_API_KEY, RESEND_FROM_EMAIL in .env
# Recipients default to CONTACT_ADMIN_EMAILS, fallback to sender.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Parse --provider argument
PROVIDER=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --provider)
      PROVIDER="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 --provider <gmail|resend>"
      exit 1
      ;;
  esac
done

if [[ -z "$PROVIDER" ]]; then
  echo "Usage: $0 --provider <gmail|resend>"
  exit 1
fi

# Use venv Python if available
PYTHON=""
if [[ -x "$PROJECT_ROOT/backend/.venv/bin/python" ]]; then
  PYTHON="$PROJECT_ROOT/backend/.venv/bin/python"
elif [[ -x "$PROJECT_ROOT/.venv/bin/python" ]]; then
  PYTHON="$PROJECT_ROOT/.venv/bin/python"
else
  PYTHON="python3"
fi

if [[ "$PROVIDER" == "resend" ]]; then
  # ── Resend ──────────────────────────────────────────
  if [[ -z "$RESEND_API_KEY" ]]; then
    echo "Error: RESEND_API_KEY not set. Set it in .env"
    exit 1
  fi
  if [[ -z "$RESEND_FROM_EMAIL" ]]; then
    echo "Error: RESEND_FROM_EMAIL not set. Set it in .env"
    exit 1
  fi

  echo "Testing Resend (from: $RESEND_FROM_EMAIL)..."
  cd "$PROJECT_ROOT/backend" && "$PYTHON" -m pip install -q resend 2>/dev/null || true

  "$PYTHON" -c "
import os, re, sys
import resend

api_key = os.environ['RESEND_API_KEY']
from_email = os.environ['RESEND_FROM_EMAIL']
admin_emails_raw = os.environ.get('CONTACT_ADMIN_EMAILS', '')

resend.api_key = api_key
html = '<p>This is a test email sent by the Vibe Kanban verification script (Resend).</p>'

def get_recipients():
    if admin_emails_raw:
        parts = re.split(r'[,;]', admin_emails_raw)
        addrs = [e.strip().strip('\"').strip(\"'\") for e in parts if e.strip()]
        if addrs:
            return addrs
    return [from_email]

try:
    to_addrs = get_recipients()
    resp = resend.Emails.send({
        'from': f'vibe-kanban <{from_email}>',
        'to': to_addrs,
        'subject': '[Vibe Kanban] Resend Test Email',
        'html': html,
    })
    print(f'OK — Resend API key valid. Email sent to {to_addrs}')
    print(f'     Message ID: {resp[\"id\"]}')
except resend.exceptions.ResendError as e:
    print(f'Failed: {e}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'Failed: {e}', file=sys.stderr)
    sys.exit(1)
"

elif [[ "$PROVIDER" == "gmail" ]]; then
  # ── Gmail SMTP ──────────────────────────────────────
  if [[ -z "$SMTP_USER" ]]; then
    echo "Error: SMTP_USER not set. Set it in .env"
    exit 1
  fi
  if [[ -z "$SMTP_APP_PASSWORD" ]]; then
    echo "Error: SMTP_APP_PASSWORD not set. Set it in .env"
    exit 1
  fi

  SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
  SMTP_PORT="${SMTP_PORT:-587}"
  export SMTP_HOST SMTP_PORT

  echo "Testing Gmail SMTP ($SMTP_HOST:$SMTP_PORT, user: $SMTP_USER)..."
  cd "$PROJECT_ROOT/backend" && "$PYTHON" -m pip install -q aiosmtplib 2>/dev/null || true

  "$PYTHON" -c "
import asyncio
import os
import re
import sys
from email.message import EmailMessage

import aiosmtplib

host = os.environ['SMTP_HOST']
port = int(os.environ.get('SMTP_PORT', '587'))
user = os.environ['SMTP_USER']
password = os.environ['SMTP_APP_PASSWORD']
admin_emails_raw = os.environ.get('CONTACT_ADMIN_EMAILS', '')


async def send_test_email(to_addrs, subject, html):
    for to in to_addrs:
        msg = EmailMessage()
        msg['From'] = user
        msg['To'] = to
        msg['Subject'] = subject
        msg.set_content(html, subtype='html')
        kwargs = {'hostname': host, 'port': port, 'username': user, 'password': password}
        if port == 465:
            kwargs['use_tls'] = True
        else:
            kwargs['start_tls'] = True
        await aiosmtplib.send(msg, **kwargs)


async def main():
    html = '<p>This is a test email sent by the Vibe Kanban SMTP verification script.</p>'
    if admin_emails_raw:
        parts = re.split(r'[,;]', admin_emails_raw)
        to_addrs = [e.strip().strip('\"').strip(\"'\") for e in parts if e.strip()]
    else:
        to_addrs = [user]
    await send_test_email(to_addrs, '[Vibe Kanban] Gmail SMTP Test Email', html)
    print('OK — SMTP credentials valid. Login succeeded.')
    print(f'OK — Test email sent to {to_addrs}')


try:
    asyncio.run(main())
except aiosmtplib.SMTPAuthenticationError as e:
    print(f'Failed: SMTP authentication failed — {e}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'Failed: {e}', file=sys.stderr)
    sys.exit(1)
"

else
  echo "Error: Unknown provider '$PROVIDER'. Use: gmail or resend"
  exit 1
fi
