export type Model3D = {
    id: string;
    name: string;
    gltfUrl: string;
    previewUrl: string;
};

export type UploadModelOptions = {
    /** Called with the upload completion percentage (0–100). */
    onProgress?: (_percent: number) => void;
    /** Aborts the in-flight upload when triggered. */
    signal?: AbortSignal;
};

export type UploadModelVariables = UploadModelOptions & {
    file: File;
};

export type UploadModelResult = {
    id: string;
};

export type UploadModelThumbnailVariables = {
    id: string;
    blob: Blob;
};
