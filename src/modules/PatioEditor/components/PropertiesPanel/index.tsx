import type { PlacedObject } from '@/services/patios/types';
import type { LocalFrame, LocalOffset } from '../../utils/geoPlacement';
import { useMemo } from 'react';
import clsx from 'clsx';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Typography } from '@/components/ui/Typography';
import { createLocalFrame, geoToLocal, localToGeo } from '../../utils/geoPlacement';
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

// Position offset from the patio center, in meters; edited via the X/Y/Z fields.
const POSITION_STEP = 0.1;
const POSITION_DECIMALS = 2;
const POSITION_AXES: { axis: keyof LocalOffset; label: string }[] = [
    { axis: 'x', label: 'X' },
    { axis: 'y', label: 'Y' },
    { axis: 'z', label: 'Z' },
];

type FieldConfig = {
    key: string;
    label?: string;
    step: number;
    decimals: number;
    fromObject(_o: PlacedObject): number;
    // Read-only fields omit `toPatch`.
    toPatch?(_v: number): Partial<PlacedObject>;
};

type FieldGroup = {
    value: string;
    title: string;
    fields: FieldConfig[];
};

// Rotation/scale are independent single-field edits. Position (X/Y/Z meters) is a
// coupled triple handled separately by `PositionFields`.
const GROUPS: FieldGroup[] = [
    {
        value: 'rotate',
        title: 'Rotation',
        // Stored heading/pitch/roll is a Cesium ENU Euler triple, so X/Y/Z degrees
        // is a lossless relabel: X=roll, Y=pitch, Z=heading.
        fields: [
            {
                key: 'roll',
                label: 'X',
                step: 1,
                decimals: 1,
                fromObject: (o) => {
                    return o.roll * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { roll: v * DEG_TO_RAD };
                },
            },
            {
                key: 'pitch',
                label: 'Y',
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
                key: 'heading',
                label: 'Z',
                step: 1,
                decimals: 1,
                fromObject: (o) => {
                    return o.heading * RAD_TO_DEG;
                },
                toPatch: (v) => {
                    return { heading: v * DEG_TO_RAD };
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
            onFocus={() => {
                if (!readOnly) dispatch({ type: 'beginEdit' });
            }}
            onBlur={() => {
                if (!readOnly) dispatch({ type: 'commitEdit' });
            }}
            onValueChange={({ floatValue }, { source }) => {
                // Ignore programmatic value resets (gizmo/undo sync); only commit user typing.
                if (readOnly || source !== 'event' || !Number.isFinite(floatValue)) {
                    return;
                }
                dispatch({ type: 'transformLive', id: object.id, patch: field.toPatch!(floatValue ?? 0) });
            }}
        />
    );
};

type PositionFieldsProps = {
    object: PlacedObject;
    frame: LocalFrame;
};

// Position is shown as X/Y/Z meters from the patio center. Editing one axis is a
// coupled edit: the new value is substituted into the live triple and converted
// back to a geographic patch (the reducer re-clamps lng/lat to the bounds).
const PositionFields: React.FC<PositionFieldsProps> = ({ object, frame }) => {
    const dispatch = useEditorDispatch();
    const local = geoToLocal(frame, object);
    return (
        <>
            {POSITION_AXES.map(({ axis, label }) => {
                return (
                    <NumericFormat
                        key={axis}
                        className={s.input}
                        size="sm"
                        leftAddon={label}
                        step={POSITION_STEP}
                        customInput={Input}
                        value={Number(local[axis].toFixed(POSITION_DECIMALS))}
                        onFocus={() => {
                            dispatch({ type: 'beginEdit' });
                        }}
                        onBlur={() => {
                            dispatch({ type: 'commitEdit' });
                        }}
                        onValueChange={({ floatValue }, { source }) => {
                            // Ignore programmatic value resets (gizmo/undo sync); only commit user typing.
                            if (source !== 'event' || !Number.isFinite(floatValue)) {
                                return;
                            }
                            const next = { ...local, [axis]: floatValue ?? 0 };
                            dispatch({ type: 'transformLive', id: object.id, patch: localToGeo(frame, next) });
                        }}
                    />
                );
            })}
        </>
    );
};

export const PropertiesPanel: React.FC = () => {
    const { objects, selectedId, mode, bounds } = useEditorState();
    const dispatch = useEditorDispatch();

    // Origin ENU frame is fixed per patio (bounds center) — build it once.
    const frame = useMemo(() => {
        return createLocalFrame(bounds);
    }, [bounds]);

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
                <Tabs.Panel value="translate">
                    <section className={s.group}>
                        <Typography variant="text-xs" className={s['group-title']} render={<h4 />}>
                            Position
                        </Typography>
                        <div className={s.fields}>
                            <PositionFields object={selected} frame={frame} />
                        </div>
                    </section>
                </Tabs.Panel>
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
