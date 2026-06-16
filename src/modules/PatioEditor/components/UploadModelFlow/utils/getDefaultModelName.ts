/** Derive the default asset name from a filename by dropping its extension. */
export const getDefaultModelName = (fileName: string): string => {
    return fileName.replace(/\.[^./]+$/, '');
};
