# App Store Submission Guide for CORRESPONDENCES

This guide will walk you through the complete process of submitting your app to TestFlight and eventually the App Store.

## Prerequisites

1. **Apple Developer Account** ($99/year)

   - You need an active Apple Developer Program membership
   - Visit: https://developer.apple.com/programs/

2. **EAS CLI** (Expo Application Services)

   - Install: `npm install -g eas-cli`
   - Login: `eas login`

3. **Xcode** (for local builds/testing, optional)
   - Download from Mac App Store

## Step 1: Apple Developer Account Setup

### 1.1 Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID
4. Complete enrollment (takes 24-48 hours for approval)
5. Pay the $99 annual fee

### 1.2 Get Your Team ID

1. Log into https://developer.apple.com/account
2. Go to "Membership" section
3. Find your **Team ID** (10-character string like `ABC123DEF4`)
4. Save this - you'll need it for `eas.json`

## Step 2: App Store Connect Setup

### 2.1 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: CORRESPONDENCES (or your preferred name)
   - **Primary Language**: English
   - **Bundle ID**: Select `com.kinsey.kinsey.correspondences` (create it if needed)
   - **SKU**: A unique identifier (e.g., `correspondences-001`)
   - **User Access**: Full Access
4. Click "Create"

### 2.2 Get Your App Store Connect App ID

1. In App Store Connect, go to your app
2. Click "App Information"
3. Find **Apple ID** (numeric, like `1234567890`)
4. Save this - you'll need it for `eas.json`

### 2.3 Configure App Information

Fill in all required fields in App Store Connect:

**App Information:**

- Category: Choose appropriate categories (e.g., "Lifestyle", "Reference")
- Privacy Policy URL: (Required) You'll need to host a privacy policy
- Subtitle: Brief description (30 characters max)

**Pricing and Availability:**

- Price: Free or Paid
- Availability: Select countries

**App Privacy:**

- Click "Get Started" under App Privacy
- Answer questions about data collection:
  - Location: Yes (for astrological calculations)
  - No other data collection needed

## Step 3: Configure EAS Secrets for Apple Credentials

### 3.1 Set Up EAS Secrets

**IMPORTANT:** For security, credentials are stored as EAS Secrets instead of hardcoded in `eas.json`. This prevents sensitive information from being exposed in version control.

Run these commands in the `frontend` directory. For each command, follow the interactive prompts:

```bash
cd frontend

# Set your Apple ID (email)
eas env:create --scope project --name EAS_APPLE_ID --value "your-email@example.com" --type string

# Set your App Store Connect App ID (numeric ID from Step 2.2, stored as string)
eas env:create --scope project --name EAS_ASC_APP_ID --value "1234567890" --type string

# Set your Apple Team ID (from Step 1.2)
eas env:create --scope project --name EAS_APPLE_TEAM_ID --value "ABC123DEF4" --type string
```

When prompted for each variable:

1. **Select environment:** Choose `production`
2. **Select visibility:** Choose `Secret` (these are sensitive credentials)
3. **Select type:** Choose `string` (should be pre-selected if you used `--type string`)

Where:

- `EAS_APPLE_ID`: Your Apple ID email (e.g., `your-email@example.com`) - **string**
- `EAS_ASC_APP_ID`: The numeric Apple ID from App Store Connect (Step 2.2) - stored as **string**
- `EAS_APPLE_TEAM_ID`: Your Team ID from Apple Developer (Step 1.2) - **string**

**Important:** All three should be stored as **string** type, even though `EAS_ASC_APP_ID` is numeric.

The `eas.json` file already references these environment variables using syntax (`${EAS_APPLE_ID}`, etc.), so no changes to `eas.json` are needed.

**Verify environment variables were created:**

```bash
eas env:list --scope project
```

See `frontend/EAS_SECRETS_SETUP.md` for detailed instructions and troubleshooting.

### 3.2 Verify API URL

