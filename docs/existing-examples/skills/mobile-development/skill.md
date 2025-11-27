# Mobile Development Skill

Modern mobile app development expertise covering iOS, Android, cross-platform frameworks, and mobile-specific optimization techniques.

## Skill Overview

Comprehensive mobile development knowledge including native iOS/Android development, React Native, Flutter, mobile UI/UX patterns, performance optimization, app store deployment, and mobile DevOps.

## Core Capabilities

### Native iOS Development
- **SwiftUI & UIKit** - Modern declarative UI and traditional imperative frameworks
- **Core frameworks** - Core Data, CloudKit, HealthKit, ARKit integration
- **iOS architecture** - MVVM, VIPER, Clean Architecture patterns
- **App Store optimization** - ASO, review management, TestFlight distribution

### Native Android Development
- **Jetpack Compose** - Modern declarative UI with Material Design 3
- **Android architecture** - MVVM with LiveData, Data Binding, Navigation
- **Modern Android** - Kotlin coroutines, Room, WorkManager, CameraX
- **Play Store optimization** - Google Play Console, app bundles, dynamic features

### Cross-Platform Development
- **React Native** - JavaScript/TypeScript mobile development
- **Flutter** - Dart-based UI framework with native performance
- **Ionic** - Web-based mobile apps with native capabilities
- **Xamarin** - C#-based cross-platform development

### Mobile-Specific Optimization
- **Performance tuning** - Memory optimization, battery usage, startup time
- **Offline functionality** - Local storage, sync strategies, conflict resolution
- **Security patterns** - Biometric auth, secure storage, certificate pinning
- **Push notifications** - FCM, APNs, notification strategies

## Modern Mobile Development Stack

### SwiftUI & iOS Development
```swift
// Modern SwiftUI app with advanced patterns
import SwiftUI
import Combine
import CoreData

// MVVM Architecture with ObservableObject
class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiService: APIService
    private let persistenceController: PersistenceController
    private var cancellables = Set<AnyCancellable>()

    init(apiService: APIService = .shared,
         persistenceController: PersistenceController = .shared) {
        self.apiService = apiService
        self.persistenceController = persistenceController
        loadUsers()
    }

    func loadUsers() {
        isLoading = true
        errorMessage = nil

        // Load from local storage first
        loadUsersFromCoreData()

        // Then fetch from API
        apiService.fetchUsers()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] users in
                    self?.users = users
                    self?.saveUsersToCoreData(users)
                }
            )
            .store(in: &cancellables)
    }

    private func loadUsersFromCoreData() {
        let context = persistenceController.container.viewContext
        let request: NSFetchRequest<UserEntity> = UserEntity.fetchRequest()

        do {
            let userEntities = try context.fetch(request)
            users = userEntities.map { User(from: $0) }
        } catch {
            print("Error loading users from Core Data: \(error)")
        }
    }

    private func saveUsersToCoreData(_ users: [User]) {
        let context = persistenceController.container.viewContext

        // Clear existing data
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: UserEntity.fetchRequest())
        try? context.execute(deleteRequest)

        // Save new data
        users.forEach { user in
            let entity = UserEntity(context: context)
            entity.update(from: user)
        }

        try? context.save()
    }
}

// Modern SwiftUI Views with advanced features
struct ContentView: View {
    @StateObject private var userViewModel = UserViewModel()
    @State private var searchText = ""
    @State private var selectedUser: User?
    @State private var showingProfile = false

    var filteredUsers: [User] {
        if searchText.isEmpty {
            return userViewModel.users
        }
        return userViewModel.users.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.email.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                // Main content
                List(filteredUsers) { user in
                    UserRowView(user: user)
                        .onTapGesture {
                            selectedUser = user
                            showingProfile = true
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button("Message", systemImage: "message") {
                                // Handle message action
                            }
                            .tint(.blue)

                            Button("Call", systemImage: "phone") {
                                // Handle call action
                            }
                            .tint(.green)
                        }
                }
                .searchable(text: $searchText, prompt: "Search users...")
                .refreshable {
                    await refreshUsers()
                }

                // Loading state
                if userViewModel.isLoading && userViewModel.users.isEmpty {
                    ProgressView("Loading users...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemBackground))
                }

                // Error state
                if let errorMessage = userViewModel.errorMessage {
                    VStack {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)

                        Text("Error loading users")
                            .font(.headline)

                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Button("Retry") {
                            userViewModel.loadUsers()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemBackground))
                }
            }
            .navigationTitle("Users")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add", systemImage: "plus") {
                        // Handle add user
                    }
                }
            }
        }
        .sheet(isPresented: $showingProfile) {
            if let user = selectedUser {
                UserProfileView(user: user)
            }
        }
        .onAppear {
            setupNotifications()
        }
    }

    private func refreshUsers() async {
        await withCheckedContinuation { continuation in
            userViewModel.loadUsers()
            // Simple completion after delay (in real app, listen to loading state)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                continuation.resume()
            }
        }
    }

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { _ in
            userViewModel.loadUsers()
        }
    }
}

struct UserRowView: View {
    let user: User

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: user.avatarURL)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Circle()
                    .fill(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundColor(.secondary)
                    )
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(user.name)
                    .font(.headline)

                Text(user.email)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if user.isOnline {
                    HStack {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)

                        Text("Online")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }

            Spacer()

            VStack(spacing: 4) {
                Text(user.lastSeen, style: .relative)
                    .font(.caption2)
                    .foregroundColor(.secondary)

                if user.unreadMessages > 0 {
                    Text("\(user.unreadMessages)")
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.red)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// Advanced networking with Combine
class APIService: ObservableObject {
    static let shared = APIService()

    private let baseURL = "https://api.example.com"
    private let urlSession = URLSession.shared

    func fetchUsers() -> AnyPublisher<[User], Error> {
        guard let url = URL(string: "\(baseURL)/users") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        return urlSession.dataTaskPublisher(for: url)
            .map(\.data)
            .decode(type: UserResponse.self, decoder: JSONDecoder())
            .map(\.users)
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func updateUser(_ user: User) -> AnyPublisher<User, Error> {
        guard let url = URL(string: "\(baseURL)/users/\(user.id)") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONEncoder().encode(user)
        } catch {
            return Fail(error: error)
                .eraseToAnyPublisher()
        }

        return urlSession.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: User.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}

// Core Data stack
class PersistenceController: ObservableObject {
    static let shared = PersistenceController()

    lazy var container: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "DataModel")

        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                fatalError("Core Data error: \(error), \(error.userInfo)")
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        return container
    }()

    func save() {
        let context = container.viewContext

        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                fatalError("Core Data save error: \(nsError), \(nsError.userInfo)")
            }
        }
    }
}
```

