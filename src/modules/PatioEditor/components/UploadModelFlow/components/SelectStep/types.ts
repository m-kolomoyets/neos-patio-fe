import type { SelectInput } from '../../utils/readDropInput';

export type SelectStepProps = {
    /** A picked file or a walked folder bundle, for validation/processing upstream. */
    onSelect: (_input: SelectInput) => void;
    /** A drop that couldn't be read (multiple items, empty folder, …). */
    onError: (_message: string) => void;
};
