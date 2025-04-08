
# Calouri Mobile App (Capacitor)

This document provides instructions for building and running the Calouri app as a native mobile application using Capacitor.

## Prerequisites

- Node.js and npm installed
- For iOS: macOS with Xcode installed
- For Android: Android Studio with SDK tools installed

## Getting Started

Follow these steps to build and run the mobile app:

1. Clone the repository and install dependencies:
   ```
   git clone <your-repo-url>
   cd <project-folder>
   npm install
   ```

2. Build the web app:
   ```
   npm run build
   ```

3. Copy the built web assets to the native projects:
   ```
   npx cap copy
   ```

## iOS Development

1. Add iOS platform if not already added:
   ```
   npx cap add ios
   ```

2. Update iOS native dependencies:
   ```
   npx cap update ios
   ```

3. Open the project in Xcode:
   ```
   npx cap open ios
   ```

4. In Xcode, select a development team in the Signing & Capabilities tab.

5. Build and run the app on a simulator or device.

## Android Development

1. Add Android platform if not already added:
   ```
   npx cap add android
   ```

2. Update Android native dependencies:
   ```
   npx cap update android
   ```

3. Open the project in Android Studio:
   ```
   npx cap open android
   ```

4. Build and run the app on an emulator or device.

## Development Workflow

When making changes to the web app:

1. Make your code changes
2. Rebuild the web app: `npm run build`
3. Update native projects: `npx cap copy`
4. (Optional) If you've added plugins: `npx cap sync`
5. Open and run in the native IDE: `npx cap open ios` or `npx cap open android`

## Custom Configuration

The app is configured in `capacitor.config.ts`. You can modify settings like:
- App ID and name
- Server URL for live development
- Platform-specific settings

## Troubleshooting

- If you encounter build errors in iOS, check that your development team is properly set in Xcode.
- For Android, ensure you have the correct SDK tools installed and updated.
- For issues with plugins, try running `npx cap sync` to ensure all plugins are properly installed in the native projects.
