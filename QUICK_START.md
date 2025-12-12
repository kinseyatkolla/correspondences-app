# Quick Start: Getting Ready for TestFlight

Follow these steps to get your app ready for TestFlight submission.

## Immediate Next Steps

### 1. Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2. Login to EAS

```bash
cd frontend
eas login
```

### 3. Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Click "Enroll" and complete the process
3. Wait for approval (24-48 hours)
4. Pay the $99 annual fee

### 4. Get Your Apple Developer Credentials

Once enrolled, collect these three pieces of information:

**A. Apple ID (Email)**

- The email you use to log into developer.apple.com
- Example: `your-email@example.com`

**B. Team ID**

1. Go to https://developer.apple.com/account
2. Click "Membership"
3. Find "Team ID" (10 characters like `ABC123DEF4`)

**C. App Store Connect App ID**

1. Go to https://appstoreconnect.apple.com
2. Create a new app (see full guide for details)
3. Go to App Information
4. Find the numeric "Apple ID" (like `1234567890`)

### 5. Update eas.json

Edit `frontend/eas.json` and replace:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_ACTUAL_APPLE_ID@example.com", // ← Replace with your email
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID", // ← Replace with numeric ID
        "appleTeamId": "YOUR_TEAM_ID" // ← Replace with Team ID
      }
    }
  }
}
```

### 6. Create Your First Build

```bash
cd frontend
eas build --platform ios --profile production
```

This will take 10-20 minutes. You can monitor progress at:
https://expo.dev/accounts/[your-account]/projects/correspondences/builds

### 7. Submit to TestFlight

Once the build completes:

```bash
eas submit --platform ios --profile production
```

Or manually upload via Transporter app (see full guide).

## What's Already Configured ✅

- ✅ API URL configured for production
- ✅ Bundle identifier set: `com.kinsey.kinsey.correspondences`
- ✅ Privacy permissions descriptions added
- ✅ App icon and splash screen configured
- ✅ Encryption compliance set (ITSAppUsesNonExemptEncryption: false)

## Common Issues

**Build fails?**

- Check: `eas build:view [build-id]` for error logs
- Verify: All dependencies in `package.json` are compatible

**Can't find Team ID?**

- Make sure you're enrolled in Apple Developer Program
- Check "Membership" section in developer.apple.com

**App Store Connect App ID not found?**

- You need to create the app in App Store Connect first
- See full guide (APP_STORE_SUBMISSION_GUIDE.md) for details

## Next Steps After TestFlight

1. Test the app thoroughly
2. Gather feedback from testers
3. Prepare App Store listing (screenshots, description)
4. Submit for App Store review

See `APP_STORE_SUBMISSION_GUIDE.md` for complete instructions.
