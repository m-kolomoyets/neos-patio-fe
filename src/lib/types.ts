export type ObjValues<T> = T[keyof T];

export type WithClassName<T> = T & {
    /**
        Extendable classnames of component
    */
    className?: string;
};

export type SetStateValue<T> = React.Dispatch<React.SetStateAction<T>>;

export type LabelValueOption = {
    label: string;
    value: string;
    Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
};