### Flutter Cross-Platform Development
```dart
// Modern Flutter app with advanced state management
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

// Data Models
@HiveType(typeId: 0)
class User extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String email;

  @HiveField(3)
  final String? avatarUrl;

  @HiveField(4)
  final bool isOnline;

  @HiveField(5)
  final DateTime lastSeen;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    required this.isOnline,
    required this.lastSeen,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      avatarUrl: json['avatar_url'] as String?,
      isOnline: json['is_online'] as bool,
      lastSeen: DateTime.parse(json['last_seen'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatar_url': avatarUrl,
      'is_online': isOnline,
      'last_seen': lastSeen.toIso8601String(),
    };
  }
}

// API Service
class ApiService {
  final Dio _dio = Dio();
  static const String baseUrl = 'https://api.example.com';

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add auth token
          options.headers['Authorization'] = 'Bearer ${_getAuthToken()}';
          handler.next(options);
        },
        onError: (error, handler) {
          // Handle errors globally
          _handleApiError(error);
          handler.next(error);
        },
      ),
    );
  }

  Future<List<User>> getUsers() async {
    try {
      final response = await _dio.get('/users');
      final List<dynamic> data = response.data['users'];
      return data.map((json) => User.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load users: $e');
    }
  }

  Future<User> updateUser(User user) async {
    try {
      final response = await _dio.put('/users/${user.id}', data: user.toJson());
      return User.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update user: $e');
    }
  }

  String _getAuthToken() {
    // Get token from secure storage
    return 'your_auth_token_here';
  }

  void _handleApiError(DioException error) {
    // Handle API errors
    switch (error.response?.statusCode) {
      case 401:
        // Handle unauthorized
        break;
      case 404:
        // Handle not found
        break;
      default:
        // Handle other errors
        break;
    }
  }
}

// Repository with offline support
class UserRepository {
  final ApiService _apiService = ApiService();
  late Box<User> _userBox;

  Future<void> init() async {
    await Hive.initFlutter();
    Hive.registerAdapter(UserAdapter());
    _userBox = await Hive.openBox<User>('users');
  }

  Future<List<User>> getUsers() async {
    try {
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();

      if (connectivityResult != ConnectivityResult.none) {
        // Online: fetch from API and cache
        final users = await _apiService.getUsers();
        await _cacheUsers(users);
        return users;
      } else {
        // Offline: return cached data
        return _getCachedUsers();
      }
    } catch (e) {
      // Fallback to cached data on error
      return _getCachedUsers();
    }
  }

  Future<User> updateUser(User user) async {
    try {
      final updatedUser = await _apiService.updateUser(user);
      await _userBox.put(user.id, updatedUser);
      return updatedUser;
    } catch (e) {
      // Queue for later sync
      await _queueForSync(user);
      rethrow;
    }
  }

  List<User> _getCachedUsers() {
    return _userBox.values.toList();
  }

  Future<void> _cacheUsers(List<User> users) async {
    await _userBox.clear();
    for (final user in users) {
      await _userBox.put(user.id, user);
    }
  }

  Future<void> _queueForSync(User user) async {
    // Queue changes for later sync when online
    final syncBox = await Hive.openBox('sync_queue');
    await syncBox.add({
      'type': 'update_user',
      'data': user.toJson(),
      'timestamp': DateTime.now().toIso8601String(),
    });
  }
}

// State Management with Riverpod
final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository();
});

final usersProvider = FutureProvider<List<User>>((ref) async {
  final repository = ref.read(userRepositoryProvider);
  return await repository.getUsers();
});

final selectedUserProvider = StateProvider<User?>((ref) => null);

final searchQueryProvider = StateProvider<String>((ref) => '');

final filteredUsersProvider = Provider<AsyncValue<List<User>>>((ref) {
  final usersAsync = ref.watch(usersProvider);
  final searchQuery = ref.watch(searchQueryProvider);

  return usersAsync.when(
    data: (users) {
      if (searchQuery.isEmpty) {
        return AsyncValue.data(users);
      }
      final filtered = users.where((user) =>
        user.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().contains(searchQuery.toLowerCase())
      ).toList();
      return AsyncValue.data(filtered);
    },
    loading: () => const AsyncValue.loading(),
    error: (error, stackTrace) => AsyncValue.error(error, stackTrace),
  );
});

// Modern Flutter UI
class UserListScreen extends ConsumerWidget {
  const UserListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filteredUsers = ref.watch(filteredUsersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _addUser(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search users...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) {
                ref.read(searchQueryProvider.notifier).state = value;
              },
            ),
          ),

          // User list
          Expanded(
            child: filteredUsers.when(
              data: (users) => RefreshIndicator(
                onRefresh: () => ref.refresh(usersProvider.future),
                child: ListView.builder(
                  itemCount: users.length,
                  itemBuilder: (context, index) {
                    final user = users[index];
                    return UserTile(user: user);
                  },
                ),
              ),
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stackTrace) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading users',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error.toString(),
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => ref.refresh(usersProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _addUser(BuildContext context) {
    // Navigate to add user screen
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const AddUserScreen(),
      ),
    );
  }
}

class UserTile extends ConsumerWidget {
  final User user;

  const UserTile({Key? key, required this.user}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: user.avatarUrl != null
            ? NetworkImage(user.avatarUrl!)
            : null,
          child: user.avatarUrl == null
            ? Text(user.name[0].toUpperCase())
            : null,
        ),
        title: Text(user.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user.email),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: user.isOnline ? Colors.green : Colors.grey,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  user.isOnline ? 'Online' : 'Last seen ${_formatLastSeen(user.lastSeen)}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _handleMenuAction(context, ref, value),
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'message',
              child: Text('Message'),
            ),
            const PopupMenuItem(
              value: 'call',
              child: Text('Call'),
            ),
            const PopupMenuItem(
              value: 'edit',
              child: Text('Edit'),
            ),
          ],
        ),
        onTap: () {
          ref.read(selectedUserProvider.notifier).state = user;
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => UserDetailScreen(user: user),
            ),
          );
        },
      ),
    );
  }

  String _formatLastSeen(DateTime lastSeen) {
    final now = DateTime.now();
    final difference = now.difference(lastSeen);

    if (difference.inMinutes < 1) {
      return 'just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }

  void _handleMenuAction(BuildContext context, WidgetRef ref, String action) {
    switch (action) {
      case 'message':
        // Handle message action
        break;
      case 'call':
        // Handle call action
        break;
      case 'edit':
        // Handle edit action
        break;
    }
  }
}

// App initialization
class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      child: MaterialApp(
        title: 'Flutter Demo',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const UserListScreen(),
      ),
    );
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive
  final userRepository = UserRepository();
  await userRepository.init();

  runApp(const MyApp());
}
```

