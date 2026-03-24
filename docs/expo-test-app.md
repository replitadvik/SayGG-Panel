# Expo Test App

## Overview

The `expo-test-app/` directory contains a React Native (Expo) application for testing the Key-Panel `/connect` endpoint from a mobile device. It provides a visual interface to send test requests and inspect the full response.

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for building APKs (`npm install -g eas-cli`)
- Expo Go app on your phone (for development)

### Install Dependencies

```bash
cd expo-test-app
npm install
```

### Run in Development

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Building an APK

```bash
npx eas build --platform android --profile preview
```

This produces a standalone APK that can be installed on any Android device. The `eas.json` is pre-configured with a `preview` profile for APK builds and a `production` profile for app-bundle builds.

## Usage

1. **Enter your license key** in the "Key" field
2. **Set the game name** (defaults to "PUBG")
3. Tap **Test Connect** to send the request
4. View the response card showing:
   - Connection status (success/failure)
   - Game info and display name
   - Key status and duration
   - Time remaining
   - Device usage (used/max)
   - All feature flags with on/off badges
   - Token info

### Settings

Tap "Show Settings" to configure:
- **Endpoint URL**: Point to your Key-Panel server
- **Device Serial**: Auto-generated unique identifier; can be regenerated

## App Structure

```
expo-test-app/
├── app.json          # Expo configuration
├── eas.json          # EAS Build profiles
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
└── src/
    └── App.tsx       # Main app component
```

## Customization

- Change `DEFAULT_ENDPOINT` in `src/App.tsx` to your server URL
- Change `DEFAULT_GAME` to your default game name
- The serial format is `expo-` + 16 random chars
