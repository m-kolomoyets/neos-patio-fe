import type { PlacedObject } from '@/services/patios/types';
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import clsx from 'clsx';
import { NumericFormat } from 'react-number-format';
import { Box3, Vector3 } from 'three';
import { useModelsQuery } from '@/services/models/queries';
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
    fromObject(_o: PlacedObject): number;
    toPatch(_v: number): Partial<PlacedObject>;
};

type FieldGroup = {
    value: string;
    title: string;
    fields: FieldConfig[];
};

const GROUPS: FieldGroup[] = [
    {
        value: 'translate',
        title: 'Position',
        fields: [
            {
                key: 'x',
                label: 'X',
                step: 0.1,
                fromObject: (o) => {
                    return o.x;
                },
                toPatch: (v) => {
                    return { x: v };
                },
            },
            {
                key: 'y',
                label: 'Y',
                step: 0.1,
                fromObject: (o) => {
                    return o.y;
                },
                toPatch: (v) => {
                    return { y: v };
                },
            },
            {
                key: 'z',
                label: 'Z',
                step: 0.1,
                fromObject: (o) => {
                    return o.z;
                },
                toPatch: (v) => {
                    return { z: v };
                },
            },
        ],
    },
    {
        value: 'rotate',
        title: 'Rotation',
        fields: [
            {
                key: 'rotXDeg',
                label: 'X',
                step: 1,
                fromObject: (o) => {
                    return o.rotX * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { rotX: v * DEG_TO_RAD };
                },
            },
            {
                key: 'rotYDeg',
                label: 'Y',
                step: 1,
                fromObject: (o) => {
                    return o.rotY * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { rotY: v * DEG_TO_RAD };
                },
            },
            {
                key: 'rotZDeg',
                label: 'Z',
                step: 1,
                fromObject: (o) => {
                    return o.rotZ * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { rotZ: v * DEG_TO_RAD };
                },
            },
        ],
    },
];

// const SCALE_FIELD: FieldConfig = {
//     key: 'scale',
//     step: 0.1,
//     fromObject: (o) => {
//         return o.scale;
//     },
//     toPatch: (v) => {
//         return { scale: v };
//     },
// };

type EditableFieldProps = {
    field: FieldConfig;
    object: PlacedObject;
};

const EditableField: React.FC<EditableFieldProps> = ({ field, object }) => {
    const dispatch = useEditorDispatch();
    return (
        <NumericFormat
            className={s.input}
            size="sm"
            leftAddon={field.label}
            step={field.step}
            customInput={Input}
            value={Number(field.fromObject(object).toFixed(2))}
            onValueChange={({ floatValue }) => {
                if (!Number.isFinite(floatValue)) {
                    return;
                }
                dispatch({ type: 'transform', id: object.id, patch: field.toPatch(floatValue ?? 0) });
            }}
        />
    );
};

const DIMENSION_LABELS = ['X (m)', 'Y (m)', 'Z (m)'] as const;

type DimensionsProps = {
    gltfUrl: string;
    scale: number;
};

const Dimensions: React.FC<DimensionsProps> = ({ gltfUrl, scale }) => {
    // Reuses the same cached useGLTF instance the scene loads — no extra fetch.
    const { scene } = useGLTF(gltfUrl);
    // Local-space bounding box keeps the readout rotation-independent.
    const size = useMemo(() => {
        return new Box3().setFromObject(scene).getSize(new Vector3());
    }, [scene]);
    const dims = [size.x, size.y, size.z];
    return (
        <div className={s.dimensions}>
            {DIMENSION_LABELS.map((_, i) => {
                return (
                    <NumericFormat
                        className={s.input}
                        size="sm"
                        value={Number((dims[i] * scale).toFixed(3))}
                        customInput={Input}
                        readOnly
                    />
                );
            })}
        </div>
    );
};

export const PropertiesPanel: React.FC = () => {
    const { objects, selectedId, mode } = useEditorState();
    const dispatch = useEditorDispatch();
    const { data: models } = useModelsQuery();

    const selected = objects.find((o) => {
        return o.id === selectedId;
    });
    if (!selected) return null;

    const gltfUrl = models?.find((m) => {
        return m.id === selected.modelId;
    })?.gltfUrl;

    return (
        <aside className={clsx(s.panel, 'surface-regular')}>
            <Tabs.Root
                value={mode}
                onValueChange={(value) => {
                    dispatch({ type: 'setMode', mode: value as EditorMode });
                }}
            >
                <Tabs.List className={s.tabs}>
                    {MODES.map((mode) => {
                        return (
                            <Tabs.Tab className={s.tab} key={mode.mode} value={mode.mode}>
                                {mode.label}
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
                <Tabs.Panel value="scale">
                    {gltfUrl && (
                        <section className={s.group}>
                            <Typography variant="text-xs" className={s['group-title']} render={<h4 />}>
                                Dimensions (m)
                            </Typography>
                            <Suspense fallback={<div className={s.label}>Loading…</div>}>
                                <Dimensions gltfUrl={gltfUrl} scale={selected.scale} />
                            </Suspense>
                        </section>
                    )}
                </Tabs.Panel>
                {/* <section className={s.group}>
                <h4 className={s['group-title']}>Scale</h4>
                <EditableField field={SCALE_FIELD} object={selected} />
            </section> */}
                {/* <button
                type="button"
                className={s.delete}
                onClick={() => {
                    dispatch({ type: 'remove', id: selected.id });
                }}
            >
                Delete object
            </button> */}
            </Tabs.Root>
        </aside>
    );
};
