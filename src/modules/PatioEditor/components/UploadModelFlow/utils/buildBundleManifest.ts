import type { BundleFile, BundleManifest } from './modelBundle';
import { BUNDLE_TOO_LARGE_ERROR, MAX_BUNDLE_FILES, MAX_FILE_SIZE_BYTES } from '../constants';
import { extractGltfRefs } from './extractGltfRefs';
import { getBundleTotalSize } from './modelBundle';
import { normalizeBundlePath } from './normalizeBundlePath';

export type BundleBuildResult = { ok: true; manifest: BundleManifest } | { ok: false; error: string };

const NO_ENTRY_ERROR = 'No .gltf or .glb found in the folder.';
const MULTI_ENTRY_ERROR = 'Multiple models found. Upload one at a time.';
const INVALID_PATH_ERROR = 'The bundle contains an invalid file path.';
const BAD_GLTF_ERROR = 'Could not read the .gltf file.';
const TOO_MANY_FILES_ERROR = `That bundle has too many files. The maximum is ${MAX_BUNDLE_FILES}.`;

const isGltf = (path: string): boolean => {
    return path.toLowerCase().endsWith('.gltf');
};

const isEntry = (path: string): boolean => {
    return isGltf(path) || path.toLowerCase().endsWith('.glb');
};

/** Directory portion of a path (`a/b/c.gltf` → `a/b`, `c.gltf` → ``). */
const dirOf = (path: string): string => {
    const slash = path.lastIndexOf('/');
    return slash === -1 ? '' : path.slice(0, slash);
};

const joinPath = (dir: string, uri: string): string => {
    return dir ? `${dir}/${uri}` : uri;
};

/**
 * Build a {@link BundleManifest} from a flat list of files (from a directory walk or
 * an unzipped archive). Runs entirely before the upload starts, so every failure here
 * surfaces on the error screen ahead of the progress bar:
 *
 * - normalizes + safety-checks every path (rejects `../` escapes / absolute paths),
 * - requires exactly one glTF entry (`.gltf` or `.glb`),
 * - for a `.gltf`, parses it and verifies every referenced `.bin`/texture is present,
 * - filters the payload to only the referenced files (unreferenced junk is dropped).
 *
 * `files` keeps every bundle file so the preview's URL modifier can map all of them
 * and let the loader self-select; `payloadFiles` is the referenced-only upload set.
 */
export const buildBundleManifest = async (rawFiles: BundleFile[]): Promise<BundleBuildResult> => {
    if (rawFiles.length > MAX_BUNDLE_FILES) {
        return { ok: false, error: TOO_MANY_FILES_ERROR };
    }

    const files = new Map<string, File>();
    for (const { path, file } of rawFiles) {
        const normalized = normalizeBundlePath(path);
        if (normalized === null) {
            return { ok: false, error: INVALID_PATH_ERROR };
        }
        files.set(normalized, file);
    }

    const entryPaths = [...files.keys()].filter(isEntry);
    if (entryPaths.length === 0) {
        return { ok: false, error: NO_ENTRY_ERROR };
    }
    if (entryPaths.length > 1) {
        return { ok: false, error: MULTI_ENTRY_ERROR };
    }

    const entryPath = entryPaths[0];
    const entry: BundleFile = { path: entryPath, file: files.get(entryPath)! };

    // Total cap covers only the referenced payload — unreferenced junk doesn't count.
    const finish = (manifest: BundleManifest): BundleBuildResult => {
        if (getBundleTotalSize(manifest) > MAX_FILE_SIZE_BYTES) {
            return { ok: false, error: BUNDLE_TOO_LARGE_ERROR };
        }
        return { ok: true, manifest };
    };

    // A `.glb` is self-contained — no external resources to resolve.
    if (!isGltf(entryPath)) {
        return finish({ entry, files, payloadFiles: [entry], kind: 'glb' });
    }

    let doc: unknown;
    try {
        doc = JSON.parse(await entry.file.text());
    } catch {
        return { ok: false, error: BAD_GLTF_ERROR };
    }

    const baseDir = dirOf(entryPath);
    const payloadFiles: BundleFile[] = [entry];
    const seen = new Set<string>([entryPath]);

    for (const uri of extractGltfRefs(doc as Parameters<typeof extractGltfRefs>[0])) {
        const resolved = normalizeBundlePath(joinPath(baseDir, uri));
        if (resolved === null) {
            return { ok: false, error: INVALID_PATH_ERROR };
        }
        const file = files.get(resolved);
        if (!file) {
            return { ok: false, error: `Missing required file: ${uri}` };
        }
        if (!seen.has(resolved)) {
            seen.add(resolved);
            payloadFiles.push({ path: resolved, file });
        }
    }

    return finish({ entry, files, payloadFiles, kind: 'gltf-bundle' });
};
