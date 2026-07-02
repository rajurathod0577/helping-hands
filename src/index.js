if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createWindow, updateGlobalShortcuts } = require('./utils/window');
const { setupGeminiIpcHandlers, stopMacOSAudioCapture, sendToRenderer } = require('./utils/gemini');
const storage = require('./storage');

const geminiSessionRef = { current: null };
let mainWindow = null;

function createMainWindow() {
    mainWindow = createWindow(sendToRenderer, geminiSessionRef);
    return mainWindow;
}

app.whenReady().then(async () => {
    // Initialize storage (checks version, resets if needed)
    storage.initializeStorage();

    // App identity — show our logo as the macOS dock icon (in dev the bundle
    // otherwise shows Electron's default; packaged builds use logo.icns).
    app.setName('Helping Hands');
    if (process.platform === 'darwin' && app.dock) {
        try {
            app.dock.setIcon(require('path').join(__dirname, 'assets/logo.png'));
        } catch (e) {
            console.warn('Could not set dock icon:', e.message);
        }
    }

    // Trigger screen recording permission prompt on macOS if not already granted
    if (process.platform === 'darwin') {
        const { desktopCapturer } = require('electron');
        desktopCapturer.getSources({ types: ['screen'] }).catch(() => {});
    }

    createMainWindow();
    setupGeminiIpcHandlers(geminiSessionRef);
    setupStorageIpcHandlers();
    setupGeneralIpcHandlers();
});

