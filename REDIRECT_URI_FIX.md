# 🔧 Google Redirect URI Fix

## The Problem
Google says: **"Invalid Origin: URIs must not contain a path or end with '/'"**

This means you're likely entering the URI in the **wrong field**.

---

## ✅ Solution: Two Separate Fields

Google OAuth requires **TWO different URIs** in different fields:

### Field 1: Authorized JavaScript Origins
- **What:** Your domain ONLY (no path)
- **Format:** `https://service-reminder.kamatanuj.workers.dev`
- **NO path, NO trailing slash**
- **NO callback path**

### Field 2: Authorized Redirect URIs  
- **What:** The full callback URL
- **Format:** `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`
- **Must match EXACTLY** in your code

---

## 📍 Where to Enter in Google Cloud Console

1. Go to: https://console.cloud.google.com
2. APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID (or create new one)
4. You'll see TWO separate sections:

```
┌─────────────────────────────────────────┐
│  Authorized JavaScript origins            │
│  ─────────────────────────────────────  │
│                                         │
│  + ADD URI                              │
│                                         │
│  → https://service-reminder.kamatanuj.    │
│    workers.dev                          │
│                                         │
├─────────────────────────────────────────┤
│  Authorized redirect URIs                 │
│  ─────────────────────────────────────  │
│                                         │
│  + ADD URI                              │
│                                         │
│  → https://service-reminder.kamatanuj.    │
│    workers.dev/auth/google/callback       │
│                                         │
└─────────────────────────────────────────┘
```

---

## ❌ Common Mistakes

| Mistake | Wrong | Correct |
|---------|-------|---------|
| Trailing slash in origins | `https://example.com/` | `https://example.com` |
| HTTP instead of HTTPS | `http://example.com` | `https://example.com` |
| Path in origins field | `https://example.com/auth` | `https://example.com` |
| Missing path in redirect | `https://example.com` | `https://example.com/auth/callback` |
| Trailing slash in redirect | `https://example.com/auth/callback/` | `https://example.com/auth/callback` |

---

## 🔍 How to Check Your Setup

### Step 1: Verify in Google Console
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client
3. Check both fields:
   - JavaScript origins: Should be JUST the domain
   - Redirect URIs: Should be the FULL callback URL

### Step 2: Verify in Your Code
Make sure your code uses EXACTLY the same redirect URI:

```javascript
// Must match EXACTLY what's in Google Console
const REDIRECT_URI = 'https://service-reminder.kamatanuj.workers.dev/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
```

---

## 🚀 Quick Fix Steps

### 1. Go to Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### 2. Edit Your OAuth Client
- Find your client ID under "OAuth 2.0 Client IDs"
- Click the **pencil/edit icon**

### 3. Update JavaScript Origins
Delete any wrong entries, add:
```
https://service-reminder.kamatanuj.workers.dev
```

### 4. Update Redirect URIs
Delete any wrong entries, add:
```
https://service-reminder.kamatanuj.workers.dev/auth/google/callback
```

### 5. Save
Click **"SAVE"** at the bottom

---

## ✅ After Fix

Your setup should look like:

**Authorized JavaScript origins:**
- `https://service-reminder.kamatanuj.workers.dev`

**Authorized redirect URIs:**
- `https://service-reminder.kamatanuj.workers.dev/auth/google/callback`

---

## 🧪 Test It

After fixing, test by visiting:
```
https://service-reminder.kamatanuj.workers.dev/admin/setup-calendar
```

If it redirects to Google and shows the consent screen, it's working!

---

## 📞 Still Having Issues?

1. **Wait 5 minutes** after saving (changes take time to propagate)
2. **Clear browser cache** and try again
3. **Check for typos** in both Google Console and your code
4. **Make sure HTTPS** - Google doesn't allow HTTP for production

---

## 📝 Summary

| Field | Correct Value |
|-------|--------------|
| JavaScript Origins | `https://service-reminder.kamatanuj.workers.dev` |
| Redirect URI | `https://service-reminder.kamatanuj.workers.dev/auth/google/callback` |

**The key difference:**
- Origins = Just the domain
- Redirect URI = Full URL including path