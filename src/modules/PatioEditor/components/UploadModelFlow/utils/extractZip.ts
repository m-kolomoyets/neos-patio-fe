import type { BundleFile } from './modelBundle';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { getDefaultModelName } from './getDefaultModelName';

/** Thrown when an archive's declared uncompressed size blows past the cap (zip bomb). */
export const ZIP_TOO_LARGE = 'ZIP_TOO_LARGE';

/** Whether a picked/dropped file is a zip archive (by extension or MIME type). */
export const isZipFile = (file: File): boolean => {
    return (
        file.name.toLowerCase().endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed'
    );
};

/** Archive cruft that must not be mistaken for bundle content (esp. `__MACOSX/._*.gltf`). */
const isArchiveJunk = (path: string): boolean => {
    const base = path.slice(path.lastIndexOf('/') + 1);
    return path.startsWith('__MACOSX/') || base.startsWith('._') || base === '.DS_Store';
};

/**
 * Lazily unzip a `.zip` archive into the same `{ path, file }` shape the directory
 * walk produces, so both feed one pipeline. Every entry is rooted under the zip's
 * own name — this gives a meaningful default asset name and keeps relative refs
 * resolving consistently whether or not the archive already wraps a folder.
 *
 * `fflate` is imported here (not at module top) so it stays out of the main chunk
 * and only loads when a `.zip` is actually selected.
 */
export const extractZip = async (zip: File): Promise<BundleFile[]> => {
    const { unzip } = await import('fflate');
    const buffer = new Uint8Array(await zip.arrayBuffer());

    // Sum declared uncompressed sizes in the filter — before fflate inflates anything —
    // so a zip bomb is rejected instead of expanded into memory.
    let inflatedSize = 0;
    let tooLarge = false;

    const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        unzip(
            buffer,
            {
                filter: (info) => {
                    inflatedSize += info.originalSize;
                    if (inflatedSize > MAX_FILE_SIZE_BYTES) {
                        tooLarge = true;
                        return false;
                    }
                    return true;
                },
            },
            (error, data) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(data);
            }
        );
    });

    if (tooLarge) {
        throw new Error(ZIP_TOO_LARGE);
    }

    const root = getDefaultModelName(zip.name);
    const files: BundleFile[] = [];

    for (const [path, bytes] of Object.entries(entries)) {
        // Directory entries have a trailing slash and no bytes.
        if (path.endsWith('/') || isArchiveJunk(path)) {
            continue;
        }
        const name = path.slice(path.lastIndexOf('/') + 1);
        files.push({ path: `${root}/${path}`, file: new File([bytes as BlobPart], name) });
    }

    return files;
};