### React Native Modern Development
```typescript
// Modern React Native with TypeScript and advanced patterns
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-netinfo/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  unreadMessages: number;
}

type RootStackParamList = {
  UserList: undefined;
  UserDetail: { user: User };
  AddUser: undefined;
};

// API Service with offline support
class ApiService {
  private static readonly BASE_URL = 'https://api.example.com';
  private static readonly CACHE_PREFIX = 'cache_';

  static async get<T>(endpoint: string): Promise<T> {
    const cacheKey = `${this.CACHE_PREFIX}${endpoint}`;

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the response
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));

      return data;
    } catch (error) {
      // Try to return cached data on error
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.warn('Using cached data due to network error:', error);
        return data;
      }
      throw error;
    }
  }

  static async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  static async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    return token || '';
  }
}

// Custom hooks
const useUsers = () => {
  const netInfo = useNetInfo();

  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => ApiService.get<{ users: User[] }>('/users').then(res => res.users),
    enabled: netInfo.isConnected ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, User>({
    mutationFn: (user: User) => ApiService.put<User>(`/users/${user.id}`, user),
    onSuccess: (updatedUser) => {
      // Update the user in the cache
      queryClient.setQueryData<User[]>(['users'], (oldUsers) => {
        if (!oldUsers) return [];
        return oldUsers.map(user =>
          user.id === updatedUser.id ? updatedUser : user
        );
      });
    },
  });
};

// Components
const UserListScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: users, isLoading, error, refetch } = useUsers();
  const netInfo = useNetInfo();

  const filteredUsers = React.useMemo(() => {
    if (!users || !searchText) return users || [];

    return users.filter(user =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [users, searchText]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderUser = ({ item }: { item: User }) => (
    <UserListItem user={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchText ? 'No users found' : 'No users available'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Error loading users</Text>
      <Text style={styles.errorMessage}>{error?.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !users) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error && !users) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      {/* Connection status */}
      {!netInfo.isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>Offline - Showing cached data</Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const UserListItem: React.FC<{ user: User }> = ({ user }) => {
  const updateUserMutation = useUpdateUser();

  const handlePress = () => {
    // Navigate to user detail
    Alert.alert('User Selected', `Selected ${user.name}`);
  };

  const handleToggleOnline = () => {
    const updatedUser = { ...user, isOnline: !user.isOnline };
    updateUserMutation.mutate(updatedUser);
  };

  return (
    <TouchableOpacity style={styles.userItem} onPress={handlePress}>
      <FastImage
        style={styles.avatar}
        source={{
          uri: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=50`,
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: user.isOnline ? '#00FF00' : '#999' }]} />
          <Text style={styles.statusText}>
            {user.isOnline ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        {user.unreadMessages > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.unreadMessages}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleToggleOnline}
          disabled={updateUserMutation.isPending}
        >
          <Text style={styles.toggleButtonText}>Toggle</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Utility functions
