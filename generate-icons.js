const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function drawHardHat(ctx, size, bgColor, hatColor) {
  // Background with rounded corners
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.18);
  ctx.fill();

  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.62;

  ctx.fillStyle = hatColor;

  // Brim (wide flat bottom of hard hat)
  const brimY = cy + s * 0.12;
  const brimH = s * 0.13;
  const brimW = s * 0.96;
  ctx.beginPath();
  ctx.roundRect(cx - brimW / 2, brimY, brimW, brimH, brimH * 0.3);
  ctx.fill();

  // Hat dome (semicircle)
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.04, s * 0.38, Math.PI, 0, false);
  ctx.fill();

  // Center ridge / rib on top
  ctx.fillRect(cx - s * 0.055, cy - s * 0.42, s * 0.11, s * 0.38);

  // Suspension band (inner arc line) — subtle detail
  if (size >= 96) {
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = size * 0.025;
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.04, s * 0.24, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();
  }
}

function createIcon(size, filename, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const BG = '#2563eb';   // Blue
  const HAT = '#ffffff';  // White

  if (maskable) {
    // Maskable icons need safe zone — fill entire canvas with bg, scale hat down
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, size, size);

    // Draw with slightly smaller hat so it stays inside the safe zone circle
    const safeSize = size * 0.72;
    const offset = (size - safeSize) / 2;

    const tmpCanvas = createCanvas(safeSize, safeSize);
    const tmpCtx = tmpCanvas.getContext('2d');
    drawHardHat(tmpCtx, safeSize, BG, HAT);
    ctx.drawImage(tmpCanvas, offset, offset);
  } else {
    drawHardHat(ctx, size, BG, HAT);
  }

  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(iconsDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Created ${filename} (${size}×${size})`);
}

// Standard sizes
createIcon(32,  'icon-32x32.png');
createIcon(48,  'icon-48x48.png');
createIcon(72,  'icon-72x72.png');
createIcon(96,  'icon-96x96.png');
createIcon(144, 'icon-144x144.png');
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');

// Maskable variants (Android adaptive icons)
createIcon(192, 'icon-192x192-maskable.png', true);
createIcon(512, 'icon-512x512-maskable.png', true);

console.log('\nAll icons generated in public/icons/');
console.log('Run: node generate-icons.js');