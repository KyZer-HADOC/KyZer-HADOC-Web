# HADOC LocalDrop — Official Download Page

Official product page for **HADOC LocalDrop**, maintained by **KyZer_HADOC**.

🌐 Website page: `localdrop.html`

## Platforms and releases

| Platform | Latest release | Download |
|---|---:|---|
| Windows 10/11 (x64) | v1.0.4 | [HADOC-LocalDrop-Setup.exe](https://github.com/KyZer-HADOC/HADOC-LocalDrop/releases/download/v1.0.4/HADOC-LocalDrop-Setup.exe) |
| Android 10+ | v1.0.5 | [HADOC-LocalDrop-Android.apk](https://github.com/KyZer-HADOC/HADOC-LocalDrop-Android/releases/download/v1.0.5/HADOC-LocalDrop-Android.apk) |

Release pages:
- [Windows releases](https://github.com/KyZer-HADOC/HADOC-LocalDrop/releases)
- [Android releases](https://github.com/KyZer-HADOC/HADOC-LocalDrop-Android/releases)

## What is LocalDrop?

HADOC LocalDrop connects an Android phone with a Windows PC over a local Wi-Fi network. It provides QR pairing, local chat, and direct file transfer without sending file contents through cloud storage.

### Main features

- Android ↔ Windows PC sharing
- QR-based device pairing
- Temporary Android Wi-Fi connection request for PC pairing
- Direct file transfer in both directions
- Transfer progress and speed information
- Local chat in the connected workspace
- No account required

## Download statistics

The website reads GitHub Releases asset download counts directly from the GitHub REST API:

- **PC downloads** — assets from `KyZer-HADOC/HADOC-LocalDrop`
- **Android downloads** — assets from `KyZer-HADOC/HADOC-LocalDrop-Android`

The two totals are deliberately displayed separately. Counts update when the page loads and depend on GitHub's public release asset statistics. They are not estimates or manually entered numbers.

## Website assets

- App icon: `images/app/localdrop.png`
- Product page: `localdrop.html`

## Pairing overview

1. Install and open HADOC LocalDrop on Windows.
2. Enter the router Wi-Fi SSID and password in the Windows app.
3. Start LocalDrop and select the PC's router-connected network address.
4. Open the Android app and choose **Connect PC**.
5. Scan the PC QR and approve Android's system Wi-Fi connection prompt.
6. Use the connected workspace to chat and transfer files.

## Security notes

- The PC pairing QR contains the router Wi-Fi passphrase and a LocalDrop pairing token. Treat it as a secret and scan it only with a trusted phone.
- The Windows app stores the router passphrase encrypted using Windows DPAPI for the current Windows user.
- File transfers use the local network. Use a trusted private network and do not expose LocalDrop ports to the public internet.
- Android controls Wi-Fi approval; the app cannot silently join a protected network.

## Source repositories

- [Windows app source](https://github.com/KyZer-HADOC/HADOC-LocalDrop)
- [Android app source](https://github.com/KyZer-HADOC/HADOC-LocalDrop-Android)

---

© 2026 KyZer_HADOC · HADOC LocalDrop
