import { useEffect } from 'react';
import { useEditorDispatch, useEditorState } from '../context/EditorContext';

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

/** Deletes the selected object on Delete/Backspace, unless typing into a field. */
export const useDeleteSelectedShortcut = (): void => {
    const { selectedId } = useEditorState();
    const dispatch = useEditorDispatch();

    useEffect(() => {
        if (!selectedId) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            if (isEditableTarget(e.target)) return;
            e.preventDefault();
            dispatch({ type: 'remove', id: selectedId });
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [selectedId, dispatch]);
};
