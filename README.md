# VideoToMP3 V4

A private Apple-inspired batch video-to-audio converter that runs entirely inside the user's browser.

## Live website

https://romastro9.github.io/videotomp3/

## Input formats

- MP4
- MOV
- MKV
- AVI
- WebM
- M4V

## Output formats

- MP3
- WAV
- M4A
- AAC
- OGG
- FLAC

## V4 features

- Multi-file drag and drop
- Conversion queue with up to 25 files
- Sequential batch conversion to reduce memory use
- Individual progress and status for every file
- Retry failed or cancelled files
- Remove files from the queue
- Clear completed, failed, or cancelled items
- Individual output downloads
- Stereo or mono output
- Sample rates: 22.05, 44.1, and 48 kHz
- Bitrate control from 64 to 320 kbps
- Constant bitrate (CBR)
- Variable bitrate (VBR)
- Estimated total output size
- Same-origin FFmpeg WebAssembly engine
- Exact embedded Krasar Black web font
- Responsive Apple-inspired interface
- Light and dark modes
- Maximum file size: 500 MB per file

## Privacy

The project does not use:

- A database
- User accounts
- Cookies
- Analytics
- Local storage
- Upload APIs
- Permanent media storage
- Conversion history

Selected videos and generated audio stay in temporary browser memory. Media is never uploaded to the website server. Refreshing or closing the page clears the active session.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- FFmpeg WebAssembly `0.12.15`
- FFmpeg Core `0.12.10`
- GitHub Pages
- Krasar Black embedded as WOFF2

## Project structure

```text
videotomp3/
├── .github/workflows/pages.yml
├── assets/fonts/
├── font-parts/
├── app.js
├── batch-v4.css
├── converter-v4.js
├── favicon.svg
├── font.css
├── index.html
├── README.md
└── styles.css
```

## Deployment

The GitHub Actions workflow deploys every push to `main`.

For the first deployment:

1. Open repository **Settings**.
2. Open **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Run the Pages workflow from the **Actions** tab when needed.

## Browser notes

- Chrome and Edge are recommended for the best performance.
- Conversion speed depends on processor speed and available memory.
- Files are processed sequentially to avoid loading the full queue into FFmpeg memory at once.
- Very large files may be slower on mobile devices.
- The FFmpeg engine is bundled with the deployed site and loads on the first conversion.