# Correspondences Mobile App

A React Native app with a Node.js/Express backend for managing correspondences.

## Project Structure

```
correspondences/
├── backend/                 # Node.js/Express API server
│   ├── server.js           # Main server file
│   ├── config.js           # Configuration
│   └── package.json        # Backend dependencies
└── frontend/               # React Native app
    ├── src/
    │   ├── screens/        # App screens
    │   ├── components/     # Reusable components
    │   ├── navigation/     # Navigation setup
    │   └── services/       # API services
    ├── App.tsx             # Main app component
    └── package.json        # Mobile app dependencies
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- MongoDB (for the backend database)

## Getting Started

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

The backend will run on `http://localhost:3000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start the Expo development server
npm start
```

### 3. Running the App

1. Install the Expo Go app on your phone from the App Store/Google Play
2. Scan the QR code that appears in your terminal
3. The app will load on your device

Alternatively, you can run on simulators:

- `npm run ios` - iOS Simulator
- `npm run android` - Android Emulator
- `npm run web` - Web browser

## Features

- **Loading Screen**: Animated loading screen on app startup
- **Bottom Tab Navigation**: 5 tabs for easy navigation
  - Home: Welcome screen
  - Messages: List of correspondences
  - Contacts: Contact management
  - Settings: App preferences
  - Profile: User profile and stats
- **API Integration**: Connected to backend for data management
- **Modern UI**: Clean, iOS-inspired design

## Backend API Endpoints

- `GET /` - Health check
- `GET /api/health` - API status
- `GET /api/correspondences` - Get all correspondences
- `POST /api/correspondences` - Create new correspondence

## Development Notes

- The app uses TypeScript for type safety
- React Navigation handles screen navigation
- API service provides a clean interface to the backend
- Error handling with fallback to sample data
- Responsive design that works on different screen sizes

## Next Steps

To extend this app, you could:

1. Add user authentication
2. Implement real-time notifications
3. Add search and filtering
4. Create detailed correspondence views
5. Add file attachments
6. Implement offline support
