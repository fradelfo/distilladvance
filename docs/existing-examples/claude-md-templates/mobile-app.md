# [Project Name] - Mobile Application

A cross-platform mobile application built with modern mobile development technologies, designed for excellent user experience across iOS and Android platforms.

## Project Overview

This project delivers a high-performance, native-feeling mobile application with comprehensive features including offline capabilities, push notifications, and seamless device integration. Built with accessibility, performance, and platform consistency as core principles.

**Primary Goals:**
- Deliver native-quality user experience on both iOS and Android
- Maintain consistent design language across platforms
- Ensure optimal performance and battery efficiency
- Provide robust offline functionality and data synchronization

## Tech Stack

### Mobile Framework
- **Framework**: React Native 0.72+ / Flutter 3.10+ / Ionic 7+
- **Language**: TypeScript / Dart / JavaScript
- **State Management**: Redux Toolkit / Provider / Zustand
- **Navigation**: React Navigation / Auto Route / Ionic Router

### Native Integration
- **Platform APIs**: Platform-specific native modules and bridges
- **Device Features**: Camera, location, biometrics, notifications
- **File System**: Secure storage for user data and app state
- **Background Processing**: Background tasks and scheduled jobs

### Backend Integration
- **API Client**: Axios / Dio / HTTP client with retry logic
- **Real-time**: WebSocket / Socket.io / Firebase for live updates
- **Offline Support**: SQLite / Realm / Hive for local data storage
- **Synchronization**: Conflict resolution and data sync strategies

### Development & Testing
- **Development Tools**: Metro / Hot Reload / Flutter DevTools
- **Testing**: Jest + React Native Testing Library / Flutter Test / Detox
- **Code Quality**: ESLint / Dart Analysis / Prettier
- **Debugging**: Flipper / React Native Debugger / Flutter Inspector

### Deployment & Distribution
- **Build Tools**: Fastlane for automated builds and deployment
- **CI/CD**: GitHub Actions / Bitrise / Codemagic
- **App Stores**: iOS App Store and Google Play Store
- **Code Push**: Over-the-air updates for JavaScript/Dart code

## Project Structure

### React Native Structure
```
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Platform-agnostic components
│   │   ├── ios/          # iOS-specific components
│   │   └── android/      # Android-specific components
│   ├── screens/          # Screen components and navigation
│   ├── navigation/       # Navigation configuration and routes
│   ├── services/         # API calls and business logic
│   ├── store/            # State management (Redux/Context)
│   ├── utils/            # Helper functions and utilities
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Images, fonts, and static resources
├── android/              # Android-specific native code
├── ios/                  # iOS-specific native code
├── __tests__/            # Test files and test utilities
├── docs/                 # Development and API documentation
└── scripts/              # Build and deployment scripts
```

### Flutter Structure
```
├── lib/
│   ├── main.dart         # Application entry point
│   ├── app/              # App configuration and routing
│   ├── features/         # Feature-based architecture
│   │   └── feature_name/
│   │       ├── data/     # Data sources and repositories
│   │       ├── domain/   # Business logic and entities
│   │       └── presentation/ # UI and state management
│   ├── core/             # Core utilities and base classes
│   ├── shared/           # Shared widgets and utilities
│   └── generated/        # Generated code (translations, etc.)
├── android/              # Android-specific configuration
├── ios/                  # iOS-specific configuration
├── test/                 # Test files
├── integration_test/     # Integration and E2E tests
└── assets/               # Images, fonts, and resources
```

## Development Guidelines

### Mobile Design Principles
- **Platform Consistency**: Follow iOS Human Interface Guidelines and Material Design
- **Touch Targets**: Minimum 44pt (iOS) / 48dp (Android) touch targets
- **Performance**: 60fps target for animations and scrolling
- **Accessibility**: VoiceOver/TalkBack support and proper contrast ratios
- **Responsive Design**: Adapt to different screen sizes and orientations

### Code Quality Standards
- **Type Safety**: Full TypeScript/Dart type coverage
- **Component Architecture**: Reusable, composable component design
- **Performance Optimization**: Lazy loading, memo optimization, efficient rendering
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Testing**: Unit, integration, and E2E test coverage

### Platform-Specific Considerations
- **iOS Guidelines**: Follow Apple's design principles and App Store requirements
- **Android Guidelines**: Adhere to Material Design and Google Play policies
- **Performance**: Platform-specific optimizations and memory management
- **Native Features**: Proper integration with platform-specific APIs
- **Security**: Secure storage, certificate pinning, and data protection

### State Management Patterns
- **Immutable State**: Use immutable updates and avoid state mutation
- **Single Source of Truth**: Centralized state management with clear data flow
- **Offline-First**: Design state to work seamlessly offline
- **Error States**: Comprehensive loading, error, and success state handling

## Key Commands

