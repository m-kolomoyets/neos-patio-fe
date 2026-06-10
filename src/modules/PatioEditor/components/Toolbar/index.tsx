import type { AutosaveStatus } from '../../hooks/useAutosavePatio';
import RedoIcon from '@/icons/redo_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import UndoIcon from '@/icons/undo_24.svg?react';
// import type { EditorMode } from '../../types';
import clsx from 'clsx';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Button } from '@/components/ui/Button';
import { useEditorDispatch, useEditorHistoryFlags, useEditorState } from '../../context/EditorContext';
import s from './styles.module.css';

// const MODES: { mode: EditorMode; label: string }[] = [
//     { mode: 'translate', label: 'Move' },
//     { mode: 'rotate', label: 'Rotate' },
//     { mode: 'scale', label: 'Scale' },
// ];

const STATUS_LABEL: Record<AutosaveStatus, string> = {
    idle: 'Saved',
    saving: 'Saving…',
    saved: 'Saved',
};

type ToolbarProps = {
    saveStatus: AutosaveStatus;
};

export const Toolbar: React.FC<ToolbarProps> = ({ saveStatus }) => {
    // const { mode } = useEditorState();
    const dispatch = useEditorDispatch();
    const { canUndo, canRedo } = useEditorHistoryFlags();
    const { selectedId } = useEditorState();

    return (
        <div className={clsx(s.bar, 'surface-regular')}>
            {/* {MODES.map((entry) => {
                return (
                    <button
                        key={entry.mode}
                        type="button"
                        className={s.button}
                        data-active={entry.mode === mode}
                        onClick={() => {
                            dispatch({ type: 'setMode', mode: entry.mode });
                        }}
                    >
                        {entry.label}
                    </button>
                );
            })}
            <span className={s.divider} /> */}
            <span className={s.status} data-status={saveStatus}>
                {STATUS_LABEL[saveStatus]}
            </span>
            <div className={s['button-group']}>
                <Button
                    disabled={!canUndo}
                    className={s.button}
                    variant="link"
                    title="Undo"
                    size="sm"
                    isIcon
                    onClick={() => {
                        dispatch({ type: 'undo' });
                    }}
                >
                    <UndoIcon />
                    <span className="sr-only">Undo</span>
                </Button>
                <Button
                    disabled={!canRedo}
                    className={s.button}
                    variant="link"
                    title="Redo"
                    size="sm"
                    isIcon
                    onClick={() => {
                        dispatch({ type: 'redo' });
                    }}
                >
                    <RedoIcon />
                    <span className="sr-only">Redo</span>
                </Button>
                {selectedId ? (
                    <Button
                        className={s.button}
                        variant="link"
                        title="Delete"
                        size="sm"
                        isIcon
                        onClick={() => {
                            dispatch({ type: 'remove', id: selectedId });
                        }}
                    >
                        <TrashIcon />
                        <span className="sr-only">Delete</span>
                    </Button>
                ) : null}
            </div>
            <ConnectWalletButton className={s['connect-wallet']} />
        </div>
    );
};
