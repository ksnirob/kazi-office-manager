/**
 * Generates simple placeholder SVG icons for PWA manifest.
 * Run once: node scripts/generate-icons.mjs
 * For production, replace with proper designed icons.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#4f46e5"/>
  <text x="50%" y="55%" font-family="sans-serif" font-size="${Math.round(size * 0.45)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">৳</text>
</svg>`;
  writeFileSync(join(outDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
}
console.log("Done! Replace SVGs with PNGs for full PWA support.");
