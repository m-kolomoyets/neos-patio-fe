/**
 * Normalize a bundle-relative path to a single canonical form used everywhere a
 * path is compared or looked up: the directory walk, the glTF reference check, and
 * the loader's URL modifier. Without one shared form, `./tex/a.png`, `tex/a.png`,
 * and `tex%2Fa.png` would miss each other.
 *
 * Returns `null` for paths that escape the bundle root (`../…`) or are absolute —
 * the caller treats that as an invalid/unsafe entry and rejects the bundle.
 */
export const normalizeBundlePath = (rawPath: string): string | null => {
    let decoded: string;
    try {
        decoded = decodeURIComponent(rawPath);
    } catch {
        // Malformed percent-encoding — treat as unsafe.
        return null;
    }

    // Backslashes → forward slashes; strip any leading `./`.
    const unified = decoded.replace(/\\/g, '/');

    // Absolute paths (POSIX `/…` or Windows `C:/…`) are not bundle-relative.
    if (unified.startsWith('/') || /^[a-z]:\//i.test(unified)) {
        return null;
    }

    const segments: string[] = [];
    for (const segment of unified.split('/')) {
        if (segment === '' || segment === '.') {
            continue;
        }
        if (segment === '..') {
            // An escape above the root — unresolvable within the bundle.
            if (segments.length === 0) {
                return null;
            }
            segments.pop();
            continue;
        }
        segments.push(segment);
    }

    return segments.join('/');
};
