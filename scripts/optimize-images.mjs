import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

const TARGET_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const RESPONSIVE_WIDTHS = [480, 768, 1024, 1600];
const CONCURRENCY = 2;

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function withoutExt(filePath) {
  const ext = path.extname(filePath);
  return filePath.slice(0, -ext.length);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeRasterImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!TARGET_EXTENSIONS.has(ext)) return { skipped: true };

    const relative = toPosix(path.relative(PUBLIC_DIR, filePath));
    const base = withoutExt(filePath);

    // If we've already produced modern formats and responsive variants, skip.
    // This makes the script safe to rerun and avoids long re-processing passes.
    const [hasWebp, hasAvif] = await Promise.all([
      fileExists(`${base}.webp`),
      fileExists(`${base}.avif`),
    ]);
    const responsiveDir = path.join(
      PUBLIC_DIR,
      "_responsive",
      path.dirname(relative),
    );
    const hasResponsiveDir = await fileExists(responsiveDir);
    if (hasWebp && hasAvif && hasResponsiveDir) return { skipped: true };

    const input = sharp(filePath, { failOn: "none" }).rotate();
    const meta = await input.metadata();

    // Skip obviously invalid images
    if (!meta.width || !meta.height) return { skipped: true };

    // 1) Recompress the original in-place (keeps URLs stable)
    //    - jpeg: mozjpeg + progressive
    //    - png: palette/quantization where possible
    if (ext === ".jpg" || ext === ".jpeg") {
      const tempPath = `${filePath}.tmp`;
      await input
        .jpeg({ quality: 80, mozjpeg: true, progressive: true })
        .toFile(tempPath);
      await fs.rename(tempPath, filePath);
    } else if (ext === ".png") {
      const tempPath = `${filePath}.tmp`;
      await input.png({ compressionLevel: 9, palette: true }).toFile(tempPath);
      await fs.rename(tempPath, filePath);
    }

    // 2) Emit modern formats next to original (for non-Next consumers like OG scrapers)
    await Promise.all([
      sharp(filePath, { failOn: "none" })
        .rotate()
        .webp({ quality: 78 })
        .toFile(`${base}.webp`),
      sharp(filePath, { failOn: "none" })
        .rotate()
        .avif({ quality: 50 })
        .toFile(`${base}.avif`),
    ]);

    // 3) Responsive variants (webp + avif) under public/_responsive/<relative-dir>/
    await ensureDir(responsiveDir);

    const variantJobs = [];
    for (const width of RESPONSIVE_WIDTHS) {
      if (width >= meta.width) continue;
      const nameWithoutExt = path.basename(base);
      const targetBase = path.join(responsiveDir, `${nameWithoutExt}-w${width}`);
      variantJobs.push(
        sharp(filePath, { failOn: "none" })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(`${targetBase}.webp`),
      );
      variantJobs.push(
        sharp(filePath, { failOn: "none" })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .avif({ quality: 50 })
          .toFile(`${targetBase}.avif`),
      );
    }

    await Promise.all(variantJobs);

    return {
      skipped: false,
      relativePath: relative,
      originalBytes: meta.size ?? null,
    };
  } catch (err) {
    console.warn(`Skipping unsupported/corrupt image: ${filePath}`);
    if (process.env.DEBUG_IMAGE_OPTIMIZE) console.warn(err);
    return { skipped: true };
  }
}

async function main() {
  const allFiles = [];
  for await (const filePath of walk(PUBLIC_DIR)) {
    // Ignore Next/static internals and sitemap artifacts
    if (filePath.includes(path.join(PUBLIC_DIR, "_responsive"))) continue;
    if (filePath.endsWith(".xml") || filePath.endsWith(".txt") || filePath.endsWith(".svg")) continue;

    allFiles.push(filePath);
  }

  let optimizedCount = 0;
  let processed = 0;

  while (processed < allFiles.length) {
    const batch = allFiles.slice(processed, processed + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(optimizeRasterImage));
    for (const res of batchResults) {
      if (!res.skipped) optimizedCount += 1;
    }
    processed += batch.length;

    if (processed % 10 === 0 || processed === allFiles.length) {
      console.log(`Processed ${processed}/${allFiles.length} — optimized ${optimizedCount}`);
    }
  }

  console.log(`Done. Optimized ${optimizedCount} image(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

