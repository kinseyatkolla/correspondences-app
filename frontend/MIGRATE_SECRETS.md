# Migrating from eas secret:_ to eas env:_

If you created secrets using the deprecated `eas secret:create` command, here's how to migrate them to the new `eas env:*` system.

## Step 1: Delete Old Secrets (Optional)

The deprecated `secret:delete` command uses different syntax. Run these commands interactively:

```bash
cd frontend

# Delete the old secrets (follow any prompts)
eas secret:delete EAS_APPLE_ID
eas secret:delete EAS_ASC_APP_ID
eas secret:delete EAS_APPLE_TEAM_ID
```

**Note:** If deletion fails or is complicated, you can skip this step. Creating new env variables with the same name should work fine, but having duplicates might cause confusion.

## Step 2: Recreate with New System

```bash
# Recreate using the new env:create command
# When prompted, select "production" environment and "string" type

eas env:create --scope project --name EAS_APPLE_ID --value "kinseyhamilton@me.com" --type string
eas env:create --scope project --name EAS_ASC_APP_ID --value "6756392610" --type string
eas env:create --scope project --name EAS_APPLE_TEAM_ID --value "QGX7CF64T7" --type string
```

When prompted:

1. **Select environment:** Choose `production` (use arrow keys and Enter to select)
2. **Select visibility:** Choose `Secret` (these are sensitive credentials)
3. **Select type:** Choose `string` (should be pre-selected if you used `--type string`)

## Step 3: Verify

```bash
eas env:list --scope project
```

Select "production" when prompted, and you should now see all three variables listed.

## Alternative: Test Without Migrating

If your secrets were created with `eas secret:create`, they should still work with the `${VARIABLE_NAME}` syntax in `eas.json` for now. You can test this by running:

```bash
eas submit --platform ios --profile production
```

If it works, you can migrate later. However, migrating now ensures future compatibility since the `secret:*` commands are deprecated.
