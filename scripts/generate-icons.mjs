import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// Devektro "D" icon SVG — bold D on a blue rounded-rect background
const createSvg = (size) => {
  const fontSize = Math.round(size * 0.6);
  const radius = Math.round(size * 0.18);
  const dy = Math.round(fontSize * 0.36);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#1d4ed8"/>
  <text x="50%" y="50%" dy="${dy}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#ffffff">D</text>
</svg>`;
};

// Also create a favicon SVG
const faviconSvg = createSvg(32);
writeFileSync(resolve(publicDir, "favicon.svg"), faviconSvg);
console.log("Created favicon.svg");

// Generate PNGs
const sizes = [192, 512];
for (const size of sizes) {
  const svg = Buffer.from(createSvg(size));
  const filename = `pwa-${size}x${size}.png`;
  await sharp(svg).resize(size, size).png().toFile(resolve(publicDir, filename));
  console.log(`Created ${filename}`);
}

// Also generate a favicon.png (32x32 for backwards compat)
const fav = Buffer.from(createSvg(128));
await sharp(fav).resize(128, 128).png().toFile(resolve(publicDir, "favicon.png"));
console.log("Created favicon.png");
