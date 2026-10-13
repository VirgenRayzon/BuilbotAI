const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <!-- Dark Background Circle -->
    <circle cx="32" cy="32" r="29" fill="#071322" stroke="#22d3ee" stroke-width="2.5" />
    
    <!-- Centered Lucide Bot Icon -->
    <g transform="translate(16, 16) scale(1.3333)" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </g>
  </svg>`;
}

async function generateIcons() {
  const rootDir = process.cwd();
  const svgContent = createSvg(64);

  // Write icon.svg
  fs.writeFileSync(path.join(rootDir, 'src/app/icon.svg'), svgContent, 'utf8');

  // Generate PNGs at multiple sizes for crisp rendering across resolutions
  const png16 = await sharp(Buffer.from(createSvg(16))).png().toBuffer();
  const png32 = await sharp(Buffer.from(createSvg(32))).png().toBuffer();
  const png48 = await sharp(Buffer.from(createSvg(48))).png().toBuffer();
  const png64 = await sharp(Buffer.from(createSvg(64))).png().toBuffer();

  // Also write an Apple touch icon / standard icon in src/app
  fs.writeFileSync(path.join(rootDir, 'src/app/apple-icon.png'), await sharp(Buffer.from(createSvg(180))).png().toBuffer());

  function createIco(images) {
    const numImages = images.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // 1 = ICO
    header.writeUInt16LE(numImages, 4);

    let offset = 6 + (16 * numImages);
    const directoryEntries = [];

    for (const img of images) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
      entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
      entry.writeUInt8(0, 2); // palette
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(img.data.length, 8); // image size
      entry.writeUInt32LE(offset, 12); // image offset

      directoryEntries.push(entry);
      offset += img.data.length;
    }

    return Buffer.concat([header, ...directoryEntries, ...images.map(img => img.data)]);
  }

  const icoBuffer = createIco([
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
    { width: 48, height: 48, data: png48 },
    { width: 64, height: 64, data: png64 },
  ]);

  fs.writeFileSync(path.join(rootDir, 'src/app/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(rootDir, 'public/favicon.ico'), icoBuffer);
  console.log('Successfully generated favicon.ico, icon.svg, and apple-icon.png');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
