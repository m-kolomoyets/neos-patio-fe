import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants';

export type ModelFileValidationResult = { ok: true } | { ok: false; error: string };

/** Lowercased file extension including the dot (e.g. `.glb`), or `''` when absent. */
export const getFileExtension = (name: string): string => {
    const dotIndex = name.lastIndexOf('.');
    return dotIndex === -1 ? '' : name.slice(dotIndex).toLowerCase();
};

export const validateModelFile = (file: File): ModelFileValidationResult => {
    const extension = getFileExtension(file.name);

    if (
        !ACCEPTED_EXTENSIONS.some((accepted) => {
            return accepted === extension;
        })
    ) {
        return { ok: false, error: `Unsupported format. Upload ${ACCEPTED_EXTENSIONS.join(' or ')} files.` };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return { ok: false, error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` };
    }

    return { ok: true };
};