app.on('window-all-closed', () => {
    stopMacOSAudioCapture();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopMacOSAudioCapture();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

function setupStorageIpcHandlers() {
    // ============ CONFIG ============
    ipcMain.handle('storage:get-config', async () => {
        try {
            return { success: true, data: storage.getConfig() };
        } catch (error) {
            console.error('Error getting config:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-config', async (event, config) => {
        try {
            storage.setConfig(config);
            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:update-config', async (event, key, value) => {
        try {
            storage.updateConfig(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error updating config:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ CREDENTIALS ============
    ipcMain.handle('storage:get-credentials', async () => {
        try {
            return { success: true, data: storage.getCredentials() };
        } catch (error) {
            console.error('Error getting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-credentials', async (event, credentials) => {
        try {
            storage.setCredentials(credentials);
            return { success: true };
        } catch (error) {
            console.error('Error setting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-api-key', async () => {
        try {
            return { success: true, data: storage.getApiKey() };
        } catch (error) {
            console.error('Error getting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-api-key', async (event, apiKey) => {
        try {
            storage.setApiKey(apiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-groq-api-key', async () => {
        try {
            return { success: true, data: storage.getGroqApiKey() };
        } catch (error) {
            console.error('Error getting Groq API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-groq-api-key', async (event, groqApiKey) => {
        try {
            storage.setGroqApiKey(groqApiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting Groq API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-openrouter-api-key', async () => {
        try {
            return { success: true, data: storage.getOpenRouterApiKey() };
        } catch (error) {
            console.error('Error getting OpenRouter API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-openrouter-api-key', async (event, openrouterApiKey) => {
        try {
            storage.setOpenRouterApiKey(openrouterApiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting OpenRouter API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-deepseek-api-key', async () => {
        try {
            return { success: true, data: storage.getDeepSeekApiKey() };
        } catch (error) {
            console.error('Error getting DeepSeek API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-deepseek-api-key', async (event, deepseekApiKey) => {
        try {
            storage.setDeepSeekApiKey(deepseekApiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting DeepSeek API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-speechmatics-api-key', async () => {
        try {
            return { success: true, data: storage.getSpeechmaticsApiKey() };
        } catch (error) {
            console.error('Error getting Speechmatics API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-speechmatics-api-key', async (event, speechmaticsApiKey) => {
        try {
            storage.setSpeechmaticsApiKey(speechmaticsApiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting Speechmatics API key:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ PREFERENCES ============
    ipcMain.handle('storage:get-preferences', async () => {
        try {
            return { success: true, data: storage.getPreferences() };
        } catch (error) {
            console.error('Error getting preferences:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-preferences', async (event, preferences) => {
        try {
            storage.setPreferences(preferences);
            return { success: true };
        } catch (error) {
            console.error('Error setting preferences:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:update-preference', async (event, key, value) => {
        try {
            storage.updatePreference(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error updating preference:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ KEYBINDS ============
    ipcMain.handle('storage:get-keybinds', async () => {
        try {
            return { success: true, data: storage.getKeybinds() };
        } catch (error) {
            console.error('Error getting keybinds:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-keybinds', async (event, keybinds) => {
        try {
            storage.setKeybinds(keybinds);
            return { success: true };
        } catch (error) {
            console.error('Error setting keybinds:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ HISTORY ============
    ipcMain.handle('storage:get-all-sessions', async () => {
        try {
            return { success: true, data: storage.getAllSessions() };
        } catch (error) {
            console.error('Error getting sessions:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-session', async (event, sessionId) => {
        try {
            return { success: true, data: storage.getSession(sessionId) };
        } catch (error) {
            console.error('Error getting session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:save-session', async (event, sessionId, data) => {
        try {
            storage.saveSession(sessionId, data);
            return { success: true };
        } catch (error) {
            console.error('Error saving session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:delete-session', async (event, sessionId) => {
        try {
            storage.deleteSession(sessionId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:delete-all-sessions', async () => {
        try {
            storage.deleteAllSessions();
            return { success: true };
        } catch (error) {
            console.error('Error deleting all sessions:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ LIMITS ============
    ipcMain.handle('storage:get-today-limits', async () => {
        try {
            return { success: true, data: storage.getTodayLimits() };
        } catch (error) {
            console.error('Error getting today limits:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ CLEAR ALL ============
    ipcMain.handle('storage:clear-all', async () => {
        try {
            storage.clearAllData();
            return { success: true };
        } catch (error) {
            console.error('Error clearing all data:', error);
            return { success: false, error: error.message };
        }
    });
}

function setupGeneralIpcHandlers() {
    ipcMain.handle('get-app-version', async () => {
        return app.getVersion();
    });

    ipcMain.handle('openrouter-fetch-models', async (event, apiKey) => {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }
            const data = await response.json();
            const models = (data.data || []).map(m => ({
                id: m.id,
                name: m.name || m.id,
                context_length: m.context_length,
                pricing: m.pricing,
            }));
            return { success: true, data: models };
        } catch (error) {
            console.error('Error fetching OpenRouter models:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('openrouter-test-model', async (event, apiKey, modelId) => {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: 'user', content: 'Say "Model works!" in exactly 3 words.' }],
                    max_tokens: 20,
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                return { success: false, error: `HTTP ${response.status}: ${err}` };
            }
            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || '';
            return { success: true, reply };
        } catch (error) {
            console.error('Error testing OpenRouter model:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('quit-application', async event => {
        try {
            stopMacOSAudioCapture();
            app.quit();
            return { success: true };
        } catch (error) {
            console.error('Error quitting application:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-external', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error opening external URL:', error);
            return { success: false, error: error.message };
        }
    });

    // Pick a résumé file and extract its text (PDF / TXT / MD) for use as interview context.
    ipcMain.handle('attach-resume-file', async () => {
        try {
            const { dialog } = require('electron');
            const fs = require('fs');
            const path = require('path');
            const result = await dialog.showOpenDialog({
                title: 'Attach résumé',
                properties: ['openFile'],
                filters: [{ name: 'Résumé', extensions: ['pdf', 'txt', 'md', 'markdown'] }],
            });
            if (result.canceled || !result.filePaths.length) {
                return { success: false, canceled: true };
            }
            const filePath = result.filePaths[0];
            const ext = path.extname(filePath).toLowerCase();
            let text = '';
            if (ext === '.pdf') {
                const pdfParse = require('pdf-parse');
                const data = await pdfParse(fs.readFileSync(filePath));
                text = data.text || '';
            } else {
                text = fs.readFileSync(filePath, 'utf8');
            }
            text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
            if (!text) {
                return { success: false, error: 'No readable text found in that file.' };
            }
            return { success: true, text, name: path.basename(filePath) };
        } catch (error) {
            console.error('Error attaching résumé:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('update-keybinds', (event, newKeybinds) => {
        if (mainWindow) {
            // Also save to storage
            storage.setKeybinds(newKeybinds);
            updateGlobalShortcuts(newKeybinds, mainWindow, sendToRenderer, geminiSessionRef);
        }
    });

    // Debug logging from renderer
    ipcMain.on('log-message', (event, msg) => {
        console.log(msg);
    });
}
