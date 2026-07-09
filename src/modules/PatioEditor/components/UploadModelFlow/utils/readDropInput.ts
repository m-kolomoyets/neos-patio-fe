import type { BundleFile } from './modelBundle';
import { walkDirectoryEntry } from './walkDirectoryEntry';

/** A normalized drop/pick result the flow turns into a bundle. */
export type SelectInput = { kind: 'file'; file: File } | { kind: 'bundle'; files: BundleFile[] };

export type ReadDropResult = SelectInput | { kind: 'error'; error: string } | null;

const MULTI_DROP_ERROR = 'Drop a single file or folder at a time.';
const EMPTY_FOLDER_ERROR = 'That folder is empty.';

/**
 * Resolve a drop into either a single file or a walked folder bundle. The directory
 * entry and file handle are read synchronously up front — a `DataTransfer` empties
 * once the drop handler returns, so they must be captured before the first `await`.
 */
export const readDropInput = async (dataTransfer: DataTransfer): Promise<ReadDropResult> => {
    const fileItems = [...dataTransfer.items].filter((item) => {
        return item.kind === 'file';
    });

    if (fileItems.length === 0) {
        return null;
    }
    if (fileItems.length > 1) {
        return { kind: 'error', error: MULTI_DROP_ERROR };
    }

    const entry = fileItems[0].webkitGetAsEntry();
    const droppedFile = fileItems[0].getAsFile();

    if (entry?.isDirectory) {
        const files = await walkDirectoryEntry(entry as FileSystemDirectoryEntry);
        if (files.length === 0) {
            return { kind: 'error', error: EMPTY_FOLDER_ERROR };
        }
        return { kind: 'bundle', files };
    }

    if (droppedFile) {
        return { kind: 'file', file: droppedFile };
    }
    return null;
};
