# Desktop Application Development Skill

Modern desktop application development expertise covering Electron, Tauri, native frameworks, cross-platform deployment, and performance optimization for Windows, macOS, and Linux applications.

## Skill Overview

Expert desktop development knowledge including cross-platform frameworks, native development, UI/UX design, system integration, packaging and distribution, and modern desktop application architecture patterns.

## Core Capabilities

### Cross-Platform Frameworks
- **Electron development** - JavaScript/TypeScript, native APIs, performance optimization
- **Tauri applications** - Rust backend, web frontend, security-first architecture
- **Flutter desktop** - Dart development, material design, platform channels
- **.NET MAUI** - C# development, XAML UI, multi-platform targeting

### Native Development
- **Windows development** - C++/C#, WPF, UWP, Win32 APIs, WinUI 3
- **macOS development** - Swift/Objective-C, AppKit, SwiftUI, macOS APIs
- **Linux development** - GTK, Qt, system libraries, package management
- **Performance optimization** - Memory management, threading, native bindings

### System Integration
- **File system access** - File operations, directory monitoring, permissions
- **Hardware integration** - Camera, microphone, sensors, USB devices
- **System notifications** - Toast notifications, system tray, badge management
- **Inter-process communication** - Named pipes, shared memory, message queues

### Distribution & Packaging
- **Code signing** - Certificate management, notarization, security compliance
- **Auto-updates** - Update servers, delta updates, rollback mechanisms
- **Package formats** - MSI, DMG, AppImage, Snap, Flatpak, Windows Store
- **CI/CD integration** - Automated builds, testing, deployment pipelines

## Modern Desktop Development Implementation

