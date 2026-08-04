export type ObjValues<T> = T[keyof T];

export type WithClassName<T = unknown> = T & {
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

/**
 * How the map camera may be driven. `'edit'` leaves the default Cesium
 * screen-space controller untouched (today's editor behaviour). `'view'`
 * constrains it to orbit + zoom around the patio: free translate/pan across the
 * globe and free-look/fly are disabled so the patio always stays framed.
 */
export type MapInteraction = 'edit' | 'view';