Ensure your production API URL in `eas.json` is correct:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://correspondences-app-production.up.railway.app/api"
      }
    }
  }
}
```

## Step 4: Build for TestFlight

### 4.1 Create Production Build

From the `frontend` directory:

```bash
cd frontend
eas build --platform ios --profile production
```

This will:

1. Upload your code to EAS servers
2. Build the iOS app
3. Generate an `.ipa` file
4. Take 10-20 minutes

### 4.2 Monitor Build Progress

```bash
eas build:list
```

Or check the EAS dashboard: https://expo.dev/accounts/[your-account]/projects/correspondences/builds

## Step 5: Submit to TestFlight

### Option A: Automatic Submission (Recommended)

If you configured `eas.json` correctly:

```bash
eas submit --platform ios --profile production
```

This automatically uploads your build to App Store Connect.

### Option B: Manual Submission

1. Download the `.ipa` file from EAS dashboard
2. Open **Transporter** app (from Mac App Store)
3. Drag and drop the `.ipa` file
4. Click "Deliver"
5. Wait for processing (can take 30 minutes to several hours)

### 5.1 Process Build in App Store Connect

1. Go to App Store Connect → Your App → TestFlight
2. Wait for processing to complete (usually 30-60 minutes)
3. Once processed, you'll see the build under "iOS Builds"

### 5.2 Add Test Information

1. Go to "Test Information" tab
2. Fill in:
   - **What to Test**: Describe what testers should focus on
   - **Feedback Email**: Your email for tester feedback
   - **Marketing URL**: (Optional) Your website
   - **Privacy Policy URL**: (Required) Your privacy policy URL

### 5.3 Add Internal Testers

1. Go to "Internal Testing" tab
2. Click "+" to create a group
3. Add testers (must be added in "Users and Access" first)
4. Select the build
5. Click "Start Testing"

### 5.4 Add External Testers (Beta Testing)

1. Go to "External Testing" tab
2. Click "+" to create a group
3. Add testers (up to 10,000)
4. Select the build
5. Fill in Beta App Description
6. Submit for Beta App Review (takes 24-48 hours)

## Step 6: Prepare for App Store Submission

### 6.1 App Store Listing

Go to "App Store" tab in App Store Connect and fill in:

**App Preview and Screenshots:**

- iPhone 6.7" Display (iPhone 14 Pro Max, etc.)
- iPhone 6.5" Display (iPhone 11 Pro Max, etc.)
- iPhone 5.5" Display (iPhone 8 Plus, etc.)
- iPad Pro (12.9") - if supporting iPad
- iPad Pro (11") - if supporting iPad

**Description:**

- Name: CORRESPONDENCES
- Subtitle: Brief tagline (30 characters)
- Description: Full app description (up to 4,000 characters)
- Keywords: Comma-separated keywords (100 characters max)
- Support URL: Your support website
- Marketing URL: (Optional) Your marketing website

**App Icon:**

- 1024x1024 PNG (no transparency, no rounded corners)
- Already configured in `app.json`

**Version Information:**

- Version: 1.0.0 (matches `app.json`)
- Copyright: © 2024 Your Name

### 6.2 Age Rating

1. Click "Age Rating"
2. Answer the questionnaire honestly
3. This app likely needs: 4+ (no objectionable content)

### 6.3 App Review Information

Fill in:

- **Contact Information**: Your contact details
- **Phone Number**: For App Review team
- **Demo Account**: (If your app requires login)
- **Notes**: Any special instructions for reviewers

## Step 7: Submit for App Store Review

### 7.1 Select Build

1. Go to "App Store" tab → "1.0 Prepare for Submission"
2. Under "Build", click "+" and select your TestFlight build
3. Ensure "Automatically release this version" is unchecked (for first submission)

### 7.2 Complete All Required Fields

Ensure all sections have green checkmarks:

- ✅ App Information
- ✅ Pricing and Availability
- ✅ Version Information
- ✅ App Store Preview
- ✅ Build
- ✅ App Privacy

### 7.3 Submit for Review

1. Click "Add for Review"
2. Review all information
3. Click "Submit for Review"
4. You'll receive email confirmation

### 7.4 Review Process

- **Initial Review**: 24-48 hours typically
- **Status Updates**: Check App Store Connect or email notifications
- **Possible Outcomes**:
  - ✅ Approved: App goes live
  - ⚠️ In Review: Additional questions
  - ❌ Rejected: Fix issues and resubmit

## Step 8: Post-Submission

### 8.1 Monitor Status

Check App Store Connect regularly for:

- Review status updates
- Any questions from Apple
- Approval notification

### 8.2 If Rejected

1. Read rejection reasons carefully
2. Fix issues in your app
3. Create new build: `eas build --platform ios --profile production`
4. Submit new build to TestFlight
5. Resubmit for review with explanation

### 8.3 After Approval

1. App goes live automatically (if you selected auto-release)
2. Or manually release from App Store Connect
3. Monitor reviews and ratings
4. Plan updates and new versions

## Troubleshooting

### Build Fails

- Check EAS build logs: `eas build:view [build-id]`
- Verify all dependencies are compatible
- Ensure `app.json` is valid JSON

### Submission Fails

- Verify Apple ID, Team ID, and App ID are correct
- Check that build is processed in TestFlight
- Ensure you have proper permissions in App Store Connect

### App Rejected

Common reasons:

- Missing privacy policy
- Incomplete app description
- Missing required permissions descriptions
- App crashes during review
- Violates App Store guidelines

## Useful Commands

```bash
# Login to EAS
eas login

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Submit to App Store
eas submit --platform ios

# Check submission status
eas submit:list
```

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## Checklist Before Submission

- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] `eas.json` updated with correct credentials
- [ ] API URL configured correctly
- [ ] App icon and splash screen ready
- [ ] Privacy policy URL ready
- [ ] All permission descriptions complete
- [ ] Screenshots prepared (all required sizes)
- [ ] App description written
- [ ] TestFlight build successful
- [ ] App tested thoroughly
- [ ] All App Store Connect fields completed
- [ ] Ready to submit for review

Good luck with your submission! 🚀
