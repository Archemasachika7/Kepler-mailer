# Kepler Codes — Mail Bot

Send bulk promotional emails to leads. Upload a CSV/Excel file to extract emails automatically.

---

## SMTP Settings — Vercel Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `SMTP_FROM_NAME` | Sender name shown in inbox (e.g. "Kepler Codes") |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port |
| `SMTP_SECURE` | `true` for port 465, `false` for port 587 |
| `SMTP_USER` | Your email address |
| `SMTP_PASSWORD` | Your password or app password |

---

## Provider Presets

### Gmail
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASSWORD` | 16-char App Password (not your real password) |

**Getting Gmail App Password:**
1. myaccount.google.com → Security
2. Enable 2-Step Verification
3. App passwords → Generate → copy 16-char code

### Outlook / Hotmail
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your Outlook email |
| `SMTP_PASSWORD` | your password |

### Yahoo Mail
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.mail.yahoo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your Yahoo email |
| `SMTP_PASSWORD` | App password from Yahoo security settings |

### Custom SMTP (Hostinger, GoDaddy, cPanel)
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `mail.yourdomain.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | your email |
| `SMTP_PASSWORD` | your password |

---

## Deploy to Vercel

```bash
npm install
npm run dev       # test locally first

git init
git add .
git commit -m "Kepler mail bot"
git remote add origin https://github.com/YOUR_USERNAME/kepler-mail-bot.git
git push -u origin main
```

Then import on vercel.com → add environment variables → Deploy.

---

## How to use

1. **Email list** tab → upload CSV/Excel → emails auto-extracted
2. **Compose** tab → edit subject & body (HTML supported), live preview
3. Click **Send** → emails go out one by one
4. **Send log** tab → track sent/failed
