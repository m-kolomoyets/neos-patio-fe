import type { PlacedObject } from '@/services/patios/types';
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useModelsQuery } from '@/services/models/queries';
import { useEditorDispatch, useEditorState } from '../../context/EditorContext';
import s from './styles.module.css';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

type FieldConfig = {
    key: string;
    label: string;
    step: number;
    fromObject(_o: PlacedObject): number;
    toPatch(_v: number): Partial<PlacedObject>;
};

type FieldGroup = {
    title: string;
    fields: FieldConfig[];
};

const GROUPS: FieldGroup[] = [
    {
        title: 'Position',
        fields: [
            {
                key: 'x',
                label: 'X (m)',
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
                label: 'Y (m)',
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
                label: 'Z (m)',
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
        title: 'Rotation',
        fields: [
            {
                key: 'rotXDeg',
                label: 'X (°)',
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
                label: 'Y (°)',
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
                label: 'Z (°)',
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

const SCALE_FIELD: FieldConfig = {
    key: 'scale',
    label: 'Uniform',
    step: 0.1,
    fromObject: (o) => {
        return o.scale;
    },
    toPatch: (v) => {
        return { scale: v };
    },
};

type EditableFieldProps = {
    field: FieldConfig;
    object: PlacedObject;
};

const EditableField: React.FC<EditableFieldProps> = ({ field, object }) => {
    const dispatch = useEditorDispatch();
    return (
        <div className={s.row}>
            <span className={s.label}>{field.label}</span>
            <input
                type="number"
                className={s.input}
                step={field.step}
                value={Number(field.fromObject(object).toFixed(6))}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    dispatch({ type: 'transform', id: object.id, patch: field.toPatch(next) });
                }}
            />
        </div>
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
        <>
            {DIMENSION_LABELS.map((label, i) => {
                return (
                    <div key={label} className={s.row}>
                        <span className={s.label}>{label}</span>
                        <input
                            type="number"
                            className={s.input}
                            value={Number((dims[i] * scale).toFixed(3))}
                            readOnly
                        />
                    </div>
                );
            })}
        </>
    );
};

export const PropertiesPanel: React.FC = () => {
    const { objects, selectedId } = useEditorState();
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
        <aside className={s.panel}>
            <h3 className={s.title}>Properties</h3>
            {GROUPS.map((group) => {
                return (
                    <section key={group.title} className={s.group}>
                        <h4 className={s['group-title']}>{group.title}</h4>
                        {group.fields.map((field) => {
                            return <EditableField key={field.key} field={field} object={selected} />;
                        })}
                    </section>
                );
            })}
            {gltfUrl && (
                <section className={s.group}>
                    <h4 className={s['group-title']}>Model Dimensions</h4>
                    <Suspense fallback={<div className={s.label}>Loading…</div>}>
                        <Dimensions gltfUrl={gltfUrl} scale={selected.scale} />
                    </Suspense>
                </section>
            )}
            <section className={s.group}>
                <h4 className={s['group-title']}>Scale</h4>
                <EditableField field={SCALE_FIELD} object={selected} />
            </section>
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
