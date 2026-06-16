import type { BundleFile } from './modelBundle';

/** `readEntries` yields children in batches — drain it until it returns none. */
const readAllEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
        const all: FileSystemEntry[] = [];
        const readNext = () => {
            reader.readEntries((batch) => {
                if (batch.length === 0) {
                    resolve(all);
                    return;
                }
                all.push(...batch);
                readNext();
            }, reject);
        };
        readNext();
    });
};

const fileOf = (entry: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
    });
};

/**
 * Recursively flatten a dropped directory into `{ path, file }` entries, where each
 * path is rooted at the dropped folder's name (e.g. `MyModel/textures/wood.png`).
 * Used for the `.gltf` + folder drag-drop input.
 */
export const walkDirectoryEntry = async (root: FileSystemDirectoryEntry): Promise<BundleFile[]> => {
    const out: BundleFile[] = [];

    const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isFile) {
            out.push({ path, file: await fileOf(entry as FileSystemFileEntry) });
            return;
        }

        const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
        await Promise.all(
            children.map((child) => {
                return walk(child, path);
            })
        );
    };

    await walk(root, '');
    return out;
};