const formatLastSeen = (lastSeen: string): string => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Navigation
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="UserList">
        <Stack.Screen
          name="UserList"
          component={UserListScreen}
          options={{ title: 'Users' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  offlineBar: {
    backgroundColor: '#ff9500',
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  },
  userActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default AppNavigator;
```

## Skill Activation Triggers

This skill automatically activates when:
- Mobile app development is requested
- Cross-platform mobile solutions are needed
- Native iOS or Android development is required
- Mobile UI/UX optimization is needed
- App store deployment assistance is requested
- Mobile performance optimization is required

## Advanced React Native Architecture

### Custom Native Modules
```typescript
// Native Module for advanced device features
// iOS Implementation (RNDeviceInfo.m)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNDeviceInfo : RCTEventEmitter <RCTBridgeModule>
@end

@implementation RNDeviceInfo

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getBatteryLevel:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIDevice.currentDevice.batteryMonitoringEnabled = YES;
  float batteryLevel = UIDevice.currentDevice.batteryLevel;

  if (batteryLevel < 0.0) {
    reject(@"battery_error", @"Unable to get battery level", nil);
  } else {
    resolve(@(batteryLevel * 100));
  }
}

RCT_EXPORT_METHOD(getDeviceTemperature:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // iOS thermal state monitoring
  NSProcessInfo *processInfo = [NSProcessInfo processInfo];
  NSProcessInfoThermalState thermalState = processInfo.thermalState;

  NSDictionary *result = @{
    @"thermalState": @(thermalState),
    @"temperature": @([self approximateTemperature:thermalState])
  };

  resolve(result);
}

- (double)approximateTemperature:(NSProcessInfoThermalState)state {
  switch (state) {
    case NSProcessInfoThermalStateNominal:
      return 25.0; // Approximate room temperature
    case NSProcessInfoThermalStateFair:
      return 35.0;
    case NSProcessInfoThermalStateSerious:
      return 45.0;
    case NSProcessInfoThermalStateCritical:
      return 55.0;
    default:
      return 25.0;
  }
}

// Support for event emission
- (NSArray<NSString *> *)supportedEvents {
  return @[@"BatteryLevelChanged", @"ThermalStateChanged"];
}

@end

// Android Implementation (RNDeviceInfoModule.java)
package com.yourapp.deviceinfo;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.content.Context;

public class RNDeviceInfoModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public RNDeviceInfoModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNDeviceInfo";
    }

    @ReactMethod
    public void getBatteryLevel(Promise promise) {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = reactContext.registerReceiver(null, ifilter);

            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

            float batteryPct = level * 100 / (float) scale;
            promise.resolve(batteryPct);
        } catch (Exception e) {
            promise.reject("battery_error", "Unable to get battery level", e);
        }
    }

    @ReactMethod
    public void getDeviceTemperature(Promise promise) {
        try {
            // Android doesn't provide direct temperature access
            // This is an approximation based on thermal state
            WritableMap result = Arguments.createMap();
            result.putString("thermalState", "normal");
            result.putDouble("temperature", 25.0);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("temperature_error", "Unable to get device temperature", e);
        }
    }
}

// TypeScript React Native implementation
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  getBatteryLevel(): Promise<number>;
  getDeviceTemperature(): Promise<{
    thermalState: string;
    temperature: number;
  }>;
}

const { RNDeviceInfo } = NativeModules as { RNDeviceInfo: DeviceInfo };
const deviceInfoEmitter = new NativeEventEmitter(RNDeviceInfo);

