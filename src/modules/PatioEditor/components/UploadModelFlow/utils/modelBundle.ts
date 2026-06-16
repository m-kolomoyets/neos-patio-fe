/**
 * Normalized representation every upload input collapses to before it reaches the
 * flow state. A single `.glb` / `.gltf` is a one-file bundle; a `.gltf` + folder (and
 * later a `.zip`) fills the same shape with its referenced resources, so the reducer,
 * preview, and upload layers never branch on the input kind.
 */
import { getDefaultModelName } from './getDefaultModelName';

export type BundleFile = {
    /** Path relative to the bundle root (the entry's own filename for a single file). */
    path: string;
    file: File;
};

/** Everything about a bundle except its (side-effecting) object URLs. */
export type BundleManifest = {
    /** The glTF document that drives the scene (`.gltf` or `.glb`). */
    entry: BundleFile;
    /** Every file in the bundle, keyed by normalized relative path. */
    files: Map<string, File>;
    /** The subset actually referenced by the entry — what gets uploaded. */
    payloadFiles: BundleFile[];
    kind: 'glb' | 'gltf-bundle';
};

export type ModelBundle = BundleManifest & {
    /** Object URL per file, keyed by the same paths as {@link BundleManifest.files}. */
    blobUrls: Map<string, string>;
};

/** Mint an object URL per file. Caller owns revoking them (see the upload context). */
export const createBlobUrls = (files: Map<string, File>): Map<string, string> => {
    const blobUrls = new Map<string, string>();
    files.forEach((file, path) => {
        blobUrls.set(path, URL.createObjectURL(file));
    });
    return blobUrls;
};

/** Turn a validated manifest into a live bundle by minting its object URLs. */
export const materializeBundle = (manifest: BundleManifest): ModelBundle => {
    return { ...manifest, blobUrls: createBlobUrls(manifest.files) };
};

/** Manifest for a single self-contained file (`.glb`, or a `.gltf` with no externals). */
export const singleFileManifest = (file: File): BundleManifest => {
    const path = file.name;
    const entry: BundleFile = { path, file };
    const kind = path.toLowerCase().endsWith('.glb') ? 'glb' : 'gltf-bundle';

    return {
        entry,
        files: new Map([[path, file]]),
        payloadFiles: [entry],
        kind,
    };
};

/** The object URL the loader parses — the entry's blob URL. */
export const getBundleEntryUrl = (bundle: ModelBundle): string => {
    const url = bundle.blobUrls.get(bundle.entry.path);
    if (!url) {
        throw new Error(`Missing blob URL for bundle entry "${bundle.entry.path}".`);
    }
    return url;
};

/**
 * Best-guess default asset name: the bundle's root folder/zip name when the entry
 * sits inside one, otherwise the entry filename with its extension stripped.
 */
export const getBundleDefaultName = (manifest: BundleManifest): string => {
    const { path, file } = manifest.entry;
    const slash = path.indexOf('/');
    if (slash !== -1) {
        return path.slice(0, slash);
    }
    return getDefaultModelName(file.name);
};

/** Total size of the uploaded files, shown in the uploading panel. */
export const getBundleTotalSize = (manifest: BundleManifest): number => {
    return manifest.payloadFiles.reduce((sum, { file }) => {
        return sum + file.size;
    }, 0);
};
