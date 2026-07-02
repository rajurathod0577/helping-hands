#!/usr/bin/env node
/*
 * Generate the app icon set (logo.png / logo.ico / logo.icns) from a single
 * source image, so the icon matches the real brand artwork.
 *
 * Usage:
 *   node scripts/gen-icons.cjs
 *     -> uses src/assets/source-logo.{png,jpg,jpeg,webp} if present,
 *        otherwise falls back to src/assets/logo.svg
 *
 *   CROP="left,top,width,height" node scripts/gen-icons.cjs
 *     -> first crops that pixel box out of the source (use when you saved the
 *        full marketing composite and want just the handshake tile)
 *
 *   LOGO_SRC=path/to/file.png node scripts/gen-icons.cjs
 *     -> explicit source path
 *
 *   MARGIN=0.04 node scripts/gen-icons.cjs
 *     -> transparent padding around the glyph (fraction of the square, default 0)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'src/assets');

function resolveSource() {
    if (process.env.LOGO_SRC) return path.resolve(ROOT, process.env.LOGO_SRC);
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        const p = path.join(ASSETS, `source-logo.${ext}`);
        if (fs.existsSync(p)) return p;
    }
    return path.join(ASSETS, 'logo.svg'); // fallback: hand-drawn vector
}

// Pack PNG buffers into a Windows .ico (PNG-embedded, 32bpp).
function buildIco(entries) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(entries.length, 4);
    const dir = [];
    const imgs = [];
    let offset = 6 + entries.length * 16;
    for (const { size, buffer } of entries) {
        const e = Buffer.alloc(16);
        e.writeUInt8(size >= 256 ? 0 : size, 0);
        e.writeUInt8(size >= 256 ? 0 : size, 1);
        e.writeUInt16LE(1, 4);
        e.writeUInt16LE(32, 6);
        e.writeUInt32LE(buffer.length, 8);
        e.writeUInt32LE(offset, 12);
        offset += buffer.length;
        dir.push(e);
        imgs.push(buffer);
    }
    return Buffer.concat([header, ...dir, ...imgs]);
}

(async () => {
    const SRC = resolveSource();
    if (!fs.existsSync(SRC)) {
        console.error(`Source not found: ${SRC}`);
        process.exit(1);
    }
    console.log(`source: ${path.relative(ROOT, SRC)}`);

    const isSvg = SRC.toLowerCase().endsWith('.svg');
    let base = sharp(SRC, isSvg ? { density: 384 } : {});

    // Optional crop of a region out of a larger composite.
    if (process.env.CROP) {
        const [left, top, width, height] = process.env.CROP.split(',').map(n => parseInt(n.trim(), 10));
        console.log(`crop: ${left},${top} ${width}x${height}`);
        base = base.extract({ left, top, width, height });
    }

    const margin = Math.max(0, Math.min(0.3, parseFloat(process.env.MARGIN || '0')));
    const inner = Math.round(1024 * (1 - margin * 2));

    // Master 1024 square, glyph fit inside, transparent padding.
    const glyph = await base
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    const master = await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([{ input: glyph, gravity: 'center' }])
        .png()
        .toBuffer();

    const png = size => sharp(master).resize(size, size, { kernel: 'lanczos3' }).png().toBuffer();

    // logo.png (512)
    fs.writeFileSync(path.join(ASSETS, 'logo.png'), await png(512));

    // logo.ico (multi-size)
    const icoSizes = [16, 24, 32, 48, 64, 128, 256];
    const icoEntries = [];
    for (const s of icoSizes) icoEntries.push({ size: s, buffer: await png(s) });
    fs.writeFileSync(path.join(ASSETS, 'logo.ico'), buildIco(icoEntries));

    // logo.icns via iconutil (macOS)
    const iconset = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-iconset-')) + '/logo.iconset';
    fs.mkdirSync(iconset, { recursive: true });
    const map = [
        ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
        ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
        ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
        ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
        ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
    ];
    for (const [name, s] of map) fs.writeFileSync(path.join(iconset, name), await png(s));
    try {
        execSync(`iconutil -c icns "${iconset}" -o "${path.join(ASSETS, 'logo.icns')}"`);
        console.log('logo.icns  ✓ (iconutil)');
    } catch (e) {
        console.warn('iconutil failed (macOS only) — logo.png and logo.ico still written.');
    }

    console.log('logo.png   ✓ 512x512');
    console.log('logo.ico   ✓ 16→256');
    console.log('Done.');
})().catch(e => {
    console.error(e);
    process.exit(1);
});