// Custom hook for device monitoring
export const useDeviceMonitoring = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [thermalState, setThermalState] = useState<{
    thermalState: string;
    temperature: number;
  } | null>(null);
  const [isLowBattery, setIsLowBattery] = useState(false);
  const [isOverheating, setIsOverheating] = useState(false);

  const updateBatteryLevel = useCallback(async () => {
    try {
      const level = await RNDeviceInfo.getBatteryLevel();
      setBatteryLevel(level);
      setIsLowBattery(level < 20);
    } catch (error) {
      console.error('Failed to get battery level:', error);
    }
  }, []);

  const updateThermalState = useCallback(async () => {
    try {
      const thermal = await RNDeviceInfo.getDeviceTemperature();
      setThermalState(thermal);
      setIsOverheating(thermal.temperature > 40);
    } catch (error) {
      console.error('Failed to get thermal state:', error);
    }
  }, []);

  useEffect(() => {
    // Initial readings
    updateBatteryLevel();
    updateThermalState();

    // Set up periodic monitoring
    const batteryInterval = setInterval(updateBatteryLevel, 30000); // 30 seconds
    const thermalInterval = setInterval(updateThermalState, 60000); // 1 minute

    // Set up event listeners
    const batterySubscription = deviceInfoEmitter.addListener(
      'BatteryLevelChanged',
      setBatteryLevel
    );

    const thermalSubscription = deviceInfoEmitter.addListener(
      'ThermalStateChanged',
      setThermalState
    );

    return () => {
      clearInterval(batteryInterval);
      clearInterval(thermalInterval);
      batterySubscription.remove();
      thermalSubscription.remove();
    };
  }, [updateBatteryLevel, updateThermalState]);

  return {
    batteryLevel,
    thermalState,
    isLowBattery,
    isOverheating,
    refreshBatteryLevel: updateBatteryLevel,
    refreshThermalState: updateThermalState,
  };
};
```

### Advanced Performance Optimization
```typescript
// Performance monitoring and optimization
import { InteractionManager, DeviceEventEmitter } from 'react-native';
import Flipper from 'react-native-flipper';

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorJSFrameRate();
    this.monitorMemoryUsage();
    this.monitorNavigationPerformance();
  }

  private monitorJSFrameRate() {
    let lastFrameTime = Date.now();
    let frameCount = 0;

    const measureFrame = () => {
      if (!this.isMonitoring) return;

      frameCount++;
      const now = Date.now();

      if (now - lastFrameTime >= 1000) {
        const fps = frameCount;
        this.metrics.set('fps', fps);

        // Log low FPS warnings
        if (fps < 50) {
          console.warn(`Low FPS detected: ${fps}`);
          Flipper.log(`Performance Warning: FPS dropped to ${fps}`);
        }

        frameCount = 0;
        lastFrameTime = now;
      }

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private monitorMemoryUsage() {
    const checkMemory = () => {
      if (!this.isMonitoring) return;

      // Check if memory info is available (Android)
      if (global.nativePerformanceNow) {
        const memoryInfo = (global as any).performance?.memory;
        if (memoryInfo) {
          const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
          const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;

          this.metrics.set('memoryUsed', usedMB);
          this.metrics.set('memoryTotal', totalMB);

          // Warn if memory usage is high
          if (usedMB / totalMB > 0.8) {
            console.warn(`High memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);
          }
        }
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  private monitorNavigationPerformance() {
    // Monitor navigation timing
    DeviceEventEmitter.addListener('NavigationStart', (routeName: string) => {
      this.metrics.set(`nav_start_${routeName}`, Date.now());
    });

    DeviceEventEmitter.addListener('NavigationEnd', (routeName: string) => {
      const startTime = this.metrics.get(`nav_start_${routeName}`);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.metrics.set(`nav_duration_${routeName}`, duration);

        if (duration > 1000) {
          console.warn(`Slow navigation to ${routeName}: ${duration}ms`);
        }
      }
    });
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }
}

// Performance-optimized component patterns
import React, { memo, useMemo, useCallback } from 'react';
import { VirtualizedList, ListRenderItem } from 'react-native';

interface OptimizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

export const OptimizedVirtualizedList = memo(<T,>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
}: OptimizedListProps<T>) => {
  const getItem = useCallback((data: T[], index: number) => data[index], []);
  const getItemCount = useCallback((data: T[]) => data.length, []);

  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem({ item, index, separators: {} as any });
    },
    [renderItem]
  );

  return (
    <VirtualizedList
      data={data}
      getItem={getItem}
      getItemCount={getItemCount}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
});

// Advanced image optimization
interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  onError,
}) => {
  const optimizedSource = useMemo(() => {
    const { uri } = source;

    // Add image optimization parameters
    const separator = uri.includes('?') ? '&' : '?';
    const optimizedUri = `${uri}${separator}auto=format&fit=crop&w=400&q=80`;

    return { uri: optimizedUri };
  }, [source]);

  return (
    <FastImage
      source={optimizedSource}
      style={style}
      resizeMode={FastImage.resizeMode[resizeMode]}
      placeholder={placeholder}
      onLoad={onLoad}
      onError={onError}
    />
  );
});
```

### Push Notifications and Background Tasks
```typescript
// Advanced push notification implementation
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import BackgroundJob from 'react-native-background-job';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionButtons?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notification permission denied');
      return;
    }

    // Get FCM token
    const token = await messaging().getToken();
    await AsyncStorage.setItem('fcm_token', token);
    console.log('FCM Token:', token);

    // Set up listeners
    this.setupMessageHandlers();
    this.setupBackgroundMessageHandler();

    // Create notification channels for Android
    await this.createNotificationChannels();
  }

  private async setupMessageHandlers() {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle notification opened from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // Handle notification opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });
  }

  private setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);

      // Process background message
      await this.processBackgroundMessage(remoteMessage);

      // Display notification
      await this.displayNotification(remoteMessage);
    });
  }

  private async createNotificationChannels() {
    // High priority channel for urgent notifications
    await notifee.createChannel({
      id: 'urgent',
      name: 'Urgent Notifications',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'urgent_notification',
      vibration: true,
    });

    // Default channel for regular notifications
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Silent channel for background updates
    await notifee.createChannel({
      id: 'silent',
      name: 'Background Updates',
      importance: AndroidImportance.LOW,
      sound: null,
    });
  }

  private async displayNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const { notification, data } = remoteMessage;

    if (!notification) return;

    // Determine channel based on priority
    const channelId = data?.priority === 'high' ? 'urgent' : 'default';

    // Create the notification
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: data || {},
      android: {
        channelId,
        largeIcon: notification.android?.imageUrl,
        bigPicture: data?.imageUrl ? {
          picture: data.imageUrl,
          largeIcon: notification.android?.imageUrl,
        } : undefined,
        actions: data?.actions ? JSON.parse(data.actions) : undefined,
        style: data?.expandedText ? {
          type: AndroidStyle.BIGTEXT,
          text: data.expandedText,
        } : undefined,
      },
      ios: {
        attachments: data?.imageUrl ? [{
          url: data.imageUrl,
        }] : undefined,
        categoryId: data?.categoryId,
      },
    });
  }

  private async processBackgroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const { data } = remoteMessage;

    // Handle different types of background messages
    switch (data?.type) {
      case 'sync_data':
        await this.syncDataInBackground();
        break;
      case 'clear_cache':
        await this.clearCacheInBackground();
        break;
      case 'update_user_status':
        await this.updateUserStatusInBackground(data);
        break;
    }
  }

  private async syncDataInBackground() {
    try {
      // Perform background data sync
      const response = await fetch('https://api.example.com/sync', {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}`,
        },
      });

      const syncData = await response.json();
      await AsyncStorage.setItem('sync_data', JSON.stringify(syncData));

      console.log('Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  private async clearCacheInBackground() {
    try {
      // Clear expired cache entries
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const { timestamp } = JSON.parse(item);
          const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 hours

          if (isExpired) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  private async updateUserStatusInBackground(data: any) {
    try {
      // Update user status based on background message
      const currentStatus = await AsyncStorage.getItem('user_status');
      const newStatus = { ...JSON.parse(currentStatus || '{}'), ...data.status };

      await AsyncStorage.setItem('user_status', JSON.stringify(newStatus));

      console.log('User status updated in background');
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }

  private handleNotificationNavigation(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    const { data } = remoteMessage;

    // Handle navigation based on notification data
    switch (data?.screen) {
      case 'chat':
        // Navigate to chat screen
        break;
      case 'profile':
        // Navigate to profile screen
        break;
      case 'settings':
        // Navigate to settings screen
        break;
    }
  }

  async scheduleLocalNotification(notification: NotificationData, delayMs: number) {
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + delayMs,
    };

    await notifee.createTriggerNotification(
      {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        android: {
          channelId: 'default',
        },
      },
      trigger
    );
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  }

  async cancelNotification(notificationId: string) {
    await notifee.cancelNotification(notificationId);
  }
}

// Background task management
class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private isJobRunning = false;

  static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  async startBackgroundJob() {
    if (this.isJobRunning) return;

    this.isJobRunning = true;

    BackgroundJob.start({
      jobKey: 'myJob',
      period: 15000, // Execute every 15 seconds
      requiredNetworkType: UNMETERED, // Only run on WiFi
      persisted: true,
    });

    BackgroundJob.on('myJob', async () => {
      try {
        await this.performBackgroundTask();
      } catch (error) {
        console.error('Background job failed:', error);
      }
    });
  }

  async stopBackgroundJob() {
    if (!this.isJobRunning) return;

    BackgroundJob.stop({
      jobKey: 'myJob',
    });

    this.isJobRunning = false;
  }

  private async performBackgroundTask() {
    console.log('Executing background task...');

    // Example: Sync offline data
    await this.syncOfflineData();

    // Example: Clean up temporary files
    await this.cleanupTempFiles();

    // Example: Update location if needed
    await this.updateLocationIfNeeded();
  }

  private async syncOfflineData() {
    try {
      const offlineQueue = await AsyncStorage.getItem('offline_queue');
      if (!offlineQueue) return;

      const queue = JSON.parse(offlineQueue);
      const processedItems = [];

      for (const item of queue) {
        try {
          await this.processOfflineItem(item);
          processedItems.push(item.id);
        } catch (error) {
          console.error('Failed to process offline item:', error);
        }
      }

      // Remove processed items from queue
      const remainingQueue = queue.filter(item => !processedItems.includes(item.id));
      await AsyncStorage.setItem('offline_queue', JSON.stringify(remainingQueue));

    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  private async processOfflineItem(item: any) {
    // Process individual offline queue item
    switch (item.type) {
      case 'api_call':
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        break;
      case 'file_upload':
        // Handle file upload
        break;
    }
  }

  private async cleanupTempFiles() {
    // Clean up temporary files older than 24 hours
    const tempDir = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.CachesDirectoryPath;

    try {
      const files = await RNFS.readDir(tempDir);
      const now = Date.now();

      for (const file of files) {
        const age = now - new Date(file.mtime).getTime();
        if (age > 24 * 60 * 60 * 1000) { // 24 hours
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  private async updateLocationIfNeeded() {
    // Update location if location tracking is enabled
    const locationEnabled = await AsyncStorage.getItem('location_tracking_enabled');
    if (locationEnabled === 'true') {
      try {
        // Get current location and update if significant change
        const location = await this.getCurrentLocation();
        await this.updateLocationIfSignificantChange(location);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }
  }

  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  private async updateLocationIfSignificantChange(newLocation: { latitude: number; longitude: number }) {
    const lastLocation = await AsyncStorage.getItem('last_location');

    if (lastLocation) {
      const { latitude: lastLat, longitude: lastLon } = JSON.parse(lastLocation);
      const distance = this.calculateDistance(lastLat, lastLon, newLocation.latitude, newLocation.longitude);

      // Only update if moved more than 100 meters
      if (distance < 100) return;
    }

    // Update location on server
    await fetch('https://api.example.com/location', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newLocation),
    });

    await AsyncStorage.setItem('last_location', JSON.stringify(newLocation));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
```

## Advanced Testing Strategies

### Comprehensive Testing Setup
```typescript
// Jest configuration for React Native
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-image-picker)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// Test utilities
// src/test-utils/setup.ts
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { jest } from '@jest/globals';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Flipper
jest.mock('react-native-flipper', () => ({
  log: jest.fn(),
  logError: jest.fn(),
}));

// Mock network requests
global.fetch = jest.fn();

// Silence console warnings in tests
console.warn = jest.fn();
console.error = jest.fn();

// src/test-utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

// Mock data factory
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
  isOnline: true,
  lastSeen: new Date().toISOString(),
  unreadMessages: 0,
  ...overrides,
});

export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: String(index + 1),
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
    })
  );
};

// Integration test example
// src/screens/__tests__/UserListScreen.test.tsx
import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react-native';
import { render, createMockUsers } from '../../test-utils/test-utils';
import { UserListScreen } from '../UserListScreen';
import { ApiService } from '../../services/ApiService';

// Mock the API service
jest.mock('../../services/ApiService');
const mockedApiService = jest.mocked(ApiService);

describe('UserListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user list correctly', async () => {
    const mockUsers = createMockUsers(3);
    mockedApiService.get.mockResolvedValueOnce({ users: mockUsers });

    const { getByText, getByTestId } = render(<UserListScreen />);

    await waitFor(() => {
      expect(getByText('User 1')).toBeTruthy();
      expect(getByText('User 2')).toBeTruthy();
      expect(getByText('User 3')).toBeTruthy();
    });

    // Verify search functionality
    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'User 1');

    await waitFor(() => {
      expect(getByText('User 1')).toBeTruthy();
      expect(() => getByText('User 2')).toThrow();
    });
  });

  it('handles loading state', () => {
    mockedApiService.get.mockReturnValueOnce(new Promise(() => {})); // Never resolves

    const { getByText } = render(<UserListScreen />);
    expect(getByText('Loading users...')).toBeTruthy();
  });

  it('handles error state', async () => {
    mockedApiService.get.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByTestId } = render(<UserListScreen />);

    await waitFor(() => {
      expect(getByText('Error loading users')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
    });

    // Test retry functionality
    const retryButton = getByTestId('retry-button');
    fireEvent.press(retryButton);

    expect(mockedApiService.get).toHaveBeenCalledTimes(2);
  });

  it('handles pull to refresh', async () => {
    const mockUsers = createMockUsers(2);
    mockedApiService.get.mockResolvedValue({ users: mockUsers });

    const { getByTestId } = render(<UserListScreen />);

    await waitFor(() => {
      expect(mockedApiService.get).toHaveBeenCalledTimes(1);
    });

    // Simulate pull to refresh
    const flatList = getByTestId('user-list');
    fireEvent(flatList, 'refresh');

    await waitFor(() => {
      expect(mockedApiService.get).toHaveBeenCalledTimes(2);
    });
  });
});

// Unit test example for custom hooks
// src/hooks/__tests__/useDeviceMonitoring.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useDeviceMonitoring } from '../useDeviceMonitoring';
import { NativeModules } from 'react-native';

// Mock native module
const mockRNDeviceInfo = {
  getBatteryLevel: jest.fn(),
  getDeviceTemperature: jest.fn(),
};

NativeModules.RNDeviceInfo = mockRNDeviceInfo;

describe('useDeviceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches initial battery level and thermal state', async () => {
    mockRNDeviceInfo.getBatteryLevel.mockResolvedValue(85);
    mockRNDeviceInfo.getDeviceTemperature.mockResolvedValue({
      thermalState: 'normal',
      temperature: 25,
    });

    const { result } = renderHook(() => useDeviceMonitoring());

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.batteryLevel).toBe(85);
    expect(result.current.thermalState).toEqual({
      thermalState: 'normal',
      temperature: 25,
    });
    expect(result.current.isLowBattery).toBe(false);
    expect(result.current.isOverheating).toBe(false);
  });

  it('detects low battery condition', async () => {
    mockRNDeviceInfo.getBatteryLevel.mockResolvedValue(15);
    mockRNDeviceInfo.getDeviceTemperature.mockResolvedValue({
      thermalState: 'normal',
      temperature: 25,
    });

    const { result } = renderHook(() => useDeviceMonitoring());

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.isLowBattery).toBe(true);
  });

  it('detects overheating condition', async () => {
    mockRNDeviceInfo.getBatteryLevel.mockResolvedValue(85);
    mockRNDeviceInfo.getDeviceTemperature.mockResolvedValue({
      thermalState: 'critical',
      temperature: 55,
    });

    const { result } = renderHook(() => useDeviceMonitoring());

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.isOverheating).toBe(true);
  });

  it('handles refresh methods', async () => {
    const { result } = renderHook(() => useDeviceMonitoring());

    await act(async () => {
      await result.current.refreshBatteryLevel();
    });

    expect(mockRNDeviceInfo.getBatteryLevel).toHaveBeenCalled();

    await act(async () => {
      await result.current.refreshThermalState();
    });

    expect(mockRNDeviceInfo.getDeviceTemperature).toHaveBeenCalled();
  });
});
```

## Mobile CI/CD and Deployment

### Automated Build Pipeline
```yaml
# .github/workflows/mobile-ci-cd.yml
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
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'

    - name: Install dependencies
      run: yarn install --frozen-lockfile

    - name: Run type checking
      run: yarn type-check

    - name: Run linting
      run: yarn lint

    - name: Run tests
      run: yarn test --coverage --watchAll=false

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

    - name: Run security audit
      run: yarn audit --level moderate

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'

    - name: Install dependencies
      run: yarn install --frozen-lockfile

    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.1'
        bundler-cache: true
        working-directory: ios

    - name: Install Fastlane
      run: |
        cd ios
        bundle install

    - name: Setup provisioning profiles
      env:
        MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
        FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
        FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
      run: |
        cd ios
        bundle exec fastlane match appstore --readonly

    - name: Build iOS app
      env:
        FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
        FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
      run: |
        cd ios
        bundle exec fastlane build_release

    - name: Upload to TestFlight
      env:
        FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
        FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
        APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
      run: |
        cd ios
        bundle exec fastlane upload_testflight

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'

    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '11'

    - name: Setup Android SDK
      uses: android-actions/setup-android@v2

    - name: Install dependencies
      run: yarn install --frozen-lockfile

    - name: Setup signing
      env:
        ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
        ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
        ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      run: |
        echo $ANDROID_KEYSTORE_BASE64 | base64 -d > android/app/release.keystore

    - name: Build Android AAB
      env:
        ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
        ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
        ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      run: |
        cd android
        ./gradlew bundleRelease

    - name: Upload to Google Play
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
        packageName: com.yourapp.name
        releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
        track: internal
        status: completed

