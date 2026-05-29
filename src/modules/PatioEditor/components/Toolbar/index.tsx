import type { AutosaveStatus } from '../../hooks/useAutosavePatio';
import type { EditorMode } from '../../types';
import { useEditorDispatch, useEditorHistoryFlags, useEditorState } from '../../context/EditorContext';
import s from './styles.module.css';

const MODES: { mode: EditorMode; label: string }[] = [
    { mode: 'translate', label: 'Move' },
    { mode: 'rotate', label: 'Rotate' },
    { mode: 'scale', label: 'Scale' },
];

const STATUS_LABEL: Record<AutosaveStatus, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
};

type ToolbarProps = {
    saveStatus: AutosaveStatus;
};

export const Toolbar: React.FC<ToolbarProps> = ({ saveStatus }) => {
    const { mode } = useEditorState();
    const dispatch = useEditorDispatch();
    const { canUndo, canRedo } = useEditorHistoryFlags();

    return (
        <div className={s.bar}>
            {MODES.map((entry) => {
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
            <span className={s.divider} />
            <button
                type="button"
                className={s.button}
                disabled={!canUndo}
                onClick={() => {
                    dispatch({ type: 'undo' });
                }}
            >
                Undo
            </button>
            <button
                type="button"
                className={s.button}
                disabled={!canRedo}
                onClick={() => {
                    dispatch({ type: 'redo' });
                }}
            >
                Redo
            </button>
            {saveStatus !== 'idle' ? (
                <span className={s.status} data-status={saveStatus}>
                    {STATUS_LABEL[saveStatus]}
                </span>
            ) : null}
        </div>
    );
};
