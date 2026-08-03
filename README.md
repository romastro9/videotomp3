# VideoToMP3

A polished Apple-inspired MP4-to-MP3 converter that runs entirely inside the user's browser.

## Live website

https://romastro9.github.io/videotomp3/

## Main features

- Drag-and-drop MP4 selection
- Private browser-side conversion with FFmpeg WebAssembly
- MP3 quality presets: 128, 192, 256, and 320 kbps
- Rename the downloaded MP3 file
- Optional start and end trimming
- Optional loudness normalization
- Real-time conversion progress
- Conversion cancellation
- MP3 preview and direct download
- Khmer and English interface
- Light and dark modes
- Responsive Apple-inspired layout
- Apple-style outline icons and rounded controls
- Maximum selectable file size: 500 MB

## Privacy

This project does not use:

- A database
- User accounts
- Cookies
- Analytics
- Local storage
- Upload APIs
- Conversion history
- Permanent media storage

The selected MP4 and generated MP3 remain in temporary browser memory. Media is not uploaded to the website server. Resetting the converter, refreshing the page, or closing the tab clears the session data.

The FFmpeg application files are loaded from jsDelivr when conversion is first used. Only the converter code is downloaded; the user's video is not sent to the CDN.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- FFmpeg WebAssembly `0.11.6`
- GitHub Pages

## Project structure

```text
videotomp3/
├── .github/workflows/pages.yml
├── .nojekyll
├── app.js
├── favicon.svg
├── index.html
├── README.md
└── styles.css
```

## Run locally

A local web server is recommended because FFmpeg WebAssembly loads browser resources dynamically.

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Deployment

The GitHub Actions workflow in `.github/workflows/pages.yml` deploys every push to the `main` branch.

When enabling GitHub Pages for the first time:

1. Open repository **Settings**.
2. Open **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and run the Pages workflow if it has not started automatically.

## Browser notes

- Chrome, Edge, Firefox, and Safari are recommended.
- Conversion speed depends on the user's processor and available memory.
- Very large videos can be slower or fail on low-memory mobile devices.
- An internet connection is required the first time the FFmpeg engine is loaded.