### Advanced Electron Application with TypeScript
```typescript
// Comprehensive Electron application with modern architecture
import { app, BrowserWindow, ipcMain, Menu, shell, dialog, autoUpdater } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import Store from 'electron-store';
import log from 'electron-log';
import { autoStart } from 'electron-auto-start';

// Configuration and state management
interface AppConfig {
  windowBounds: Electron.Rectangle;
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  updateChannel: 'stable' | 'beta' | 'alpha';
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
}

class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: {
        windowBounds: { x: undefined, y: undefined, width: 1200, height: 800 },
        theme: 'system',
        autoStart: false,
        updateChannel: 'stable',
        privacy: {
          analytics: false,
          crashReports: false
        }
      }
    });
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
  }

  getAll(): AppConfig {
    return this.store.store;
  }

  reset(): void {
    this.store.clear();
  }
}

// Window management
class WindowManager extends EventEmitter {
  private windows: Map<string, BrowserWindow> = new Map();
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    super();
    this.config = config;
  }

  createMainWindow(): BrowserWindow {
    const bounds = this.config.get('windowBounds');

    const mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      }
    });

    // Window event handlers
    mainWindow.on('ready-to-show', () => {
      mainWindow.show();

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.webContents.openDevTools();
      }
    });

    mainWindow.on('closed', () => {
      this.windows.delete('main');
    });

    mainWindow.on('resize', () => this.saveBounds(mainWindow));
    mainWindow.on('move', () => this.saveBounds(mainWindow));

    // Security: Prevent new window creation
    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    // Load the app
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.windows.set('main', mainWindow);
    return mainWindow;
  }

  createPreferencesWindow(): BrowserWindow {
    const prefsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      resizable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      parent: this.windows.get('main'),
      webPreferences: {
        preload: path.join(__dirname, '../preload/preferences.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    prefsWindow.loadFile(path.join(__dirname, '../renderer/preferences.html'));

    prefsWindow.on('closed', () => {
      this.windows.delete('preferences');
    });

    this.windows.set('preferences', prefsWindow);
    return prefsWindow;
  }

  getWindow(name: string): BrowserWindow | undefined {
    return this.windows.get(name);
  }

  closeAllWindows(): void {
    this.windows.forEach(window => window.close());
    this.windows.clear();
  }

  private saveBounds(window: BrowserWindow): void {
    const bounds = window.getBounds();
    this.config.set('windowBounds', bounds);
  }
}

// File system operations
class FileManager {
  private allowedExtensions = ['.txt', '.md', '.json', '.csv', '.pdf'];
  private maxFileSize = 100 * 1024 * 1024; // 100MB

  async openFile(): Promise<{ filePath: string; content: string } | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'Data Files', extensions: ['json', 'csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];

    try {
      await this.validateFile(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      log.info(`File opened: ${filePath}`);
      return { filePath, content };
    } catch (error) {
      log.error(`Failed to open file: ${error}`);
      throw error;
    }
  }

  async saveFile(content: string, filePath?: string): Promise<string> {
    let targetPath = filePath;

    if (!targetPath) {
      const result = await dialog.showSaveDialog({
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        throw new Error('Save operation cancelled');
      }

      targetPath = result.filePath;
    }

    try {
      await fs.writeFile(targetPath, content, 'utf-8');
      log.info(`File saved: ${targetPath}`);
      return targetPath;
    } catch (error) {
      log.error(`Failed to save file: ${error}`);
      throw error;
    }
  }

  private async validateFile(filePath: string): Promise<void> {
    const stats = await fs.stat(filePath);

    if (stats.size > this.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`File type not allowed: ${ext}`);
    }
  }

  async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;

    try {
      await fs.copyFile(filePath, backupPath);
      log.info(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      log.error(`Failed to create backup: ${error}`);
      throw error;
    }
  }
}

// Auto-updater management
class UpdateManager extends EventEmitter {
  private config: ConfigManager;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: ConfigManager) {
    super();
    this.config = config;
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure update server
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'your-github-username',
      repo: 'your-app-repo',
      private: false
    });

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.emit('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.emit('update-available', info);
    });

    autoUpdater.on('update-not-available', () => {
      log.info('Update not available');
      this.emit('update-not-available');
    });

    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      this.emit('error', error);
    });

    autoUpdater.on('download-progress', (progress) => {
      log.info(`Download progress: ${progress.percent}%`);
      this.emit('download-progress', progress);
    });

    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded');
      this.emit('update-downloaded');
    });
  }

  checkForUpdates(): void {
    if (is.dev) {
      log.info('Skipping update check in development');
      return;
    }

    autoUpdater.checkForUpdatesAndNotify();
  }

  startPeriodicCheck(): void {
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, 4 * 60 * 60 * 1000); // Check every 4 hours
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall();
  }
}

// Application analytics (privacy-respecting)
class AnalyticsManager {
  private config: ConfigManager;
  private sessionId: string;
  private sessionStart: number;

  constructor(config: ConfigManager) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.config.get('privacy').analytics) {
      return;
    }

    const event = {
      sessionId: this.sessionId,
      eventName,
      properties,
      timestamp: Date.now(),
      platform: process.platform,
      version: app.getVersion()
    };

    // In production, send to your analytics service
    log.info('Analytics event:', event);
  }

  trackPageView(page: string): void {
    this.trackEvent('page_view', { page });
  }

  trackFeatureUsage(feature: string, metadata?: Record<string, any>): void {
    this.trackEvent('feature_usage', { feature, ...metadata });
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// System tray management
class TrayManager {
  private tray: Electron.Tray | null = null;
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  createTray(): void {
    const iconPath = path.join(__dirname, '../resources/icon.png');
    this.tray = new Electron.Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          const mainWindow = this.windowManager.getWindow('main');
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Preferences',
        click: () => {
          this.windowManager.createPreferencesWindow();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Your Desktop App');

    this.tray.on('click', () => {
      const mainWindow = this.windowManager.getWindow('main');
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    });
  }

  destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

// Main application class
class DesktopApplication {
  private config: ConfigManager;
  private windowManager: WindowManager;
  private fileManager: FileManager;
  private updateManager: UpdateManager;
  private analytics: AnalyticsManager;
  private trayManager: TrayManager;

  constructor() {
    this.config = new ConfigManager();
    this.windowManager = new WindowManager(this.config);
    this.fileManager = new FileManager();
    this.updateManager = new UpdateManager(this.config);
    this.analytics = new AnalyticsManager(this.config);
    this.trayManager = new TrayManager(this.windowManager);

    this.setupIPCHandlers();
    this.setupAppEventHandlers();
  }

  private setupIPCHandlers(): void {
    // File operations
    ipcMain.handle('file:open', async () => {
      try {
        const result = await this.fileManager.openFile();
        this.analytics.trackFeatureUsage('file_open');
        return result;
      } catch (error) {
        log.error('File open error:', error);
        throw error;
      }
    });

    ipcMain.handle('file:save', async (_, content: string, filePath?: string) => {
      try {
        const savedPath = await this.fileManager.saveFile(content, filePath);
        this.analytics.trackFeatureUsage('file_save');
        return savedPath;
      } catch (error) {
        log.error('File save error:', error);
        throw error;
      }
    });

    // Configuration management
    ipcMain.handle('config:get', (_, key: keyof AppConfig) => {
      return this.config.get(key);
    });

    ipcMain.handle('config:set', (_, key: keyof AppConfig, value: any) => {
      this.config.set(key, value);
      this.analytics.trackFeatureUsage('config_change', { key });
    });

    ipcMain.handle('config:getAll', () => {
      return this.config.getAll();
    });

    // Update management
    ipcMain.handle('update:check', () => {
      this.updateManager.checkForUpdates();
    });

    ipcMain.handle('update:install', () => {
      this.updateManager.installUpdate();
    });

    // Analytics
    ipcMain.handle('analytics:track', (_, eventName: string, properties?: Record<string, any>) => {
      this.analytics.trackEvent(eventName, properties);
    });

    // System integration
    ipcMain.handle('system:showInFolder', (_, filePath: string) => {
      shell.showItemInFolder(filePath);
    });

    ipcMain.handle('system:openExternal', (_, url: string) => {
      shell.openExternal(url);
    });
  }

  private setupAppEventHandlers(): void {
    app.whenReady().then(() => {
      electronApp.setAppUserModelId('com.yourcompany.yourapp');

      this.windowManager.createMainWindow();
      this.trayManager.createTray();
      this.updateManager.startPeriodicCheck();

      this.analytics.trackEvent('app_start');

      app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
      });

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.windowManager.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.analytics.trackEvent('app_quit', {
        sessionDuration: this.analytics.getSessionDuration()
      });

      this.updateManager.stopPeriodicCheck();
      this.trayManager.destroyTray();
    });

    // Security: Prevent navigation to external websites
    app.on('web-contents-created', (_, contents) => {
      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
          event.preventDefault();
        }
      });

      contents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
      });
    });
  }

  run(): void {
    // Enable live reload for development
    if (is.dev) {
      require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
      });
    }
  }
}

// Initialize and run the application
const desktopApp = new DesktopApplication();
desktopApp.run();

export default desktopApp;
```

