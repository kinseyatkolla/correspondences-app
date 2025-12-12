# EAS Secrets Setup Guide

This guide explains how to securely configure Apple Developer credentials for EAS Submit using environment variables/secrets instead of hardcoding them in `eas.json`.

## Why Use Secrets?

Storing credentials in `eas.json` (which is typically committed to git) exposes sensitive information like:

- Apple ID email
- App Store Connect App ID
- Apple Team ID

Using EAS Secrets keeps these credentials secure and prevents them from being exposed in version control.

## Setup Instructions

### Step 1: Set EAS Environment Variables

**Note:** The `eas secret:create` command is deprecated. Use `eas env:create` instead.

Run these commands in the `frontend` directory to set your Apple Developer credentials as EAS environment variables. For each command, follow these prompts:

```bash
cd frontend

# Set your Apple ID (email)
eas env:create --scope project --name EAS_APPLE_ID --value "your-apple-id@example.com" --type string

# Set your App Store Connect App ID (numeric ID, but stored as string)
eas env:create --scope project --name EAS_ASC_APP_ID --value "1234567890" --type string

# Set your Apple Team ID (10-character ID)
eas env:create --scope project --name EAS_APPLE_TEAM_ID --value "ABC123DEF4" --type string
```

When prompted for each variable:

1. **Select environment:** Choose `production`
2. **Select visibility:** Choose `Secret` (these are sensitive credentials)
3. **Select type:** Choose `string` (should be pre-selected if you used `--type string`)

**Important:** All three should be stored as **string** type with **Secret** visibility:

- `EAS_APPLE_ID`: Email address (string)
- `EAS_ASC_APP_ID`: Numeric ID stored as string (e.g., "6756392610")
- `EAS_APPLE_TEAM_ID`: 10-character Team ID (string)

**Note:** Replace the placeholder values with your actual credentials.

### Step 2: Verify Environment Variables Are Set

List all project environment variables to verify they were created:

```bash
eas env:list --scope project
```

**Note:** If you used the deprecated `eas secret:create` command, use `eas secret:list --scope project` instead to verify. However, you should migrate to the new system using `eas env:create` for future compatibility.

You should see:

- `EAS_APPLE_ID`
- `EAS_ASC_APP_ID`
- `EAS_APPLE_TEAM_ID`

### Step 3: How It Works

The `eas.json` file now references these secrets using environment variable syntax:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "${EAS_APPLE_ID}",
        "ascAppId": "${EAS_ASC_APP_ID}",
        "appleTeamId": "${EAS_APPLE_TEAM_ID}"
      }
    }
  }
}
```

When you run `eas submit`, EAS will automatically resolve these environment variables from the stored secrets.

## Finding Your Credentials

### Apple ID

- The email address you use to log into developer.apple.com
- Example: `your-email@example.com`

### App Store Connect App ID

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to "App Information"
4. Find the numeric "Apple ID" (like `1234567890`)

### Apple Team ID

1. Go to https://developer.apple.com/account
2. Click "Membership"
3. Find your "Team ID" (10-character string like `ABC123DEF4`)

## Updating Environment Variables

If you need to update an environment variable:

```bash
# Update an existing variable
eas env:update --scope project --name EAS_APPLE_ID --value "new-value@example.com"
```

## Removing Environment Variables

If you need to remove an environment variable:

```bash
eas env:delete --scope project --name EAS_APPLE_ID
```

## Security Notes

- ✅ Secrets are stored securely on Expo's servers
- ✅ Secrets are encrypted and only accessible to your EAS account
- ✅ The actual credential values never appear in your git repository
- ✅ Each team member can set their own secrets if needed

## Troubleshooting

**Error: "Environment variable not found"**

- Make sure you've created the variables using `eas env:create`
- Verify the variable names match exactly: `EAS_APPLE_ID`, `EAS_ASC_APP_ID`, `EAS_APPLE_TEAM_ID`
- Check that you're using `--scope project` (not `--scope account`)
- Ensure all variables are stored as "string" type

**Error: "Authentication failed"**

- Verify your Apple ID, App ID, and Team ID are correct
- Check that your Apple Developer account is active and paid
- Ensure you have the necessary permissions in App Store Connect

## Alternative: Local Environment Variables

If you prefer to use local environment variables instead of EAS Secrets, you can:

1. Create a `.env` file in the `frontend` directory (make sure it's in `.gitignore`)
2. Set the variables:
   ```
   EAS_APPLE_ID=your-apple-id@example.com
   EAS_ASC_APP_ID=1234567890
   EAS_APPLE_TEAM_ID=ABC123DEF4
   ```
3. Load them before running EAS commands:
   ```bash
   export $(cat .env | xargs)
   eas submit --platform ios
   ```

However, **EAS Environment Variables (via `eas env:create`) is the recommended approach** as it's more secure and works across different machines/environments without managing local `.env` files.
