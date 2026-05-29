import type { PlacedObject } from '@/services/patios/types';
import { useEditorDispatch, useEditorState } from '../../context/EditorContext';
import s from './styles.module.css';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

type FieldConfig = {
    key: 'lng' | 'lat' | 'alt' | 'yawDeg' | 'scale';
    label: string;
    step: number;
    fromObject(_o: PlacedObject): number;
    toPatch(_v: number): Partial<PlacedObject>;
};

const FIELDS: FieldConfig[] = [
    {
        key: 'lng',
        label: 'Lng',
        step: 0.0001,
        fromObject(o) {
            return o.lng;
        },
        toPatch(v) {
            return { lng: v };
        },
    },
    {
        key: 'lat',
        label: 'Lat',
        step: 0.0001,
        fromObject(o) {
            return o.lat;
        },
        toPatch(v) {
            return { lat: v };
        },
    },
    {
        key: 'alt',
        label: 'Alt (m)',
        step: 1,
        fromObject(o) {
            return o.alt;
        },
        toPatch(v) {
            return { alt: v };
        },
    },
    {
        key: 'yawDeg',
        label: 'Yaw (°)',
        step: 1,
        fromObject(o) {
            return o.yawRad * RAD_TO_DEG;
        },
        toPatch(v) {
            return { yawRad: v * DEG_TO_RAD };
        },
    },
    {
        key: 'scale',
        label: 'Scale',
        step: 0.1,
        fromObject(o) {
            return o.scale;
        },
        toPatch(v) {
            return { scale: v };
        },
    },
];

export const PropertiesPanel: React.FC = () => {
    const { objects, selectedId } = useEditorState();
    const dispatch = useEditorDispatch();

    const selected = objects.find((o) => {
        return o.id === selectedId;
    });
    if (!selected) return null;

    return (
        <aside className={s.panel}>
            <h3 className={s.title}>Properties</h3>
            {FIELDS.map((field) => {
                return (
                    <div key={field.key} className={s.row}>
                        <span className={s.label}>{field.label}</span>
                        <input
                            type="number"
                            className={s.input}
                            step={field.step}
                            value={Number(field.fromObject(selected).toFixed(6))}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                if (!Number.isFinite(next)) return;
                                dispatch({ type: 'transform', id: selected.id, patch: field.toPatch(next) });
                            }}
                        />
                    </div>
                );
            })}
            <button
                type="button"
                className={s.delete}
                onClick={() => {
                    dispatch({ type: 'remove', id: selected.id });
                }}
            >
                Delete object
            </button>
        </aside>
    );
};