### Tauri Application with Rust Backend
```rust
// Comprehensive Tauri application with Rust backend
use tauri::{
    command, generate_context, generate_handler, Builder, CustomMenuItem, Manager, Menu,
    SystemTray, SystemTrayEvent, SystemTrayMenu, Window, WindowBuilder, WindowUrl,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::{Result, Error};

// Application state management
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub theme: String,
    pub auto_save: bool,
    pub backup_enabled: bool,
    pub language: String,
    pub window_bounds: WindowBounds,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            auto_save: true,
            backup_enabled: true,
            language: "en".to_string(),
            window_bounds: WindowBounds {
                x: 100,
                y: 100,
                width: 1200,
                height: 800,
            },
        }
    }
}

// Document management
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub file_path: Option<PathBuf>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub word_count: usize,
}

impl Document {
    pub fn new(title: String, content: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content: content.clone(),
            file_path: None,
            created_at: now,
            updated_at: now,
            word_count: content.split_whitespace().count(),
        }
    }

    pub fn update_content(&mut self, content: String) {
        self.content = content.clone();
        self.word_count = content.split_whitespace().count();
        self.updated_at = Utc::now();
    }
}

// Application state
pub struct AppState {
    pub config: Arc<RwLock<AppConfig>>,
    pub documents: Arc<RwLock<Vec<Document>>>,
    pub active_document_id: Arc<RwLock<Option<String>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(RwLock::new(AppConfig::default())),
            documents: Arc::new(RwLock::new(Vec::new())),
            active_document_id: Arc::new(RwLock::new(None)),
        }
    }
}

// Configuration management commands
#[command]
async fn load_config(state: tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    let config_path = get_config_path()?;

    if config_path.exists() {
        let content = fs::read_to_string(config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;

        let config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;

        *state.config.write().await = config.clone();
        Ok(config)
    } else {
        let default_config = AppConfig::default();
        save_config_internal(&default_config).await?;
        *state.config.write().await = default_config.clone();
        Ok(default_config)
    }
}

#[command]
async fn save_config(
    config: AppConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    *state.config.write().await = config.clone();
    save_config_internal(&config).await
}

async fn save_config_internal(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

fn get_config_path() -> Result<PathBuf, String> {
    tauri::api::path::config_dir()
        .ok_or("Failed to get config directory")?
        .join("YourApp")
        .join("config.json")
        .into()
}

// Document management commands
#[command]
async fn create_document(
    title: String,
    content: String,
    state: tauri::State<'_, AppState>,
) -> Result<Document, String> {
    let document = Document::new(title, content);
    let document_id = document.id.clone();

    state.documents.write().await.push(document.clone());
    *state.active_document_id.write().await = Some(document_id);

    Ok(document)
}

#[command]
async fn update_document(
    document_id: String,
    content: String,
    state: tauri::State<'_, AppState>,
) -> Result<Document, String> {
    let mut documents = state.documents.write().await;

    if let Some(document) = documents.iter_mut().find(|d| d.id == document_id) {
        document.update_content(content);
        Ok(document.clone())
    } else {
        Err("Document not found".to_string())
    }
}

#[command]
async fn get_documents(state: tauri::State<'_, AppState>) -> Result<Vec<Document>, String> {
    Ok(state.documents.read().await.clone())
}

#[command]
async fn delete_document(
    document_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut documents = state.documents.write().await;

    if let Some(pos) = documents.iter().position(|d| d.id == document_id) {
        documents.remove(pos);

        // Clear active document if it was deleted
        let active_id = state.active_document_id.read().await;
        if active_id.as_ref() == Some(&document_id) {
            drop(active_id);
            *state.active_document_id.write().await = None;
        }

        Ok(())
    } else {
        Err("Document not found".to_string())
    }
}

// File operations
#[command]
async fn open_file_dialog() -> Result<Option<PathBuf>, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;

    Ok(FileDialogBuilder::new()
        .add_filter("Text files", &["txt", "md"])
        .add_filter("All files", &["*"])
        .pick_file())
}

#[command]
async fn save_file_dialog() -> Result<Option<PathBuf>, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;

    Ok(FileDialogBuilder::new()
        .add_filter("Text files", &["txt"])
        .add_filter("Markdown files", &["md"])
        .save_file())
}

#[command]
async fn read_file(file_path: PathBuf) -> Result<String, String> {
    fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
async fn write_file(file_path: PathBuf, content: String) -> Result<(), String> {
    fs::write(file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

// System integration
#[command]
async fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(std::path::Path::new(&path).parent().unwrap_or(std::path::Path::new("/")))
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }

    Ok(())
}

#[command]
async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[derive(Serialize)]
struct SystemInfo {
    platform: String,
    arch: String,
    version: String,
}

// Window management
#[command]
async fn create_preferences_window(app: tauri::AppHandle) -> Result<(), String> {
    if app.get_window("preferences").is_some() {
        return Ok(()); // Window already exists
    }

    WindowBuilder::new(
        &app,
        "preferences",
        WindowUrl::App("preferences.html".into())
    )
    .title("Preferences")
    .inner_size(600.0, 400.0)
    .resizable(false)
    .center()
    .build()
    .map_err(|e| format!("Failed to create preferences window: {}", e))?;

    Ok(())
}

// Auto-save functionality
async fn setup_auto_save(app: tauri::AppHandle, state: AppState) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));

    loop {
        interval.tick().await;

        let config = state.config.read().await;
        if !config.auto_save {
            continue;
        }
        drop(config);

        let documents = state.documents.read().await.clone();
        for document in documents {
            if let Some(file_path) = &document.file_path {
                if let Err(e) = fs::write(file_path, &document.content) {
                    eprintln!("Auto-save failed for {}: {}", document.title, e);
                }
            }
        }
    }
}

// System tray setup
fn create_system_tray() -> SystemTray {
    let menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show App"))
        .add_item(CustomMenuItem::new("preferences", "Preferences"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit"));

    SystemTray::new().with_menu(menu)
}

fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                if window.is_visible().unwrap_or(false) {
                    window.hide().unwrap_or_default();
                } else {
                    window.show().unwrap_or_default();
                    window.set_focus().unwrap_or_default();
                }
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().unwrap_or_default();
                        window.set_focus().unwrap_or_default();
                    }
                }
                "preferences" => {
                    tauri::async_runtime::spawn(async move {
                        create_preferences_window(app.clone()).await.unwrap_or_default();
                    });
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        }
        _ => {}
    }
}

// Main function
#[tokio::main]
async fn main() {
    let state = AppState::new();
    let app_handle = Arc::new(Mutex::new(None));
    let app_handle_clone = app_handle.clone();

    Builder::default()
        .manage(state)
        .invoke_handler(generate_handler![
            load_config,
            save_config,
            create_document,
            update_document,
            get_documents,
            delete_document,
            open_file_dialog,
            save_file_dialog,
            read_file,
            write_file,
            show_in_folder,
            get_system_info,
            create_preferences_window
        ])
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .setup(move |app| {
            let app_handle_ref = app.handle();
            *app_handle_clone.lock().unwrap() = Some(app_handle_ref.clone());

            // Setup auto-save
            let state = app.state::<AppState>();
            tauri::async_runtime::spawn(setup_auto_save(app_handle_ref, state.inner().clone()));

            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}
```

## Skill Activation Triggers

This skill automatically activates when:
- Desktop application development is needed
- Cross-platform application deployment is required
- Native system integration is requested
- Application packaging and distribution is needed
- Desktop UI/UX development is required
- System tray and notification management is requested

This comprehensive desktop application development skill provides expert-level capabilities for creating modern, cross-platform desktop applications using industry-standard frameworks and tools.