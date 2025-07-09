# WebGPU Kaleidoscope Demo

This project is a simple WebGPU-based digital kaleidoscope built with Vite. It captures video from your webcam and displays it using a kaleidoscope effect. The display page and a separate settings page are built with TypeScript.  You can switch between a circular or triangular mask and change the number of segments in the settings page.

## Development

1. Install dependencies (requires Node.js):
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open `http://localhost:5173` to view the kaleidoscope. Use `settings.html` for configuration.

## Build

```sh
npm run build
```

Static files will be output to the `dist` directory.
