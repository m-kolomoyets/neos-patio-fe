/** The slice of the glTF JSON we care about — external resource URIs. */
type GltfDocument = {
    buffers?: { uri?: string }[];
    images?: { uri?: string }[];
};

/**
 * Collect the external resource URIs a `.gltf` document references — its `.bin`
 * buffers and image textures. Embedded `data:` URIs resolve in place and are
 * skipped; only URIs that point at sibling files in the bundle are returned, as
 * written (relative to the glTF's own directory).
 */
export const extractGltfRefs = (doc: GltfDocument): string[] => {
    const uris: string[] = [];

    const collect = (uri: string | undefined) => {
        if (!uri || uri.startsWith('data:')) {
            return;
        }
        uris.push(uri);
    };

    doc.buffers?.forEach((buffer) => {
        collect(buffer.uri);
    });
    doc.images?.forEach((image) => {
        collect(image.uri);
    });

    return uris;
};
