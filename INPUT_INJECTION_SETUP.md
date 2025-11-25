# Input Injection Setup Guide

The remote control feature uses `robotjs` for cross-platform input injection. This requires native compilation and system dependencies.

## System Dependencies

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  libxtst6 \
  libpng++-dev \
  libxtst-dev \
  libpng-dev \
  libx11-dev \
  build-essential \
  python3
```

### Linux (Fedora/CentOS/RHEL)
```bash
sudo dnf install -y \
  libXtst \
  libXtst-devel \
  libpng-devel \
  libX11-devel \
  gcc-c++ \
  make \
  python3
```

### macOS
```bash
xcode-select --install
```

### Windows
No additional dependencies required. Visual Studio Build Tools may be needed if you get compilation errors.

## Installation Steps

1. **Install system dependencies** (see above for your platform)

2. **Install npm dependencies:**
   ```bash
   cd electron-app
   npm install
   ```

3. **Rebuild native modules for Electron:**
   ```bash
   npm run postinstall
   # Or manually:
   npx electron-rebuild -f -w robotjs
   ```

## Troubleshooting

### Linux: "X11/extensions/XTest.h: No such file or directory"
- Install the X11 development packages (see system dependencies above)

### Build errors on Electron rebuild
- Make sure you have the correct Python version (Python 3.x)
- Ensure build tools are installed (gcc, make, etc.)
- Try: `npm run postinstall`

### Runtime errors
- On Linux, ensure the app has necessary permissions
- Some distributions may require additional X11 permissions

## Alternative: Using Pre-built Binaries

If compilation fails, you can try using a pre-built fork:
```bash
npm install @codeporter/robotjs
```

Then update the import in `src/main/main.ts`:
```typescript
import * as robot from '@codeporter/robotjs';
```

## Verification

To test if input injection is working:
1. Start the app
2. Share your screen
3. Connect from another client
4. Try moving the mouse and typing on the remote screen
