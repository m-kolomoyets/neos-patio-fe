import { useEffect, useRef } from 'react';
import CubeIcon from '@/icons/cube_24.svg?react';
import DotsIcon from '@/icons/dots-horizontal_24.svg?react';
import Grid2Square4Icon from '@/icons/grid-square_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { OptionItem } from '@/components/ui/OptionItem';
import { PopupWrapper } from '@/components/ui/PopupWrapper';
import { Typography } from '@/components/ui/Typography';
import { flyToObject } from '../../utils/flyToObject';
import { useCesiumViewer } from '../../context/CesiumViewerContext';
import { useEditorDispatch, useEditorState } from '../../context/EditorContext';
import s from './styles.module.css';

export const ScenePanel: React.FC = () => {
    const { objects, selectedId } = useEditorState();
    const dispatch = useEditorDispatch();
    const viewer = useCesiumViewer();
    const rowRefs = useRef(new Map<string, HTMLLIElement>());

    // Keep the selected row visible when selection changes (incl. via map pick).
    useEffect(() => {
        if (!selectedId) return;
        rowRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest' });
    }, [selectedId]);

    if (objects.length === 0) {
        return (
            <div className={s.empty}>
                <Typography className={s['empty-title']} variant="text-sm">
                    No objects in scene
                </Typography>
                <Typography className={s['empty-hint']} variant="text-xs">
                    Add from the Assets tab
                </Typography>
            </div>
        );
    }

    return (
        <ul className={s.list}>
            {objects.map((object) => {
                const selected = object.id === selectedId;
                return (
                    <li
                        key={object.id}
                        className={clsx(s.row, selected && s['row--selected'])}
                        ref={(el) => {
                            if (el) rowRefs.current.set(object.id, el);
                            else rowRefs.current.delete(object.id);
                        }}
                    >
                        <button
                            type="button"
                            className={clsx(s.item, 'focus-primary')}
                            aria-pressed={selected}
                            onClick={() => {
                                dispatch({ type: 'select', id: object.id });
                            }}
                        >
                            <CubeIcon className={s.icon} />
                            <Typography className={clsx(s.label, 'truncate')} variant="text-sm" render={<span />}>
                                {object.name}
                            </Typography>
                        </button>
                        <Menu.Root
                            onOpenChange={(open) => {
                                // Opening the menu selects the row so its actions target this object.
                                if (open) {
                                    dispatch({ type: 'select', id: object.id });
                                }
                            }}
                        >
                            <Menu.Trigger
                                className={clsx(s['menu-trigger'], 'focus-primary')}
                                aria-label={`Actions for ${object.name}`}
                            >
                                <DotsIcon className={s['menu-icon']} />
                            </Menu.Trigger>
                            <Menu.Portal>
                                <Menu.Positioner side="bottom" align="start" sideOffset={4}>
                                    <Menu.Popup render={<PopupWrapper className={s.popup} />}>
                                        <Menu.Item
                                            className={s['menu-item']}
                                            onClick={() => {
                                                if (viewer) flyToObject(viewer, object);
                                            }}
                                            render={
                                                <OptionItem
                                                    className={s['menu-item']}
                                                    variant="surface"
                                                    leftAddon={<Grid2Square4Icon className={s['menu-item-icon']} />}
                                                >
                                                    Zoom to Selected
                                                </OptionItem>
                                            }
                                        />
                                        <Menu.Item
                                            className={s['menu-item']}
                                            onClick={() => {
                                                dispatch({ type: 'remove', id: object.id });
                                            }}
                                            render={
                                                <OptionItem
                                                    className={s['menu-item']}
                                                    variant="surface"
                                                    leftAddon={<TrashIcon className={s['menu-item-icon']} />}
                                                >
                                                    Delete Object
                                                </OptionItem>
                                            }
                                        />
                                    </Menu.Popup>
                                </Menu.Positioner>
                            </Menu.Portal>
                        </Menu.Root>
                    </li>
                );
            })}
        </ul>
    );
};
