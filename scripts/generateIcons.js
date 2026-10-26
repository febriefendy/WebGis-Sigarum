const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Creates a minimal valid uncompressed RGBA PNG file
 */
function createMinimalPNG(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw Image Data (Scanline filter 0 + RGBA pixels)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Simple gradient
      const factor = (x + y) / (width + height);
      rawData[pixelOffset] = Math.round(r * (1 - factor * 0.3));     // R
      rawData[pixelOffset + 1] = Math.round(g * (1 - factor * 0.2)); // G
      rawData[pixelOffset + 2] = Math.round(b * (1 - factor * 0.1)); // B
      rawData[pixelOffset + 3] = 255;                                // A
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Ocean blue #0284c7 (2, 132, 199)
const png192 = createMinimalPNG(192, 192, 2, 132, 199);
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png192);

const png512 = createMinimalPNG(512, 512, 2, 132, 199);
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png512);

console.log('PWA PNG icons generated successfully: icon-192.png, icon-512.png');
