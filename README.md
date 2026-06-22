# Helping Hands

A real-time AI assistant that provides contextual help during video calls, interviews, presentations, and meetings using screen capture and audio analysis.

---

## Prerequisites

| Requirement                 | Details                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| Node.js                     | v18 or later ([download](https://nodejs.org/))                         |
| npm                         | Comes with Node.js                                                     |
| Gemini API key              | Get one free at [Google AI Studio](https://aistudio.google.com/apikey) |
| Screen recording permission | Required for screen capture                                            |
| Microphone permission       | Required for audio capture                                             |

---

## Platform-Specific Setup

### macOS

1. Install Node.js (via [Homebrew](https://brew.sh/) or [官网下载](https://nodejs.org/)):

```bash
# Using Homebrew
brew install node
```

2. Clone and install:

```bash
git clone https://github.com/rajurathod0577/helping-hands.git
cd helping-hands
npm install
```

3. Run the app:

```bash
npm start
```

4. When prompted, grant **Screen Recording** and **Microphone** permissions in:
    > System Settings > Privacy & Security > Screen Recording
    > System Settings > Privacy & Security > Microphone

> **Note**: System audio capture uses [SystemAudioDump](https://github.com/Mohammed-Yasin-Mulla/Sound). You may need to install it separately if system audio capture is not working.

---

### Windows

1. Install Node.js from the [official website](https://nodejs.org/) or via [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):

```powershell
winget install OpenJS.NodeJS.LTS
```

2. Clone and install:

```powershell
git clone https://github.com/rajurathod0577/helping-hands.git
cd helping-hands
npm install
```

3. Run the app:

```powershell
npm start
```

4. When prompted, grant **Microphone** and **Screen Capture** permissions.

> **Note**: Windows uses loopback audio capture for system audio. No additional drivers are required.

---

### Linux

1. Install Node.js (via [nvm](https://github.com/nvm-sh/nvm) or your package manager):

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18

# Or using apt (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm
```

2. Clone and install:

```bash
git clone https://github.com/rajurathod0577/helping-hands.git
cd helping-hands
npm install
```

3. Run the app:

```bash
npm start
```

4. Grant microphone permissions when prompted.

> **Note**: Linux uses microphone input only. System audio capture is not supported yet.

---

## Getting API Keys

### Gemini API Key (Required for BYOK mode)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and paste it in the app

### Groq API Key (Optional)

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up or log in
3. Click **Create API Key**
4. Copy the key and paste it in the app under settings

---

## Usage

1. Launch the app with `npm start`
2. Enter your API key in the main window (Gemini or Groq)
3. Select a profile (Interview, Sales Call, Meeting, etc.)
4. Click **Start Session**
5. Position the overlay window using keyboard shortcuts
6. The AI provides real-time help based on your screen and audio

---

## Keyboard Shortcuts

| Shortcut                | Action                        |
| ----------------------- | ----------------------------- |
| `Ctrl/Cmd + Arrow Keys` | Move the overlay window       |
| `Ctrl/Cmd + M`          | Toggle click-through mode     |
| `Ctrl/Cmd + \`          | Close or go back              |
| `Enter`                 | Send a text message to the AI |

---

## Troubleshooting

| Issue                   | Solution                                                                  |
| ----------------------- | ------------------------------------------------------------------------- |
| App does not start      | Ensure Node.js v18+ is installed: `node --version`                        |
| No system audio         | macOS: install SystemAudioDump; Windows: check loopback audio settings    |
| Microphone not detected | Grant microphone permission in OS settings                                |
| Screen capture blank    | Grant screen recording permission in OS settings                          |
| API key error           | Verify your key at [Google AI Studio](https://aistudio.google.com/apikey) |
