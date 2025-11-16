const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let menubarWindow;
let tray;
let config;


function loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configData);
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        return {
            appearance: {
                backgroundImage: "",
                backgroundColor: "linear-gradient(135deg, #f5e6f0 0%, #e8d5e8 100%)",
                cardColor: "rgba(254, 247, 252, 0.85)",
                primaryColor: "#d4a5c4",
                secondaryColor: "#e8c9dd",
                textColor: "#8b6f7d",
                accentColor: "#c89bb8"
            },
            window: {
                width: 520,
                height: 780,
                resizable: false,
                icon: "",
                titleBarColor: "#c8b4c8"
            },
            downloads: {
                defaultPath: "",
                videoQualities: ["2160p", "1440p", "1080p", "720p", "480p", "360p"],
                audioQualities: ["320kbps", "256kbps", "192kbps", "128kbps"]
            }
        };
    }
}

function createWindow() {
    config = loadConfig();
    
    const iconPath = config.window.icon || path.join(__dirname, 'icon.png');
    const isMac = process.platform === 'darwin';
    
    mainWindow = new BrowserWindow({
        width: config.window.width,
        height: config.window.height,
        resizable: config.window.resizable,
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        frame: isMac,  
        backgroundColor: '#c8b4c8',
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    
    
    if (isMac) {
        mainWindow.on('close', (event) => {
            if (!app.isQuitting) {
                event.preventDefault();
                mainWindow.hide();
            }
        });
    }
}


function createMenubarWindow() {
    const isMac = process.platform === 'darwin';
    if (!isMac) return;
    
    menubarWindow = new BrowserWindow({
        width: 320,
        height: 480,
        show: false,
        frame: false,
        resizable: false,
        transparent: false,
        backgroundColor: '#c8b4c8',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        skipTaskbar: true,
        alwaysOnTop: true
    });
    
    menubarWindow.loadFile('menubar.html');
}


function createTrayIcon() {
    // Look for iconTemplate.png first (proper naming for macOS menubar)
    const iconPaths = [
        path.join(__dirname, 'iconTemplate.png'),
        path.join(__dirname, 'icon.png'),
        path.join(__dirname, 'app_icon.ico'),
    ];
    
    console.log('Searching for tray icon...');
    
    for (const iconPath of iconPaths) {
        if (fs.existsSync(iconPath)) {
            try {
                let icon = nativeImage.createFromPath(iconPath);
                if (!icon.isEmpty()) {
                    console.log('Found tray icon:', iconPath);
                    // Resize to 16x16 for menubar
                    icon = icon.resize({ width: 16, height: 16 });
                    // Mark as template AFTER resize
                    icon.setTemplateImage(true);
                    return icon;
                }
            } catch (err) {
                console.error('Failed to load icon:', iconPath, err);
            }
        }
    }
    
    // If no file found, create empty template image
    console.log('No icon found, creating empty template');
    const emptyIcon = nativeImage.createEmpty();
    emptyIcon.setTemplateImage(true);
    return emptyIcon;
}

function createTray() {
    const isMac = process.platform === 'darwin';
    if (!isMac) return;
    
    const trayIcon = createTrayIcon();
    
    tray = new Tray(trayIcon);
    tray.setToolTip('AniH Downloader');
    
    
    tray.on('click', () => {
        toggleMenubarWindow();
    });
    
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Full App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
}


function toggleMenubarWindow() {
    if (!menubarWindow) return;
    
    if (menubarWindow.isVisible()) {
        menubarWindow.hide();
    } else {
        const bounds = tray.getBounds();
        const windowBounds = menubarWindow.getBounds();
        
        
        const x = Math.round(bounds.x + (bounds.width / 2) - (windowBounds.width / 2));
        const y = Math.round(bounds.y + bounds.height);
        
        menubarWindow.setPosition(x, y, false);
        menubarWindow.show();
        menubarWindow.focus();
    }
}

// ============================================================================
// YT-DLP PATH RESOLUTION
// ============================================================================

function getYtdlpPath() {
    const platform = process.platform;
    const ytdlpName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytdlpPath = path.join(__dirname, ytdlpName);
    
    console.log(`[yt-dlp] Looking for: ${ytdlpPath}`);
    
    if (!fs.existsSync(ytdlpPath)) {
        throw new Error(`yt-dlp not found at: ${ytdlpPath}`);
    }
    
    if (platform !== 'win32') {
        try {
            fs.chmodSync(ytdlpPath, 0o755);
        } catch (error) {
            console.warn(`[yt-dlp] Could not set executable permissions: ${error.message}`);
        }
    }
    
    console.log(`[yt-dlp] Found: ${ytdlpPath}`);
    return ytdlpPath;
}

// ============================================================================
// FFMPEG PATH RESOLUTION
// ============================================================================

function getFfmpegPath() {
    const platform = process.platform;
    const isDev = !app.isPackaged;
    
    console.log(`[ffmpeg] Resolving ffmpeg path - Platform: ${platform}, Dev mode: ${isDev}`);
    
    let ffmpegBinaryName;
    if (platform === 'win32') {
        ffmpegBinaryName = 'ffmpeg.exe';
    } else if (platform === 'darwin') {
        ffmpegBinaryName = 'ffmpeg';
    } else if (platform === 'linux') {
        ffmpegBinaryName = 'ffmpeg';
    } else {
        throw new Error(`[ffmpeg] Unsupported platform: ${platform}`);
    }
    
    let ffmpegPath;
    
    if (isDev) {
        try {
            const ffmpegStatic = require('ffmpeg-static');
            ffmpegPath = ffmpegStatic;
            
            if (platform === 'win32' && !ffmpegPath.endsWith('.exe')) {
                throw new Error(`[ffmpeg] Wrong binary for Windows - got: ${ffmpegPath}`);
            } else if (platform !== 'win32' && ffmpegPath.endsWith('.exe')) {
                throw new Error(`[ffmpeg] Wrong binary for ${platform} - got Windows executable: ${ffmpegPath}`);
            }
            
            console.log(`[ffmpeg] Dev mode - Using ffmpeg-static: ${ffmpegPath}`);
            
        } catch (error) {
            throw new Error(`[ffmpeg] Failed to load ffmpeg-static in dev mode: ${error.message}`);
        }
        
    } else {
        const unpackedPath = __dirname.replace('app.asar', 'app.asar.unpacked');
        const ffmpegStaticPath = path.join(unpackedPath, 'node_modules', 'ffmpeg-static');
        
        console.log(`[ffmpeg] Production mode - Searching in: ${ffmpegStaticPath}`);
        
        const possiblePaths = [
            path.join(ffmpegStaticPath, ffmpegBinaryName),
            path.join(ffmpegStaticPath, 'bin', ffmpegBinaryName),
            path.join(ffmpegStaticPath, platform, ffmpegBinaryName),
        ];
        
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                ffmpegPath = testPath;
                console.log(`[ffmpeg] Found at: ${ffmpegPath}`);
                break;
            }
        }
        
        if (!ffmpegPath) {
            throw new Error(
                `[ffmpeg] Binary not found in unpacked app. Searched:\n${possiblePaths.join('\n')}\n` +
                `Make sure ffmpeg-static is unpacked via asarUnpack in package.json`
            );
        }
    }
    
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`[ffmpeg] Path resolved but file does not exist: ${ffmpegPath}`);
    }
    
    if (platform !== 'win32') {
        try {
            fs.accessSync(ffmpegPath, fs.constants.X_OK);
        } catch (error) {
            throw new Error(`[ffmpeg] Binary exists but is not executable: ${ffmpegPath}`);
        }
    }
    
    console.log(`[ffmpeg] Successfully resolved: ${ffmpegPath}`);
    return ffmpegPath;
}

