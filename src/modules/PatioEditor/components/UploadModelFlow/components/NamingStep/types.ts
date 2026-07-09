export type NamingStepProps = {
    /** Editable asset name. */
    name: string;
    /** Update the asset name. */
    onChangeName: (_name: string) => void;
    /** Persist the asset. */
    onSave: () => void;
};
