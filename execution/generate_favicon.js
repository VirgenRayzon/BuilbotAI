const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const rootDir = process.cwd();
  const emblemPath = path.join(rootDir, 'public/netcodex-emblem.png');

  if (!fs.existsSync(emblemPath)) {
    throw new Error(`Emblem not found at ${emblemPath}`);
  }

  // Generate crisp PNGs at standard sizes
  const png16 = await sharp(emblemPath).resize(16, 16).png().toBuffer();
  const png32 = await sharp(emblemPath).resize(32, 32).png().toBuffer();
  const png48 = await sharp(emblemPath).resize(48, 48).png().toBuffer();
  const png64 = await sharp(emblemPath).resize(64, 64).png().toBuffer();
  const png180 = await sharp(emblemPath).resize(180, 180).png().toBuffer();

  // Write apple-icon.png
  fs.writeFileSync(path.join(rootDir, 'src/app/apple-icon.png'), png180);

  // Write icon.svg using crisp embedded data URI
  const base64Png64 = png64.toString('base64');
  const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${base64Png64}" width="64" height="64" />
</svg>`;
  fs.writeFileSync(path.join(rootDir, 'src/app/icon.svg'), svgContent, 'utf8');

  // Multi-resolution ICO builder
  function createIco(images) {
    const numImages = images.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // 1 = ICO
    header.writeUInt16LE(numImages, 4);

    let offset = 6 + 16 * numImages;
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

    return Buffer.concat([header, ...directoryEntries, ...images.map((img) => img.data)]);
  }

  const icoBuffer = createIco([
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
    { width: 48, height: 48, data: png48 },
    { width: 64, height: 64, data: png64 },
  ]);

  fs.writeFileSync(path.join(rootDir, 'src/app/favicon.ico'), icoBuffer);
  console.log('Successfully generated favicon.ico, icon.svg, and apple-icon.png with Netcodex emblem.');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
