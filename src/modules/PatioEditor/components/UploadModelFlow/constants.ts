export const ACCEPTED_EXTENSIONS = ['.glb', '.gltf'] as const;

/** Value for the file input's `accept` attribute. */
export const FILE_INPUT_ACCEPT = '.glb,.gltf,.zip,model/gltf-binary,model/gltf+json,application/zip';

export const MAX_FILE_SIZE_MB = 250;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Upper bound on files in a bundle (folder/zip) before processing — DoS guard. */
export const MAX_BUNDLE_FILES = 500;

/** Shared by the bundle size check and the zip inflate guard. */
export const BUNDLE_TOO_LARGE_ERROR = `Bundle is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;

/** Hosted Draco decoder (wasm/js) the lazy `DRACOLoader` fetches from. */
export const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
