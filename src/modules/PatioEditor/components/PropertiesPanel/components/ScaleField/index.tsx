import type { PlacedObject } from '@/services/patios/types';
import ChevronDownIcon from '@/icons/chevron-down_24.svg?react';
import ScaleIcon from '@/icons/scale-bottom-left_24.svg?react';
import clsx from 'clsx';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/Input';
import { Menu } from '@/components/ui/Menu';
import { OptionItem } from '@/components/ui/OptionItem';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { PERCENT_PER_RATIO, SCALE_MAX_PERCENT, SCALE_MIN_PERCENT, SCALE_PRESETS } from './constants';
import { useEditorDispatch } from '../../../../context/EditorContext';
import s from './styles.module.css';

const RATIO_MIN = SCALE_MIN_PERCENT / PERCENT_PER_RATIO;
const RATIO_MAX = SCALE_MAX_PERCENT / PERCENT_PER_RATIO;

const clampRatio = (ratio: number) => {
    return Math.min(Math.max(ratio, RATIO_MIN), RATIO_MAX);
};

type ScaleFieldProps = {
    object: PlacedObject;
};

/**
 * Uniform-scale editor: a percent text input joined to a preset dropdown.
 *
 * The model stores scale as a ratio (1 = 100%); this field is a percent view —
 * it multiplies by 100 for display and divides back on edit. Free typing is
 * committed live (unclamped so intermediate keystrokes don't jump), then the
 * value is clamped to [{@link SCALE_MIN_PERCENT}, {@link SCALE_MAX_PERCENT}]% on
 * blur. Presets apply as a single committed edit. Mirrors {@link EditableField}'s
 * beginEdit/transformLive/commitEdit history handshake.
 */
export const ScaleField: React.FC<ScaleFieldProps> = ({ object }) => {
    const dispatch = useEditorDispatch();

    const applyPreset = (percent: number) => {
        dispatch({ type: 'beginEdit' });
        dispatch({ type: 'transformLive', id: object.id, patch: { scale: percent / PERCENT_PER_RATIO } });
        dispatch({ type: 'commitEdit' });
    };

    return (
        <div className={s.scale}>
            <NumericFormat
                className={s.input}
                size="sm"
                leftAddon={<ScaleIcon />}
                suffix="%"
                allowNegative={false}
                decimalScale={2}
                customInput={Input}
                value={Number((object.scale * PERCENT_PER_RATIO).toFixed(2))}
                onFocus={() => {
                    dispatch({ type: 'beginEdit' });
                }}
                onBlur={() => {
                    const clamped = clampRatio(object.scale);
                    if (clamped !== object.scale) {
                        dispatch({ type: 'transformLive', id: object.id, patch: { scale: clamped } });
                    }
                    dispatch({ type: 'commitEdit' });
                }}
                onValueChange={({ floatValue }, { source }) => {
                    // Ignore programmatic value resets (gizmo/undo sync); only commit user typing.
                    if (source !== 'event' || !Number.isFinite(floatValue)) {
                        return;
                    }
                    dispatch({
                        type: 'transformLive',
                        id: object.id,
                        patch: { scale: (floatValue ?? 0) / PERCENT_PER_RATIO },
                    });
                }}
            />
            <Menu.Root>
                <Menu.Trigger className={clsx(s.trigger, 'focus-primary')} aria-label="Scale presets">
                    <ChevronDownIcon />
                </Menu.Trigger>
                <Menu.Positioner align="start" sideOffset={4}>
                    <Menu.Popup render={<PopupWrapper className={s.popup} />}>
                        {SCALE_PRESETS.map((preset) => {
                            return (
                                <Menu.Item
                                    key={preset}
                                    className={s.item}
                                    onClick={() => {
                                        applyPreset(preset);
                                    }}
                                    render={
                                        <OptionItem className={s.item} variant="surface">{`${preset}%`}</OptionItem>
                                    }
                                />
                            );
                        })}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Root>
        </div>
    );
};
