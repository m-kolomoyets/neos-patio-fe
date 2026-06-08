import type { PlacedObject } from '@/services/patios/types';
import clsx from 'clsx';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Typography } from '@/components/ui/Typography';
import { useEditorDispatch, useEditorState } from '../../context/EditorContext';
import { EditorMode } from '../../types';
import s from './styles.module.css';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

const MODES: { mode: EditorMode; label: string }[] = [
    { mode: 'translate', label: 'Move' },
    { mode: 'rotate', label: 'Rotate' },
    { mode: 'scale', label: 'Scale' },
];

type FieldConfig = {
    key: string;
    label?: string;
    step: number;
    decimals: number;
    fromObject(_o: PlacedObject): number;
    // Read-only fields (lng/lat) omit `toPatch`: position is changed via the gizmo.
    toPatch?(_v: number): Partial<PlacedObject>;
};

type FieldGroup = {
    value: string;
    title: string;
    fields: FieldConfig[];
};

// Option B: height/heading/pitch/roll/scale editable; lng/lat read-only (moved via gizmo).
const GROUPS: FieldGroup[] = [
    {
        value: 'translate',
        title: 'Position',
        fields: [
            {
                key: 'height',
                label: 'Alt',
                step: 0.1,
                decimals: 2,
                fromObject: (o) => {
                    return o.height;
                },
                toPatch: (v) => {
                    return { height: v };
                },
            },
            {
                key: 'lng',
                label: 'Lng',
                step: 0,
                decimals: 6,
                fromObject: (o) => {
                    return o.lng;
                },
            },
            {
                key: 'lat',
                label: 'Lat',
                step: 0,
                decimals: 6,
                fromObject: (o) => {
                    return o.lat;
                },
            },
        ],
    },
    {
        value: 'rotate',
        title: 'Rotation',
        fields: [
            {
                key: 'heading',
                label: 'H',
                step: 1,
                decimals: 1,
                fromObject: (o) => {
                    return o.heading * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { heading: v * DEG_TO_RAD };
                },
            },
            {
                key: 'pitch',
                label: 'P',
                step: 1,
                decimals: 1,
                fromObject: (o) => {
                    return o.pitch * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { pitch: v * DEG_TO_RAD };
                },
            },
            {
                key: 'roll',
                label: 'R',
                step: 1,
                decimals: 1,
                fromObject: (o) => {
                    return o.roll * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { roll: v * DEG_TO_RAD };
                },
            },
        ],
    },
    {
        value: 'scale',
        title: 'Scale',
        fields: [
            {
                key: 'scale',
                label: '×',
                step: 0.1,
                decimals: 2,
                fromObject: (o) => {
                    return o.scale;
                },
                toPatch: (v) => {
                    return { scale: v };
                },
            },
        ],
    },
];

type EditableFieldProps = {
    field: FieldConfig;
    object: PlacedObject;
};

const EditableField: React.FC<EditableFieldProps> = ({ field, object }) => {
    const dispatch = useEditorDispatch();
    const readOnly = !field.toPatch;
    return (
        <NumericFormat
            className={s.input}
            size="sm"
            leftAddon={field.label}
            step={field.step}
            customInput={Input}
            readOnly={readOnly}
            value={Number(field.fromObject(object).toFixed(field.decimals))}
            onValueChange={({ floatValue }) => {
                if (readOnly || !Number.isFinite(floatValue)) {
                    return;
                }
                dispatch({ type: 'transform', id: object.id, patch: field.toPatch!(floatValue ?? 0) });
            }}
        />
    );
};

export const PropertiesPanel: React.FC = () => {
    const { objects, selectedId, mode } = useEditorState();
    const dispatch = useEditorDispatch();

    const selected = objects.find((o) => {
        return o.id === selectedId;
    });
    if (!selected) return null;

    return (
        <aside className={clsx(s.panel, 'surface-regular')}>
            <Tabs.Root
                value={mode}
                onValueChange={(value) => {
                    dispatch({ type: 'setMode', mode: value as EditorMode });
                }}
            >
                <Tabs.List className={s.tabs}>
                    {MODES.map((m) => {
                        return (
                            <Tabs.Tab className={s.tab} key={m.mode} value={m.mode}>
                                {m.label}
                            </Tabs.Tab>
                        );
                    })}
                    <Tabs.Indicator />
                </Tabs.List>
                {GROUPS.map((group) => {
                    return (
                        <Tabs.Panel key={group.value} value={group.value}>
                            <section className={s.group}>
                                <Typography variant="text-xs" className={s['group-title']} render={<h4 />}>
                                    {group.title}
                                </Typography>
                                <div className={s.fields}>
                                    {group.fields.map((field) => {
                                        return <EditableField key={field.key} field={field} object={selected} />;
                                    })}
                                </div>
                            </section>
                        </Tabs.Panel>
                    );
                })}
            </Tabs.Root>
        </aside>
    );
};
