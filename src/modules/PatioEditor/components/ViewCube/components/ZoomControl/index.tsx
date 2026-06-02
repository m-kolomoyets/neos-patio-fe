import type { ZoomControlProps } from './types';
import { memo } from 'react';
import ExpandIcon from '@/icons/arrows-expand_24.svg?react';
import HomeIcon from '@/icons/home_24.svg?react';
import MinusIcon from '@/icons/minus_24.svg?react';
import PlusIcon from '@/icons/plus_24.svg?react';
import RefreshIcon from '@/icons/refresh-ccw-one-arrow_24.svg?react';
import { Menu } from '@base-ui/react/menu';
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
                    className={s.step}
                    aria-label="Zoom out"
                    onClick={() => {
                        onStepZoom(-1);
                    }}
                >
                    <MinusIcon />
                </button>
                <Menu.Trigger className={s.readout} aria-label="Zoom options">
                    {percent}%
                </Menu.Trigger>
                <button
                    type="button"
                    className={s.step}
                    aria-label="Zoom in"
                    onClick={() => {
                        onStepZoom(1);
                    }}
                >
                    <PlusIcon />
                </button>
            </div>
            <Menu.Portal>
                <Menu.Positioner side="top" align="end" sideOffset={8}>
                    <Menu.Popup render={<PopupWrapper className={s.popup} />}>
                        <Menu.Item
                            className={s.item}
                            onClick={() => {
                                onStepZoom(1);
                            }}
                            render={<OptionItem leftAddon={<PlusIcon />}>Zoom in</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={() => {
                                onStepZoom(-1);
                            }}
                            render={<OptionItem leftAddon={<MinusIcon />}>Zoom out</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={onZoomToFit}
                            render={<OptionItem leftAddon={<ExpandIcon />}>Zoom to fit</OptionItem>}
                        />
                        <Separator orientation="horizontal" />
                        {ZOOM_PRESETS.map((preset) => {
                            return (
                                <Menu.Item
                                    key={preset}
                                    className={s.item}
                                    onClick={() => {
                                        onZoomToPercent(preset);
                                    }}
                                    render={<OptionItem>{`Zoom to ${preset}%`}</OptionItem>}
                                />
                            );
                        })}
                        <Separator orientation="horizontal" />
                        <Menu.Item
                            className={s.item}
                            onClick={onSetHome}
                            render={<OptionItem leftAddon={<HomeIcon />}>Set current view as Home</OptionItem>}
                        />
                        <Menu.Item
                            className={s.item}
                            onClick={onResetHome}
                            render={<OptionItem leftAddon={<RefreshIcon />}>Reset Home</OptionItem>}
                        />
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
});
