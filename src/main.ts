import { app, BrowserWindow, ipcMain, screen, IpcMainEvent } from 'electron';
import path from 'path';
import fs from 'fs';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let fileWatcher: fs.FSWatcher | null = null;
let mainWindow: BrowserWindow | null = null;
let currentContent = '';
let targetFilePath = '';
const statusFilePath: string = path.join(app.getPath('userData'), 'current_status.json');

function updateStatusFile(filePath: string): void {
  fs.writeFileSync(statusFilePath, JSON.stringify({ editingFile: filePath }), 'utf-8');
}

function handleArgs(args: string[]): boolean {
  if (args.includes('--status') || args.includes('status')) {
    if (fs.existsSync(statusFilePath)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
        process.stdout.write(status.editingFile + '\n');
      } catch (e) {
        process.stdout.write('None\n');
      }
    } else {
      process.stdout.write('None\n');
    }
    app.quit();
    return true;
  }
  return false;
}

function loadAndWatchFile(filePath: string): void {
  if (fileWatcher) {
  fileWatcher.close();
  fileWatcher = null;
  }
  if (targetFilePath) {
  fs.unwatchFile(targetFilePath);
  }
  
  targetFilePath = filePath;
  updateStatusFile(targetFilePath);
  
  if (targetFilePath && fs.existsSync(targetFilePath)) {
  currentContent = fs.readFileSync(targetFilePath, 'utf-8');
  mainWindow?.webContents.send('file-loaded', currentContent);
  
  const setupWatcher = () => {
    try {
      fileWatcher = fs.watch(targetFilePath, (eventType) => {
        setTimeout(() => {
          if (fs.existsSync(targetFilePath)) {
            try {
              const newContent = fs.readFileSync(targetFilePath, 'utf-8');
              if (newContent !== currentContent) {
                currentContent = newContent;
                mainWindow?.webContents.send('file-changed', currentContent);
              }
            } catch (e) {
              // 忽略系统瞬间的文件锁定错误
            }
          }
  
          if (eventType === 'rename') {
            fileWatcher?.close();
            setupWatcher(); 
          }
        }, 50);
      });
    } catch (e) {
      console.error('File watch error:', e);
    }
  };
  
  setupWatcher();
  } else {
  currentContent = '';
  mainWindow?.webContents.send('file-loaded', '');
  }
}

function positionWindow(position: string): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const windowWidth = Math.floor(width / 5);
  const margin = 40;
  const windowHeight = height - (margin * 2);
  
  let xPos = 0;
  if (position === 'right') {
    xPos = width - windowWidth;
  }
  
  if (mainWindow) {
    mainWindow.setBounds({
      x: xPos,
      y: margin,
      width: windowWidth,
      height: windowHeight
    });
  }
}

function createOrUpdateWindow(args: string[]): void {
  const filePath = args[0] || '';
  const position = args[1] || 'left';

  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: true,
      resizable: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
      if (fs.existsSync(statusFilePath)) {
        fs.unlinkSync(statusFilePath);
      }
    });
  }

  positionWindow(position);

  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.on('did-finish-load', () => {
      loadAndWatchFile(filePath);
    });
  } else {
    loadAndWatchFile(filePath);
  }
  
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

function getArgs(): string[] {
  const args: string[] = app.isPackaged ? process.argv.slice(1) : process.argv.slice(2);
  
  if (process.env.NOTE_PANEL_FILE) {
    const envArgs = [process.env.NOTE_PANEL_FILE];
    if (process.env.NOTE_PANEL_POS) {
      envArgs.push(process.env.NOTE_PANEL_POS);
    }
    return envArgs;
  }
  
  return args;
}

const initialArgs: string[] = getArgs();

if (!handleArgs(initialArgs)) {
  const gotLock = app.requestSingleInstanceLock();

  if (!gotLock) {
    app.quit();
  } else {
    app.on('second-instance', (event: Electron.Event, commandLine: string[]) => {
      const secondArgs = app.isPackaged ? commandLine.slice(1) : commandLine.slice(2);
      if (!handleArgs(secondArgs)) {
        createOrUpdateWindow(secondArgs);
      }
    });

    app.on('ready', () => {
      createOrUpdateWindow(initialArgs);
    });
  }
}

ipcMain.on('save-file', (_: IpcMainEvent, newContent: string) => {
  if (targetFilePath && currentContent !== newContent) {
    currentContent = newContent;
    fs.writeFileSync(targetFilePath, currentContent, 'utf-8');
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});