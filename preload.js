/**
 * Preload — jembatan aman antara renderer (HTML/JS game) dan main process.
 * Renderer TIDAK punya akses Node; hanya API yang diekspos di sini.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hlhAPI', {
  // Auth
  register: (payload) => ipcRenderer.invoke('auth:register', payload),
  login: (payload) => ipcRenderer.invoke('auth:login', payload),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),

  // Progress (per akun, SQLite)
  saveProgress: (payload) => ipcRenderer.invoke('progress:save', payload),
  loadProgress: () => ipcRenderer.invoke('progress:load'),

  // Util
  isElectron: true
});