# Fastfile for iOS automation
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  before_all do
    setup_circle_ci
  end

  desc "Build release version"
  lane :build_release do
    increment_build_number(xcodeproj: "YourApp.xcodeproj")

    match(type: "appstore")

    gym(
      scheme: "YourApp",
      configuration: "Release",
      export_method: "app-store",
      output_directory: "./build",
      output_name: "YourApp.ipa"
    )
  end

  desc "Upload to TestFlight"
  lane :upload_testflight do
    pilot(
      skip_waiting_for_build_processing: true,
      skip_submission: true,
      distribute_external: false,
      notify_external_testers: false,
      ipa: "./build/YourApp.ipa"
    )
  end

  desc "Deploy to App Store"
  lane :deploy_app_store do
    deliver(
      submit_for_review: false,
      automatic_release: false,
      force: true,
      ipa: "./build/YourApp.ipa"
    )
  end

  desc "Run tests"
  lane :test do
    scan(
      scheme: "YourApp",
      configuration: "Debug",
      devices: ["iPhone 14"],
      code_coverage: true
    )
  end

  error do |lane, exception|
    slack(
      message: "Error in lane #{lane}: #{exception.message}",
      success: false
    )
  end
end

# Android Gradle configuration for automated builds
# android/app/build.gradle (excerpt)
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

            // Bundle optimization
            bundle {
                language {
                    enableSplit = true
                }
                density {
                    enableSplit = true
                }
                abi {
                    enableSplit = true
                }
            }
        }
    }

    // App Bundle configuration
    bundle {
        storeArchive {
            enable = false
        }
    }
}
```

This comprehensive mobile development skill provides expert-level capabilities for building modern, performant mobile applications with advanced React Native features, native modules, comprehensive testing, automated CI/CD pipelines, and production-ready deployment strategies across all major platforms and frameworks.