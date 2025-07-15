// Unified script to generate PWA icons in all standard sizes (SVG and PNG)
const fs = require('fs');
const path = require('path');

// Check for canvas dependency (needed for PNG generation)
let canvasAvailable = false;
let createCanvas;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  canvasAvailable = true;
  console.log('Canvas library found - PNG generation enabled');
} catch (error) {
  console.warn('Canvas library not found - PNG generation disabled');
  console.warn('Run "npm install canvas" to enable PNG generation');
}

// Define icon sizes needed for various platforms
const iconSizes = [
  16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512
];

// Base SVG template for icon generation
const generateSvgIcon = (size, text) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#6200ee" rx="${size / 8}" ry="${size / 8}" />
  <text x="${size / 2}" y="${size / 2}" font-family="Arial" font-size="${size / 3}" fill="white" text-anchor="middle" dominant-baseline="middle">PH</text>
  ${text ? `<text x="${size / 2}" y="${size * 0.75}" font-family="Arial" font-size="${size / 8}" fill="white" text-anchor="middle">${text}</text>` : ''}
</svg>`;

// Generate PNG podcast icon 
const generatePngIcon = (size) => {
  if (!canvasAvailable) {
    throw new Error('Canvas library not available for PNG generation');
  }
  
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#3a7bd5';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.25);
  ctx.fill();
  
  // Inner circle
  ctx.fillStyle = '#2a3f54';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Podcast wave lines
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = 'round';
  
  // Arc
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.25, 0, Math.PI);
  ctx.stroke();
  
  // Vertical lines (representing sound waves)
  const lineHeight = size * 0.3;
  const lineSpacing = size * 0.1;
  
  for (let i = 0; i < 4; i++) {
    const x = size * 0.3 + i * lineSpacing;
    const y1 = size * 0.4;
    const y2 = y1 + lineHeight - (i % 2) * lineHeight * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }
  
  return canvas.toBuffer('image/png');
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname);
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to copy existing SVG if needed
const copyExistingIcon = (sourceFile, targetFile) => {
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied existing icon: ${targetFile}`);
    return true;
  }
  return false;
};

// Generate SVG icons
console.log("\n=== Generating SVG Icons ===");
// Try to use existing create-icons.svg if available
const existingIconPath = path.join(iconsDir, 'create-icons.svg');

iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  // Try to copy existing icon
  if (copyExistingIcon(existingIconPath, iconPath)) {
    return;
  }
  
  // Generate new SVG icon
  const svgContent = generateSvgIcon(size, size.toString());
  fs.writeFileSync(iconPath, svgContent);
  console.log(`Generated SVG: ${iconPath}`);
});

// Generate maskable icon (with padding for safe area)
const maskableSize = 512;
const maskablePath = path.join(iconsDir, `maskable-icon.svg`);

// Try to copy existing icon
if (!copyExistingIcon(existingIconPath, maskablePath)) {
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maskableSize}" height="${maskableSize}" viewBox="0 0 ${maskableSize} ${maskableSize}">
    <rect width="${maskableSize}" height="${maskableSize}" fill="#6200ee" />
    <text x="${maskableSize / 2}" y="${maskableSize / 2}" font-family="Arial" font-size="${maskableSize / 4}" fill="white" text-anchor="middle" dominant-baseline="middle" style="font-weight:bold;">PH</text>
    <text x="${maskableSize / 2}" y="${maskableSize * 0.7}" font-family="Arial" font-size="${maskableSize / 12}" fill="white" text-anchor="middle">Podcast</text>
  </svg>`;

  fs.writeFileSync(maskablePath, maskableSvg);
  console.log(`Generated SVG: ${maskablePath}`);
}

// Generate PNG icons if canvas is available
if (canvasAvailable) {
  console.log("\n=== Generating PNG Icons ===");
  
  // Create a simple favicon
  const faviconSize = 32;
  fs.writeFileSync(
    path.join(iconsDir, 'favicon.ico'),
    generatePngIcon(faviconSize)
  );
  console.log(`Generated PNG: favicon.ico`);

  // Generate PNG icons for all sizes
  iconSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(iconPath, generatePngIcon(size));
    console.log(`Generated PNG: ${iconPath}`);
  });
}

console.log('\n=== Icon Generation Complete ===');
console.log('Icons have been generated in both SVG and PNG formats (when available).');
console.log('\nTo use these icons in your PWA:');
console.log('1. Update manifest.json to reference the generated icons');
console.log('2. Add favicon link in index.html');
console.log('3. For best compatibility, make sure both SVG and PNG formats are referenced\n');

// Output template for manifest.json
console.log('Sample manifest.json icon format:');
console.log(`
  "icons": [
    {
      "src": "/icons/icon-192x192.png", 
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-icon.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "maskable"
    }
  ]
`);
