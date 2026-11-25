const fs = require('fs');
const path = require('path');

console.log('Building Abacus Kids App web distribution assets...');
const wwwDir = path.join(__dirname, 'www');
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(wwwDir, 'index.html'));
if (fs.existsSync(path.join(__dirname, 'logo.jpeg'))) {
  fs.copyFileSync(path.join(__dirname, 'logo.jpeg'), path.join(wwwDir, 'logo.jpeg'));
}

console.log('Build complete! Synced index.html and logo.jpeg into www/ successfully.');
