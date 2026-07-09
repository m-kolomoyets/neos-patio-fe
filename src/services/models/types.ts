export type Model3D = {
    id: string;
    name: string;
    gltfUrl: string;
    previewUrl: string;
    /** Human-readable file format label, shown verbatim in the preview (e.g. `glTF`). */
    format: string;
    /** Raw file size in bytes; rendered as MB in the preview. */
    sizeBytes: number;
};

export type UploadModelOptions = {
    /** Called with the upload completion percentage (0–100). */
    onProgress?: (_percent: number) => void;
    /** Aborts the in-flight upload when triggered. */
    signal?: AbortSignal;
};

/** A bundle file paired with its path relative to the bundle root. */
export type UploadModelFile = {
    path: string;
    file: File;
};

export type UploadModelVariables = UploadModelOptions & {
    /** Path of the glTF document the backend should treat as the scene entry. */
    entryPath: string;
    /** The referenced files to upload; a single `.glb` is a one-element list. */
    files: UploadModelFile[];
};

export type UploadModelResult = {
    id: string;
};

export type UploadModelThumbnailVariables = {
    id: string;
    blob: Blob;
};
