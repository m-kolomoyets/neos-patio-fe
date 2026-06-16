export const ACCEPTED_EXTENSIONS = ['.glb', '.gltf'] as const;

/** Value for the file input's `accept` attribute. */
export const FILE_INPUT_ACCEPT = '.glb,.gltf,model/gltf-binary,model/gltf+json';

export const MAX_FILE_SIZE_MB = 250;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
