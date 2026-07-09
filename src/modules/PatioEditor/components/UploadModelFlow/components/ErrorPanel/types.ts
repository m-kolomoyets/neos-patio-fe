export type ErrorPanelProps = {
    /** Human-readable failure message from the upload track. */
    error: string;
    /** Re-run the upload with the same file. */
    onRetry: () => void;
};
