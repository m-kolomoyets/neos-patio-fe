const XMP_NS = 'http://ns.adobe.com/xap/1.0/\0';
const EXT_NS = 'http://ns.adobe.com/xmp/extension/\0';

const enc = new TextEncoder();
const XMP_SIG = enc.encode(XMP_NS);
const EXT_SIG = enc.encode(EXT_NS);

const bytesStartWith = (buf: Uint8Array, offset: number, sig: Uint8Array): boolean => {
    if (offset + sig.length > buf.length) return false;
    for (let i = 0; i < sig.length; i++) {
        if (buf[offset + i] !== sig[i]) return false;
    }
    return true;
};

const bytesToAscii = (buf: Uint8Array, start: number, end: number): string => {
    let out = '';
    for (let i = start; i < end; i++) out += String.fromCharCode(buf[i]);
    return out;
};

type ExtChunk = { offset: number; portion: string };

const parseJpegXmp = (buf: Uint8Array): { standard: string | null; extended: Map<string, ExtChunk[]> } => {
    const extended = new Map<string, ExtChunk[]>();
    let standard: string | null = null;

    if (buf[0] !== 0xff || buf[1] !== 0xd8) {
        throw new Error('Not a JPEG');
    }

    let i = 2;
    while (i < buf.length) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        // SOS or EOI — stop scanning APP segments
        if (marker === 0xda || marker === 0xd9) break;
        // Standalone markers without length
        if (marker === 0x00 || marker === 0xff) {
            i += 2;
            continue;
        }
        const segLen = (buf[i + 2] << 8) | buf[i + 3];
        const segStart = i + 4;
        const segEnd = i + 2 + segLen;

        if (marker === 0xe1) {
            if (bytesStartWith(buf, segStart, XMP_SIG)) {
                standard = bytesToAscii(buf, segStart + XMP_SIG.length, segEnd);
            } else if (bytesStartWith(buf, segStart, EXT_SIG)) {
                // ExtendedXMP layout: NS\0 | GUID(32 ASCII) | fullLen(4) | offset(4) | portion
                const headerStart = segStart + EXT_SIG.length;
                const guid = bytesToAscii(buf, headerStart, headerStart + 32);
                const offset =
                    (buf[headerStart + 36] << 24) |
                    (buf[headerStart + 37] << 16) |
                    (buf[headerStart + 38] << 8) |
                    buf[headerStart + 39];
                const portion = bytesToAscii(buf, headerStart + 40, segEnd);
                const list = extended.get(guid) ?? [];
                list.push({ offset, portion });
                extended.set(guid, list);
            }
        }

        i = segEnd;
    }

    return { standard, extended };
};

const mergeExtended = (standard: string, extended: Map<string, ExtChunk[]>): string => {
    const guidMatch = standard.match(/xmpNote:HasExtendedXMP="([0-9A-Fa-f]{32})"/);
    if (!guidMatch) return standard;
    const chunks = extended.get(guidMatch[1]);
    if (!chunks || chunks.length === 0) return standard;
    chunks.sort((a, b) => {
        return a.offset - b.offset;
    });
    const extPayload = chunks
        .map((c) => {
            return c.portion;
        })
        .join('');
    // ExtendedXMP holds the depth payload; splice into standard packet's root
    // by appending before closing </rdf:RDF>. If standard has no such tag, return ext.
    const closeIdx = standard.lastIndexOf('</rdf:RDF>');
    if (closeIdx < 0) return extPayload;
    // Extract rdf children from ext payload
    const extInner = extPayload.match(/<rdf:RDF[^>]*>([\s\S]*?)<\/rdf:RDF>/);
    if (!extInner) return standard;
    return standard.slice(0, closeIdx) + extInner[1] + standard.slice(closeIdx);
};

const attr = (xmp: string, names: string[]): string | null => {
    for (const name of names) {
        const m =
            xmp.match(new RegExp(`${name}="([^"]+)"`)) ?? xmp.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
        if (m) return m[1].replace(/\s+/g, '');
    }
    return null;
};

const base64ToBlob = (b64: string, mime: string): Blob => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return new Blob([out], { type: mime });
};

export type GDepthAssets = {
    color: ImageBitmap;
    depth: ImageBitmap;
    aspect: number;
};

export const parseGDepth = async (src: string): Promise<GDepthAssets> => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());

    const { standard, extended } = parseJpegXmp(buf);
    if (!standard) throw new Error('No XMP packet in JPEG');
    const xmp = mergeExtended(standard, extended);

    const depthB64 = attr(xmp, ['GDepth:Data', 'xmpGDepth:Data']);
    if (!depthB64) throw new Error('No GDepth:Data in XMP');
    const depthMime = attr(xmp, ['GDepth:Mime', 'xmpGDepth:Mime']) ?? 'image/png';

    const colorBlob = new Blob([buf], { type: 'image/jpeg' });
    const depthBlob = base64ToBlob(depthB64, depthMime);

    const [color, depth] = await Promise.all([createImageBitmap(colorBlob), createImageBitmap(depthBlob)]);

    return { color, depth, aspect: color.width / color.height };
};
