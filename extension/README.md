# Drug Expiry Tracker Chrome Extension

A smart Chrome extension that monitors all input fields across websites and alerts you when you type drug names that are expired or expiring soon.

## Features

- 🔍 **Real-time Monitoring**: Automatically monitors all input fields on every webpage
- ⚠️ **Smart Alerts**: Toast notifications for expired or expiring drugs
- 📊 **Dashboard**: Built-in popup with drug inventory management
- 💊 **CRUD Operations**: Add, edit, and delete drugs from the popup
- 📈 **Statistics**: Quick overview of total, expired, expiring, and safe drugs
- 💾 **Local Storage**: All data stored locally in Chrome storage

## Installation

### From GitHub Actions (Recommended)

1. Go to the [Actions tab](../../actions) in this repository
2. Click on the latest successful "Build Chrome Extension" workflow
3. Download the `drug-expiry-tracker-extension` artifact
4. Unzip the downloaded file
5. Open Chrome and go to `chrome://extensions/`
6. Enable "Developer mode" in the top right
7. Click "Load unpacked" and select the unzipped `extension` folder

### Manual Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `extension` folder from this repository

## Usage

### Managing Drugs

1. Click the extension icon in your Chrome toolbar
2. View your drug inventory with expiry status
3. Click "Add" to add new drugs
4. Click the edit icon to modify existing drugs
5. Click the delete icon to remove drugs

### Real-time Monitoring

The extension automatically monitors all text inputs on every webpage. When you type:

- **3+ characters** that match a drug name in your inventory
- If the drug is **expired** or **expiring soon** (within 90 days)
- A toast notification will appear in the top-right corner

### Status Indicators

- 🔴 **Expired**: Drug has passed its expiry date
- 🟡 **Expiring Soon**: Drug expires within 90 days
- 🟢 **Safe**: Drug has more than 90 days until expiry

## Development

### Project Structure

```
extension/
├── manifest.json      # Extension manifest (v3)
├── background.js      # Service worker for data management
├── content.js         # Content script for input monitoring
├── content.css        # Styles for toast notifications
├── popup.html         # Extension popup interface
├── popup.css          # Popup styles
├── popup.js           # Popup functionality
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

### Building

The GitHub Actions workflow automatically:

1. Converts SVG icons to PNG
2. Validates manifest.json
3. Creates a ZIP file ready for Chrome Web Store upload
4. Uploads the ZIP as an artifact

To trigger a build, push changes to the `extension/` folder.

### Creating a Release

1. Tag your commit: `git tag v1.0.0`
2. Push the tag: `git push origin v1.0.0`
3. The workflow will automatically create a GitHub release with the ZIP attached

## Default Drugs

The extension comes pre-loaded with sample drugs for demonstration:

- Amoxicillin (Expired)
- Paracetamol
- Ibuprofen
- Metformin (Expiring)
- Lisinopril

## Privacy

All data is stored locally in your browser using Chrome's storage API. No data is sent to external servers.

## License

MIT License - feel free to modify and distribute.
