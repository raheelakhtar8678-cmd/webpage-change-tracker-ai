import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Actor, log } from 'apify';

export function compareImages(imgBuffer1, imgBuffer2) {
    if (!imgBuffer1 || !imgBuffer2) {
        throw new Error('Missing image buffers for comparison.');
    }

    const img1 = PNG.sync.read(imgBuffer1);
    const img2 = PNG.sync.read(imgBuffer2);

    const minWidth = Math.min(img1.width, img2.width);
    const minHeight = Math.min(img1.height, img2.height);

    if (img1.width !== img2.width || img1.height !== img2.height) {
        log.warning(`Image dimensions mismatch (Old: ${img1.width}x${img1.height}, New: ${img2.width}x${img2.height}). Cropping to ${minWidth}x${minHeight} for comparison.`);
    }

    // Create new buffers for the overlapping region
    const img1DataCropped = Buffer.alloc(minWidth * minHeight * 4);
    const img2DataCropped = Buffer.alloc(minWidth * minHeight * 4);

    for (let y = 0; y < minHeight; y++) {
        const sourceOffset1 = (y * img1.width) * 4;
        const sourceOffset2 = (y * img2.width) * 4;
        const targetOffset = (y * minWidth) * 4;

        img1.data.copy(img1DataCropped, targetOffset, sourceOffset1, sourceOffset1 + (minWidth * 4));
        img2.data.copy(img2DataCropped, targetOffset, sourceOffset2, sourceOffset2 + (minWidth * 4));
    }

    const diff = new PNG({ width: minWidth, height: minHeight });

    const numDiffPixels = pixelmatch(
        img1DataCropped,
        img2DataCropped,
        diff.data,
        minWidth,
        minHeight,
        { threshold: 0.1 }
    );

    return {
        diffBuffer: PNG.sync.write(diff),
        pixelCount: numDiffPixels
    };
}
