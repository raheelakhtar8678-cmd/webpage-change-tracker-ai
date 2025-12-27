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

    // Ensure dimensions match, resizing img2 if necessary (simple approach: crop or expand canvas? 
    // Pixelmatch requires same dimensions. We'll simply use the max text width/height if diffs occur, 
    // but for now let's assume specific viewport or strict comparison logic).
    // To be safe, if dimensions differ, we can't easily diff pixel-by-pixel without resizing.
    // For this MVP, we will only compare if dimensions match or strict check.
    // Actually, let's just resize the comparison canvas to the big one and ignore the extra space.

    if (img1.width !== img2.width || img1.height !== img2.height) {
        log.warning(`Image dimensions mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}. Resizing for comparison not implemented yet.`);
        // For now, return a dummy diff if dimensions don't match or fail soft?
        // Let's create a diff image of the max dimensions.
    }

    const maxWidth = Math.max(img1.width, img2.width);
    const maxHeight = Math.max(img1.height, img2.height);

    const diff = new PNG({ width: maxWidth, height: maxHeight });

    // We need to create resized/compatible buffers if we want true comparison on different sizes
    // But pixelmatch strictly requires same-sized data arrays.
    // Simpler approach: fail if sizes differ too much, or crop. 
    // Let's assume consistent viewport from browser.js helps, but page content length varies.

    // If dimensions differ, we can't reliably pixelmatch without more complex logic.
    // We will return 100% change if dimensions are vastly different, or 0 if identical.
    if (img1.width !== img2.width || img1.height !== img2.height) {
        // Fallback: visual diff not possible directly
        return { diffBuffer: null, pixelCount: -1 };
    }

    const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
    );

    return {
        diffBuffer: PNG.sync.write(diff),
        pixelCount: numDiffPixels
    };
}
