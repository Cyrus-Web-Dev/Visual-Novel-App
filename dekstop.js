/**
 * dekstop.js — Electron + static HTTP server (TANPA PHP, TANPA Express, TANPA MySQL)
 *
 * - File game dilayani oleh http.createServer sederhana
 * - Akun & progress: SQLite via better-sqlite3 di main process
 * - Renderer bicara lewat preload (window.hlhAPI)
 */

const { app, BrowserWindow, shell, dialog, session, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');

const dbApi = require('./db-sqlite');

const PORT = 8080;
const HOST = '127.0.0.1';
const START_PATH = '/intro.html';
const BASE_URL = `http://${HOST}:${PORT}`;

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let mainWindow = null;
let staticServer = null;
/** @type {{ id: number, username: string, mc_name: string } | null} */
let currentSession = null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json'
};

function isLocalUrl(url) {
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch (_) {
    return false;
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const root = __dirname;

    staticServer = http.createServer((req, res) => {
      try {
        const u = new URL(req.url || '/', BASE_URL);
        let pathname = decodeURIComponent(u.pathname);
        if (pathname === '/') pathname = START_PATH;

        // Cegah path traversal
        const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
        let filePath = path.join(root, safe);

        if (!filePath.startsWith(root)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        // Redirect lama .php → .html
        if (filePath.endsWith('.php')) {
          const htmlPath = filePath.replace(/\.php$/i, '.html');
          if (fs.existsSync(htmlPath)) {
            res.writeHead(302, { Location: pathname.replace(/\.php$/i, '.html') });
            res.end();
            return;
          }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found: ' + pathname);
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': type,
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err.message || err));
      }
    });

    staticServer.once('error', (err) => {
      reject(
        new Error(
          'Gagal bind port ' +
            PORT +
            ': ' +
            (err.message || err) +
            '\nTutup aplikasi lain yang memakai port 8080.'
        )
      );
    });

    staticServer.listen(PORT, HOST, () => {
      console.log('[static] http://' + HOST + ':' + PORT);
      resolve();
    });
  });
}

function stopStaticServer() {
  if (!staticServer) return;
  try {
    staticServer.close();
  } catch (_) {}
  staticServer = null;
}

function registerIpc() {
  ipcMain.handle('auth:register', (_e, payload) => {
    const result = dbApi.registerUser(payload || {});
    if (result.ok) {
      currentSession = {
        id: result.user.id,
        username: result.user.username,
        mc_name: result.user.mc_name
      };
    }
    return result;
  });

  ipcMain.handle('auth:login', (_e, payload) => {
    const result = dbApi.loginUser(payload || {});
    if (result.ok) {
      currentSession = {
        id: result.user.id,
        username: result.user.username,
        mc_name: result.user.mc_name
      };
    }
    return result;
  });

  ipcMain.handle('auth:logout', () => {
    currentSession = null;
    return { ok: true };
  });

  ipcMain.handle('auth:session', () => {
    if (!currentSession) return { ok: false, user: null };
    return { ok: true, user: { ...currentSession } };
  });

  ipcMain.handle('progress:save', (_e, payload) => {
    if (!currentSession) {
      return { ok: false, message: 'Belum login. Progress akun tidak disimpan.' };
    }
    return dbApi.saveProgress(currentSession.id, payload || {});
  });

  ipcMain.handle('progress:load', () => {
    if (!currentSession) {
      return { ok: false, message: 'Belum login.' };
    }
    return dbApi.loadProgress(currentSession.id);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 600,
    title: 'Harmoni Lima Hati',
    backgroundColor: '#170f28',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // diperlukan agar preload bisa require electron
    }
  });

  mainWindow.webContents.setUserAgent(CHROME_UA);
  try {
    session.defaultSession.setUserAgent(CHROME_UA);
  } catch (_) {}

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Game',
        submenu: [
          {
            label: 'Muat Ulang',
            accelerator: 'CmdOrCtrl+R',
            click: () => mainWindow.reload()
          },
          {
            label: 'Ke Intro',
            click: () => mainWindow.loadURL(BASE_URL + START_PATH)
          },
          {
            label: 'Ke Login',
            click: () => mainWindow.loadURL(BASE_URL + '/login.html')
          },
          { type: 'separator' },
          { role: 'quit', label: 'Keluar' }
        ]
      },
      {
        label: 'Debug',
        submenu: [
          {
            label: 'DevTools',
            accelerator: 'F12',
            click: () => mainWindow.webContents.openDevTools({ mode: 'detach' })
          }
        ]
      }
    ])
  );

  mainWindow.loadURL(BASE_URL + START_PATH);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalUrl(url)) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isLocalUrl(url)) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function boot() {
  try {
    const dbPath = dbApi.openDatabase(app.getPath('userData'));
    console.log('[sqlite]', dbPath);
    registerIpc();
    await startStaticServer();
    createWindow();
  } catch (err) {
    console.error(err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Gagal memulai aplikasi',
      message: String(err.message || err),
      detail:
        'Checklist:\n' +
        '• Jalankan: npm install\n' +
        '• Pastikan better-sqlite3 terpasang\n' +
        '• Port 8080 kosong?\n' +
        '• Folder project tidak di-read-only'
    });
    stopStaticServer();
    dbApi.closeDatabase();
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot);

  app.on('window-all-closed', () => {
    stopStaticServer();
    dbApi.closeDatabase();
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    stopStaticServer();
    dbApi.closeDatabase();
  });
}
