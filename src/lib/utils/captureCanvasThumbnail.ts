const THUMBNAIL_SIZE_PX = 256;

/**
 * Snapshot a WebGL canvas into a square thumbnail `Blob`. Center-crops the source
 * to its shorter side (cover fit) and downscales onto an offscreen 256×256 canvas.
 * The source canvas must be created with `preserveDrawingBuffer` so its framebuffer
 * is still readable at capture time.
 */
export const captureCanvasThumbnail = (source: HTMLCanvasElement, size = THUMBNAIL_SIZE_PX): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const target = document.createElement('canvas');
        target.width = size;
        target.height = size;

        const ctx = target.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not acquire a 2D context for the thumbnail.'));
            return;
        }

        const side = Math.min(source.width, source.height);
        const sx = (source.width - side) / 2;
        const sy = (source.height - side) / 2;
        ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);

        target.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Could not encode the thumbnail.'));
            }
        }, 'image/png');
    });
};