### Development Commands
```bash
# React Native
npm start                    # Start Metro bundler
npm run ios                  # Run on iOS simulator
npm run android             # Run on Android emulator
npm run ios -- --device     # Run on physical iOS device
npm run android -- --variant=release  # Run release build on Android

# Flutter
flutter run                 # Run on connected device
flutter run -d ios          # Run on iOS simulator
flutter run -d android      # Run on Android emulator
flutter run --release       # Run release build
flutter hot-reload          # Hot reload changes
```

### Testing Commands
```bash
# React Native
npm test                    # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run e2e:ios            # Run E2E tests on iOS
npm run e2e:android        # Run E2E tests on Android

# Flutter
flutter test               # Run unit and widget tests
flutter test --coverage   # Run tests with coverage
flutter drive              # Run integration tests
flutter test integration_test/  # Run integration tests
```

### Build Commands
```bash
# React Native
npm run build:ios          # Build iOS app
npm run build:android      # Build Android APK
cd ios && fastlane beta    # Deploy iOS beta via TestFlight
cd android && fastlane beta  # Deploy Android beta

# Flutter
flutter build ios         # Build iOS app
flutter build apk          # Build Android APK
flutter build appbundle   # Build Android App Bundle
flutter build ipa          # Build iOS IPA for distribution
```

### Code Quality
```bash
npm run lint               # Run ESLint / dart analyze
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format code with Prettier / dart format
npm run type-check         # TypeScript type checking
```

## Mobile-Specific Features

### Authentication & Security
```typescript
// React Native with Keychain/Keystore
import * as Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';

class AuthService {
  async storeBiometricCredentials(username: string, password: string): Promise<void> {
    await Keychain.setInternetCredentials(
      'myapp',
      username,
      password,
      { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET }
    );
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials('myapp');
      if (credentials) {
        const biometryType = await TouchID.isSupported();
        await TouchID.authenticate('Authenticate to access your account');
        return true;
      }
    } catch (error) {
      console.log('Biometric authentication failed', error);
    }
    return false;
  }
}
```

### Offline Data Management
```typescript
// SQLite with React Native
import SQLite from 'react-native-sqlite-storage';

class OfflineStorage {
  private db: SQLite.SQLiteDatabase;

  async initializeDatabase(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: 'app.db',
      location: 'default',
    });

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  }

  async addToSyncQueue(action: string, data: any): Promise<void> {
    await this.db.executeSql(
      'INSERT INTO sync_queue (action, data, timestamp) VALUES (?, ?, ?)',
      [action, JSON.stringify(data), Date.now()]
    );
  }

  async syncPendingChanges(): Promise<void> {
    const [results] = await this.db.executeSql(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY timestamp ASC'
    );

    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      try {
        await this.apiService.performAction(item.action, JSON.parse(item.data));
        await this.markAsSynced(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
      }
    }
  }
}
```

### Push Notifications
```typescript
// React Native Firebase Messaging
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

class NotificationService {
  async initialize(): Promise<string> {
    // Request permission for iOS
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    }
    throw new Error('Push notification permission denied');
  }

  setupNotificationHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      PushNotification.localNotification({
        title: remoteMessage.notification?.title,
        message: remoteMessage.notification?.body || '',
        playSound: true,
        soundName: 'default',
      });
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle notification tap when app is in background/quit state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage.data);
      this.handleNotificationNavigation(remoteMessage.data);
    });
  }

  private handleNotificationNavigation(data: any): void {
    // Navigate to specific screen based on notification data
    if (data.screen) {
      // Use your navigation service to navigate
      NavigationService.navigate(data.screen, data.params);
    }
  }
}
```

### Performance Optimization
```typescript
// React Native Performance Optimizations
import {memo, useMemo, useCallback} from 'react';
import {FlatList, VirtualizedList} from 'react-native';

// Memoized component for list items
const ListItem = memo(({item, onPress}: {item: any; onPress: (id: string) => void}) => {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.listItem}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
});

// Optimized list component
const OptimizedList: React.FC<{data: any[]}> = ({data}) => {
  const keyExtractor = useCallback((item: any) => item.id, []);

  const renderItem = useCallback(({item}: {item: any}) => (
    <ListItem item={item} onPress={handleItemPress} />
  ), []);

  const getItemLayout = useMemo(() => (
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    })
  ), []);

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={100}
      initialNumToRender={10}
      windowSize={21}
      removeClippedSubviews={true}
    />
  );
};
```

## Testing Strategy

