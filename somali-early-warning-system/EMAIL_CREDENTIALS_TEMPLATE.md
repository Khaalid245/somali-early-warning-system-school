# 📧 Email Configuration Template

## Fill in Your Information Below:

### Your Gmail Address:
```
Example: khalid@gmail.com
Your email: ___________________________
```

### Your Gmail App Password (16 characters, no spaces):
```
Example: abcdefghijklmnop
Your app password: ___________________________
```

---

## How to Get Gmail App Password:

1. **Go to:** https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled)
   - Click "2-Step Verification"
   - Follow setup wizard
   - Verify with your phone

3. **Generate App Password**
   - Go back to Security page
   - Click "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Type: "School Support System"
   - Click "Generate"
   - **Copy the 16-character password**

4. **Important:** Remove spaces from the password!
   - Google shows: `abcd efgh ijkl mnop`
   - You type: `abcdefghijklmnop`

---

## After Getting Your Credentials:

### Update docker-compose.production.yml

Find these lines (appears in 2 places):

**Location 1: Backend section (around line 67-68)**
```yaml
- EMAIL_HOST_USER=your-email@gmail.com
- EMAIL_HOST_PASSWORD=your-app-password
```

**Location 2: Scheduler section (around line 115-116)**
```yaml
- EMAIL_HOST_USER=your-email@gmail.com
- EMAIL_HOST_PASSWORD=your-app-password
```

Replace with YOUR actual values:
```yaml
- EMAIL_HOST_USER=your-actual-email@gmail.com
- EMAIL_HOST_PASSWORD=your16charappppassword
```

---

## ✅ Verification

After updating, check your file has:
- [ ] Real Gmail address (not "your-email@gmail.com")
- [ ] Real app password (not "your-app-password")
- [ ] App password has NO spaces
- [ ] Updated in BOTH places (backend AND scheduler)

---

## 🚀 Ready to Deploy!

Once you've filled in your credentials, you're ready to deploy:

```bash
# Copy production config
cp docker-compose.production.yml docker-compose.yml

# Deploy
docker-compose up --build -d

# Check status
docker-compose ps
```

---

## 📝 Notes:

- **Never share your app password** with anyone
- **Don't commit** the file with real credentials to GitHub
- **Keep a backup** of your app password in a secure location
- If you lose the app password, you can generate a new one

---

**Need help?** Check FIX_DEPLOYMENT_ISSUES.md for detailed instructions.
