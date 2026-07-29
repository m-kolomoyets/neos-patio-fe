/** Characters kept on each side of the ellipsis by default (Figma: `417/0xD...277`). */
const DEFAULT_HEAD = 6;
const DEFAULT_TAIL = 4;

/**
 * Middle-truncates a long value (`https://etherscan.io/...?a=417` →
 * `etherscan...417`) for the popup's link chips, which must stay one line inside
 * a 300px card while still hinting at both ends. The scheme is dropped first —
 * `https://` is eight characters of pure noise. Pure.
 */
export const truncateMiddle = (value: string, head = DEFAULT_HEAD, tail = DEFAULT_TAIL): string => {
    const trimmed = value.replace(/^[a-z]+:\/\//i, '');
    if (trimmed.length <= head + tail + 3) return trimmed;

    return `${trimmed.slice(0, head)}...${trimmed.slice(-tail)}`;
};