### Unit Testing
```typescript
// React Native component testing
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {LoginScreen} from '../LoginScreen';

describe('LoginScreen', () => {
  it('should display validation errors for empty fields', () => {
    const {getByText, getByTestId} = render(<LoginScreen />);

    fireEvent.press(getByTestId('login-button'));

    expect(getByText('Email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('should call onLogin with correct credentials', () => {
    const mockOnLogin = jest.fn();
    const {getByTestId} = render(<LoginScreen onLogin={mockOnLogin} />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));

    expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

### Integration Testing
```typescript
// E2E testing with Detox
import {device, expect, element, by} from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete login flow successfully', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await expect(element(by.id('dashboard-screen'))).toBeVisible();
    await expect(element(by.text('Welcome back!'))).toBeVisible();
  });

  it('should handle offline functionality', async () => {
    await device.setURLBlacklist(['**/api/**']);

    await element(by.id('refresh-button')).tap();

    await expect(element(by.text('Offline mode'))).toBeVisible();
    await expect(element(by.id('cached-data-list'))).toBeVisible();
  });
});
```

## Platform-Specific Configurations

### iOS Configuration
```xml
<!-- ios/Info.plist -->
<dict>
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSExceptionDomains</key>
        <dict>
            <key>api.example.com</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <true/>
                <key>NSExceptionMinimumTLSVersion</key>
                <string>TLSv1.0</string>
            </dict>
        </dict>
    </dict>

    <!-- Camera and Location Permissions -->
    <key>NSCameraUsageDescription</key>
    <string>This app needs access to camera to take photos</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs location access to provide location-based features</string>

    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>background-processing</string>
        <string>background-fetch</string>
    </array>
</dict>
```

### Android Configuration
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <!-- Network Security Config -->
    <application
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="false">

        <!-- Deep Link Handling -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="myapp" />
            </intent-filter>
        </activity>

        <!-- Firebase Messaging Service -->
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

## Deployment & Distribution

### Fastlane Configuration
```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number
    gym(scheme: "MyApp")
    upload_to_testflight(skip_waiting_for_build_processing: true)
    slack(message: "iOS beta deployed successfully! 🚀")
  end

  desc "Deploy to App Store"
  lane :release do
    increment_version_number
    gym(scheme: "MyApp")
    upload_to_app_store(force: true)
    slack(message: "iOS app released to App Store! 🎉")
  end
end

platform :android do
  desc "Build and upload to Play Console"
  lane :beta do
    gradle(task: "clean assembleRelease")
    upload_to_play_store(track: "beta")
    slack(message: "Android beta deployed successfully! 🚀")
  end

  desc "Deploy to Play Store"
  lane :release do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(track: "production")
    slack(message: "Android app released to Play Store! 🎉")
  end
end
```

### CI/CD Pipeline
```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-ios:
    runs-on: macos-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Fastlane
        run: bundle install

      - name: Build and deploy iOS
        run: bundle exec fastlane ios beta
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}

  build-android:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Build and deploy Android
        run: bundle exec fastlane android beta
        env:
          GOOGLE_PLAY_JSON_KEY: ${{ secrets.GOOGLE_PLAY_JSON_KEY }}
```

## Security Considerations

### Data Protection
- **Secure Storage**: Use Keychain (iOS) and Keystore (Android) for sensitive data
- **Certificate Pinning**: Implement SSL certificate pinning for API calls
- **Code Obfuscation**: Obfuscate sensitive business logic in production builds
- **Biometric Authentication**: Integrate Face ID, Touch ID, and fingerprint authentication
- **Network Security**: Use TLS 1.2+ and implement proper network security configs

### Application Security
```typescript
// Certificate pinning implementation
import {NetworkingModule} from 'react-native';

class SecureApiClient {
  private certificatePins = {
    'api.example.com': [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    ]
  };

  async makeSecureRequest(url: string, options: RequestInit): Promise<Response> {
    // Verify certificate pinning
    const hostname = new URL(url).hostname;
    if (this.certificatePins[hostname]) {
      // Implement certificate validation logic
      await this.validateCertificate(hostname);
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-App-Version': this.getAppVersion(),
        'X-Device-ID': await this.getDeviceId(),
      }
    });
  }
}
```

## Development Workflow

### Feature Development
1. **Design Review**: Review designs for both iOS and Android platforms
2. **Component Development**: Create reusable, platform-aware components
3. **Integration**: Integrate with backend APIs and test offline functionality
4. **Testing**: Comprehensive testing on simulators and physical devices
5. **Performance Testing**: Monitor performance metrics and battery usage
6. **Platform Testing**: Test on various device sizes and OS versions

### Code Review Checklist
- [ ] Platform-specific design guidelines followed
- [ ] Accessibility features implemented (VoiceOver/TalkBack)
- [ ] Performance optimizations applied (FlatList, memoization)
- [ ] Error handling and loading states implemented
- [ ] Offline functionality working correctly
- [ ] Security considerations addressed
- [ ] Battery usage optimized

## Claude Code Integration Notes

When working with this mobile application, focus on:
- **Platform Consistency**: Ensure features work consistently across iOS and Android
- **Performance**: Always consider the impact on device performance and battery life
- **User Experience**: Prioritize smooth interactions and intuitive navigation
- **Offline Capability**: Design features to work gracefully without network connectivity
- **Security**: Implement proper security measures for mobile-specific vulnerabilities
- **Accessibility**: Ensure the app is accessible to users with disabilities

For mobile development, consider the unique constraints and opportunities of mobile platforms, including touch interfaces, device sensors, and platform-specific design patterns.