# VideoToMP3

A complete Apple-inspired MP4-to-MP3 converter that processes videos directly in the browser.

## Live website

After GitHub Pages finishes deploying:

**https://romastro9.github.io/videotomp3/**

## Features

- Drag-and-drop MP4 upload
- Private browser-side conversion with FFmpeg WebAssembly
- MP3 quality: 128, 192, 256, and 320 kbps
- Rename the output file
- Trim beginning and ending times
- Optional volume normalization
- Conversion progress and cancellation
- MP3 preview and download
- Khmer and English interface
- Light and dark modes
- Responsive Apple-inspired design
- Maximum file size: 500 MB

## Privacy

Files are processed on the user's device. The website does not upload videos to a server or store converted media.

## Run locally

Use a local web server because the FFmpeg WebAssembly engine is loaded through the browser.

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deployment

The workflow at `.github/workflows/pages.yml` deploys every push to the `main` branch using GitHub Pages.

For a new repository, GitHub may require opening **Settings → Pages** and selecting **GitHub Actions** once.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- FFmpeg WebAssembly
- GitHub Pages

## License

MIT
