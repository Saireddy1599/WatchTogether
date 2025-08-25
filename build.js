// Minimal build script: copy static files into dist/
// Keeps things simple so `npm run build` produces a deployable `dist` folder

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const items = fs.readdirSync(srcDir);
  items.forEach(item => {
    const src = path.join(srcDir, item);
    const dest = path.join(destDir, item);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDir(src, dest);
    } else {
      copyFile(src, dest);
    }
  });
}

// Clean dist
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

// Copy top-level static files
const filesToCopy = ['index.html', 'style.css', 'app.js', 'config.js', 'firebase-config.js', 'firebase-client.js', 'VideoPlayer.jsx', 'Room.jsx'];
filesToCopy.forEach(f => {
  const src = path.join(root, f);
  if (fs.existsSync(src)) copyFile(src, path.join(dist, f));
});

// Copy tests/ (not necessary but harmless)
copyDir(path.join(root, 'tests'), path.join(dist, 'tests'));

console.log('Built dist/');
