const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  
  // Hard hat shape
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.6;
  
  ctx.fillStyle = '#0b0f1a';
  
  // Brim
  ctx.fillRect(cx - s/2, cy + s*0.15, s, s*0.12);
  
  // Hat dome
  ctx.beginPath();
  ctx.arc(cx, cy - s*0.05, s*0.38, Math.PI, 0);
  ctx.fill();
  
  // Center ridge
  ctx.fillRect(cx - s*0.06, cy - s*0.4, s*0.12, s*0.35);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icons/icon-${size}.png`, buffer);
  console.log(`Created icon-${size}.png`);
}

createIcon(192);
createIcon(512);