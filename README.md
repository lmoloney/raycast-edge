<p align="center">
    <img src="./assets/microsoft-edge-icon.png" width="150" height="150" />
</p>

# Microsoft Edge Extension

Quick access to [Microsoft Edge](https://www.microsoft.com/edge/) - _the AI-powered browser_.

## 🚀 Features
- Open new tabs
- Pin up to 5 Edge profiles (across Stable, Dev, Beta, and Canary) for quick opening from Raycast root search
- Search and jump to currently open tabs
- Search and open tabs from search query based on browser history across all profiles
- Search and open tabs from search query based on bookmarks across all profiles
- Directly copy the URL of the Topmost Active tab

## 🗒️ Notes

1. Pinned profile commands are implemented with 5 static slots because Raycast command definitions are static in the manifest.

2. Open profile support is limited by the Microsoft Edge automation API. The extension uses best-effort profile targeting and window reuse.

3. If you are using `Default` mode and have multiple profiles open in parallel, the tab will open in the topmost window.

> These are due to limitations in the Microsoft Edge API.

## 💪 Supported

<img src="./assets/edge-beta.png" width="100" height="100" />
<img src="./assets/edge-canary.png" width="100" height="100" />
<img src="./assets/edge-dev.png" width="100" height="100" />
<img src="./assets/microsoft-edge-icon.png" width="100" height="100" />
