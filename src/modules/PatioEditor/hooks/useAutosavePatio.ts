import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updatePatioObjectsMutationOptions } from '@/services/patios/queries';
import { useEditorState } from '../context/EditorContext';

export type AutosaveStatus = 'idle' | 'saving' | 'saved';

const DEBOUNCE_MS = 600;
const SAVED_INDICATOR_MS = 2000;

export const useAutosavePatio = (id: string): { status: AutosaveStatus } => {
    const { objects } = useEditorState();
    const { mutate } = useMutation(updatePatioObjectsMutationOptions(id));
    const [status, setStatus] = useState<AutosaveStatus>('idle');
    const isFirstRef = useRef(true);
    const savedTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isFirstRef.current) {
            isFirstRef.current = false;
            return;
        }

        const handle = window.setTimeout(() => {
            setStatus('saving');
            mutate(objects, {
                onSuccess() {
                    setStatus('saved');
                    if (savedTimerRef.current) {
                        window.clearTimeout(savedTimerRef.current);
                    }
                    savedTimerRef.current = window.setTimeout(() => {
                        setStatus('idle');
                    }, SAVED_INDICATOR_MS);
                },
                onError() {
                    setStatus('idle');
                },
            });
        }, DEBOUNCE_MS);

        return () => {
            window.clearTimeout(handle);
        };
    }, [objects, mutate]);

    useEffect(() => {
        return () => {
            if (savedTimerRef.current) {
                window.clearTimeout(savedTimerRef.current);
            }
        };
    }, []);

    return { status };
};
