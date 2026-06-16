export type UploadingPanelProps = {
    /** Name of the file currently being uploaded. */
    fileName: string;
    /** Upload progress on the API track, 0–100. */
    progress: number;
    /** Size of the file currently being uploaded. */
    fileSize: number;
};
