export type SelectStepProps = {
    /** Currently accepted file, if any. */
    file: File | null;
    /** Inline validation error to display, if any. */
    error: string | null;
    /** Called with the first chosen file (from browse or drop) for validation upstream. */
    onSelectFile: (_file: File) => void;
    /** Clears the current selection. */
    onClear: () => void;
};
