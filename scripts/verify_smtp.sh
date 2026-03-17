#!/usr/bin/env bash
# Verify SMTP credentials (Gmail App Password or similar).
# Usage: ./scripts/verify_smtp.sh
#        ./scripts/verify_smtp.sh --send-test   # also send a test email to CONTACT_ADMIN_EMAILS
#        SMTP_USER=xxx SMTP_APP_PASSWORD=xxx ./scripts/verify_smtp.sh
#
# Requires: SMTP_USER, SMTP_APP_PASSWORD in .env (or env)
#           SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 587)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "$SMTP_USER" ]]; then
  echo "Error: SMTP_USER not set. Set it in .env or: SMTP_USER=xxx $0"
  exit 1
fi

if [[ -z "$SMTP_APP_PASSWORD" ]]; then
  echo "Error: SMTP_APP_PASSWORD not set. Set it in .env or: SMTP_APP_PASSWORD=xxx $0"
  exit 1
fi

SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_HOST SMTP_PORT
SEND_TEST=false
if [[ "${1:-}" == "--send-test" ]]; then
  SEND_TEST=true
fi
export SEND_TEST

echo "Verifying SMTP ($SMTP_HOST:$SMTP_PORT, user: $SMTP_USER)..."

# Use venv Python if available; ensure aiosmtplib is installed
PYTHON=""
if [[ -x "$PROJECT_ROOT/backend/.venv/bin/python" ]]; then
  PYTHON="$PROJECT_ROOT/backend/.venv/bin/python"
elif [[ -x "$PROJECT_ROOT/.venv/bin/python" ]]; then
  PYTHON="$PROJECT_ROOT/.venv/bin/python"
else
  PYTHON="python3"
fi
cd "$PROJECT_ROOT/backend" && "$PYTHON" -m pip install -q aiosmtplib 2>/dev/null || true && "$PYTHON" -c "
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
send_test = os.environ.get('SEND_TEST', 'false').lower() == 'true'
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
    if send_test and admin_emails_raw:
        parts = re.split(r'[,;]', admin_emails_raw)
        to_addrs = [e.strip().strip('\"').strip(\"'\") for e in parts if e.strip()]
        if to_addrs:
            await send_test_email(to_addrs, '[Vibe Kanban] SMTP Test Email', html)
            print('OK — SMTP credentials valid. Login succeeded.')
            print(f'OK — Test email sent to {to_addrs}')
        else:
            await send_test_email([user], '[Vibe Kanban] SMTP verification', html)
            print('OK — SMTP credentials valid. Login succeeded.')
            print('Note: CONTACT_ADMIN_EMAILS empty, sent verification to self.')
    else:
        await send_test_email([user], '[Vibe Kanban] SMTP verification', html)
        print('OK — SMTP credentials valid. Login succeeded.')


try:
    asyncio.run(main())
except aiosmtplib.SMTPAuthenticationError as e:
    print(f'Failed: SMTP authentication failed — {e}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'Failed: {e}', file=sys.stderr)
    sys.exit(1)
"