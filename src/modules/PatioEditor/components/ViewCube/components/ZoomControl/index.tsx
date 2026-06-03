import type { ZoomControlProps } from './types';
import { memo } from 'react';
import MinusIcon from '@/icons/minus_24.svg?react';
import PlusIcon from '@/icons/plus_24.svg?react';
import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { OptionItem } from '@/components/ui/OptionItem';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { Separator } from '@/components/ui/Separator';
import { ZOOM_PRESETS } from '../../constants';
import s from './styles.module.css';

/**
 * Map-zoom stepper `− [%] +` plus an action popover.
 *
 * The percentage readout is the popover trigger; the `−`/`+` buttons step zoom
 * by ±1 level (a 2× scale change). The popover (Base UI Menu + the shared
 * `PopupWrapper`/`OptionItem` primitives) bundles zoom in/out, zoom-to-fit, the
 * 50/100/200% presets, and the Home set/reset actions. All handlers ease via
 * the parent's shared 400ms `easeTo`; this component holds no camera logic.
 *
 * Memoized so it skips re-render on pan/orbit frames (its props are stable) and
 * only re-renders when the zoom `percent` changes — see {@link LiveZoomControl}.
 */
export const ZoomControl = memo(function ZoomControl({
    percent,
    onStepZoom,
    onZoomToPercent,
    onZoomToFit,
    onSetHome,
    onResetHome,
}: ZoomControlProps) {
    return (
        <Menu.Root>
            <div className={s.stepper}>
                <button
                    type="button"
                    className={clsx(s.step, 'focus-primary')}
                    aria-label="Zoom out"
                    onClick={() => {
                        onStepZoom(-1);
                    }}
                >
                    <MinusIcon />
                </button>
                <Menu.Trigger className={clsx(s.readout, 'focus-primary')} aria-label="Zoom options">
                    {percent}%
                </Menu.Trigger>
                <button
                    type="button"
                    className={clsx(s.step, 'focus-primary')}
                    aria-label="Zoom in"
                    onClick={() => {
                        onStepZoom(1);
                    }}
                >
                    <PlusIcon />
                </button>
            </div>
            <Menu.Portal>
                <Menu.Positioner side="left" align="start" sideOffset={48} alignOffset={-10}>
                    <Menu.Popup render={<PopupWrapper className={s.popup} />}>
                        <Menu.Item
                            className={s.item}
                            onClick={() => {
                                onStepZoom(1);
                            }}
                            render={<OptionItem className={s.item}>Zoom in</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={() => {
                                onStepZoom(-1);
                            }}
                            render={<OptionItem className={s.item}>Zoom out</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={onZoomToFit}
                            render={<OptionItem className={s.item}>Zoom to fit</OptionItem>}
                        />
                        {ZOOM_PRESETS.map((preset) => {
                            return (
                                <Menu.Item
                                    key={preset}
                                    className={s.item}
                                    onClick={() => {
                                        onZoomToPercent(preset);
                                    }}
                                    render={<OptionItem className={s.item}>{`Zoom to ${preset}%`}</OptionItem>}
                                />
                            );
                        })}
                        <Separator className={s.separator} orientation="horizontal" />
                        <Menu.Item
                            className={s.item}
                            onClick={onSetHome}
                            render={<OptionItem className={s.item}>Set current view as Home</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={onResetHome}
                            render={<OptionItem className={s.item}>Reset Home</OptionItem>}
                        />
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
});