// ============================================================================

app.whenReady().then(() => {
    config = loadConfig();
    
    try {
        const ytdlpPath = getYtdlpPath();
        console.log(`[yt-dlp] Verified on startup: ${ytdlpPath}`);
    } catch (error) {
        console.error(`[yt-dlp] WARNING: ${error.message}`);
    }
    
    try {
        const ffmpegPath = getFfmpegPath();
        console.log(`[ffmpeg] Verified on startup: ${ffmpegPath}`);
    } catch (error) {
        console.error(`[ffmpeg] WARNING: ${error.message}`);
    }
    
    
    if (process.platform === 'darwin') {
        createTray();
        createMenubarWindow();
        createWindow();
    } else {
        createWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

ipcMain.handle('load-config', () => {
    return config;
});

ipcMain.handle('get-default-path', () => {
    return config.downloads.defaultPath || path.join(os.homedir(), 'Downloads');
});

ipcMain.handle('select-folder', async () => {
    const targetWindow = menubarWindow && menubarWindow.isVisible() ? menubarWindow : mainWindow;
    const result = await dialog.showOpenDialog(targetWindow, {
        properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('show-error', async (event, title, message) => {
    const targetWindow = menubarWindow && menubarWindow.isVisible() ? menubarWindow : mainWindow;
    await dialog.showMessageBox(targetWindow, {
        type: 'error',
        title: title,
        message: message,
        buttons: ['OK']
    });
});

ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.handle('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('close-menubar-window', () => {
    if (menubarWindow) {
        menubarWindow.hide();
    }
});

ipcMain.handle('open-main-window', () => {
    if (menubarWindow) {
        menubarWindow.hide();
    }
    
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    } else {
        createWindow();
    }
});

ipcMain.handle('download-video', async (event, data) => {
    const { url, downloadPath, format, quality, customFileName } = data;
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    
    return new Promise((resolve, reject) => {
        let ytdlpPath;
        try {
            ytdlpPath = getYtdlpPath();
        } catch (error) {
            const errorMsg = `yt-dlp not found: ${error.message}`;
            console.error(`[yt-dlp] ${errorMsg}`);
            senderWindow.webContents.send('download-error', errorMsg);
            return reject(new Error(errorMsg));
        }
        
        let ffmpegPath;
        try {
            ffmpegPath = getFfmpegPath();
        } catch (error) {
            const errorMsg = `FFmpeg not found: ${error.message}`;
            console.error(`[ffmpeg] ${errorMsg}`);
            senderWindow.webContents.send('download-error', errorMsg);
            return reject(new Error(errorMsg));
        }
        
        const fileName = customFileName || '%(title)s';
        const outputTemplate = path.join(downloadPath, `${fileName}.%(ext)s`);
        
        const args = [
            url,
            '-o', outputTemplate,
            '--ffmpeg-location', ffmpegPath,
            '--newline',
            '--no-playlist'
        ];
        
        if (format === 'audio') {
            args.push('-x');
            args.push('--audio-format', 'mp3');
            if (quality !== 'best') {
                args.push('--audio-quality', quality.replace('kbps', 'K'));
            }
        } else {
            if (quality === 'best') {
                args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
            } else {
                const height = quality.replace('p', '');
                args.push('-f', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best`);
            }
        }
        
        console.log(`[download] Starting yt-dlp with ffmpeg: ${ffmpegPath}`);
        
        const ytdlp = spawn(ytdlpPath, args);
        let videoTitle = customFileName || 'Video';
        
        ytdlp.stdout.on('data', (data) => {
            const output = data.toString();
            
            const progressMatch = output.match(/(\d+\.?\d*)%/);
            if (progressMatch) {
                const percent = Math.floor(parseFloat(progressMatch[1]));
                senderWindow.webContents.send('download-progress', { percent });
            }
            
            const titleMatch = output.match(/\[download\] Destination: (.+)/);
            if (titleMatch) {
                const fullPath = titleMatch[1];
                videoTitle = path.basename(fullPath, path.extname(fullPath));
            }
        });
        
        ytdlp.stderr.on('data', (data) => {
            const output = data.toString();
            console.log('[yt-dlp]:', output);
            
            if (output.toLowerCase().includes('ffmpeg') || output.toLowerCase().includes('ffprobe')) {
                console.error('[ffmpeg] Potential ffmpeg error in yt-dlp output:', output);
            }
        });
        
        ytdlp.on('close', (code) => {
            if (code === 0) {
                console.log(`[download] Successfully completed: ${videoTitle}`);
                senderWindow.webContents.send('download-complete', {
                    title: videoTitle,
                    format,
                    quality
                });
                resolve();
            } else {
                const error = `Download failed with code ${code}`;
                console.error(`[download] ${error}`);
                senderWindow.webContents.send('download-error', error);
                reject(new Error(error));
            }
        });
        
        ytdlp.on('error', (err) => {
            console.error('[download] yt-dlp process error:', err);
            senderWindow.webContents.send('download-error', err.message);
            reject(err);
        });
    });
});