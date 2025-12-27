import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Actor, log } from 'apify';

export function compareImages(imgBuffer1, imgBuffer2) {
    if (!imgBuffer1 || !imgBuffer2) {
        throw new Error('Missing image buffers for comparison.');
    }

    const img1 = PNG.sync.read(imgBuffer1);
    const img2 = PNG.sync.read(imgBuffer2);
    const { width, height } = img1;

    // Crop to the intersection of both images
    const minWidth = Math.min(img1.width, img2.width);
    const minHeight = Math.min(img1.height, img2.height);

    if (img1.width !== img2.width || img1.height !== img2.height) {
        log.warning(`Image dimensions mismatch (Old: ${img1.width}x${img1.height}, New: ${img2.width}x${img2.height}). Cropping to ${minWidth}x${minHeight} for comparison.`);
    }

    const diff = new PNG({ width: minWidth, height: minHeight });

    const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
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
