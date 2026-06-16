import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Model3D } from '@/services/models/types';
import { createContext, useCallback, useReducer, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { queryClient } from '@/lib/@queryClient';
import { useSafeContext } from '@/hooks/useSafeContext';
import {
    useDeleteModelMutation,
    useUploadModelMutation,
    useUploadModelThumbnailMutation,
} from '@/services/models/queries';
import { modelsKeys } from '@/services/models/queryKeys';
import { toast } from '@/components/ui/Toast';
import { getDefaultModelName } from '../components/UploadModelFlow/utils/getDefaultModelName';

const PARSE_ERROR_MESSAGE = 'Could not read that model. Try a different .glb / .gltf file.';
const UPLOAD_ERROR_MESSAGE = 'Upload failed. Please try again.';
const THUMBNAIL_ERROR_MESSAGE = 'Could not save the thumbnail.';
const DELETE_ERROR_MESSAGE = 'Could not delete the uploaded model.';

/**
 * Single active upload, modelled as a discriminated union:
 * - `idle` — dialog closed, nothing in flight.
 * - `selecting` — picker open; `file`/`error` track the current selection.
 * - `uploading` — both tracks (local parse ∥ mock API) running; `progress` is the API track.
 * - `error` — upload API failed; retains `file` for retry.
 * - `preview` — both tracks succeeded; parsed `gltf` + issued `modelId` ready.
 */
export type UploadModelState =
    | { status: 'idle' }
    | { status: 'selecting'; file: File | null; error: string | null }
    | { status: 'uploading'; file: File; objectUrl: string; progress: number }
    | { status: 'error'; file: File; error: string }
    | {
          status: 'preview';
          file: File;
          objectUrl: string;
          gltf: GLTF;
          modelId: string;
          /** Editable asset name; defaulted from the filename without its extension. */
          name: string;
          /** Captured snapshot `Blob` + its derived object URL; null until the first capture. */
          thumbnailBlob: Blob | null;
          thumbnailUrl: string | null;
      };

type UploadModelAction =
    | { type: 'open' }
    | { type: 'selectFile'; file: File }
    | { type: 'setError'; error: string }
    | { type: 'clearFile' }
    | { type: 'uploadStarted'; objectUrl: string }
    | { type: 'progress'; progress: number }
    | { type: 'previewReady'; gltf: GLTF; modelId: string }
    | { type: 'setName'; name: string }
    | { type: 'setThumbnail'; blob: Blob; url: string }
    | { type: 'uploadFailed'; error: string }
    | { type: 'parseFailed'; error: string }
    | { type: 'reset' };

type UploadModelContextValue = {
    state: UploadModelState;
    /** Open the picker (idle → selecting). */
    open: () => void;
    /** Store a validated file in the picker. */
    selectFile: (_file: File) => void;
    /** Surface an inline validation error in the picker. */
    setError: (_error: string) => void;
    /** Clear the current picker selection. */
    clearFile: () => void;
    /** Kick off the parallel parse + upload tracks (selecting → uploading). */
    startUpload: () => void;
    /** Re-run the upload with the same file after a failure (error → uploading). */
    retry: () => void;
    /** Store a freshly captured thumbnail; revokes the previous derived object URL. */
    captureThumbnail: (_blob: Blob) => void;
    /** Update the editable asset name in the preview step. */
    setName: (_name: string) => void;
    /** Persist the asset: upload the thumbnail, append to the list, toast, and close. */
    save: () => void;
    /** Abort anything in flight, revoke object URLs, and return to idle. */
    discard: () => void;
};

const reducer = (state: UploadModelState, action: UploadModelAction): UploadModelState => {
    switch (action.type) {
        case 'open':
            return { status: 'selecting', file: null, error: null };
        case 'selectFile':
            return { status: 'selecting', file: action.file, error: null };
        case 'setError':
            return { status: 'selecting', file: null, error: action.error };
        case 'clearFile':
            return { status: 'selecting', file: null, error: null };
        case 'uploadStarted':
            // Enter the uploading track from a fresh pick (`selecting`) or a retry (`error`).
            if (state.status === 'selecting' && state.file) {
                return { status: 'uploading', file: state.file, objectUrl: action.objectUrl, progress: 0 };
            }
            if (state.status === 'error') {
                return { status: 'uploading', file: state.file, objectUrl: action.objectUrl, progress: 0 };
            }
            return state;
        case 'progress':
            if (state.status !== 'uploading') {
                return state;
            }
            return { ...state, progress: action.progress };
        case 'previewReady':
            if (state.status !== 'uploading') {
                return state;
            }
            return {
                status: 'preview',
                file: state.file,
                objectUrl: state.objectUrl,
                gltf: action.gltf,
                modelId: action.modelId,
                name: getDefaultModelName(state.file.name),
                thumbnailBlob: null,
                thumbnailUrl: null,
            };
        case 'setName':
            if (state.status !== 'preview') {
                return state;
            }
            return { ...state, name: action.name };
        case 'setThumbnail':
            if (state.status !== 'preview') {
                return state;
            }
            return { ...state, thumbnailBlob: action.blob, thumbnailUrl: action.url };
        case 'uploadFailed':
            if (state.status !== 'uploading') {
                return state;
            }
            return { status: 'error', file: state.file, error: action.error };
        case 'parseFailed':
            // Send the user back to the picker so they can choose a different file.
            return { status: 'selecting', file: null, error: action.error };
        case 'reset':
            return { status: 'idle' };
        default:
            return state;
    }
};

const UploadModelContext = createContext<UploadModelContextValue | undefined>(undefined);
UploadModelContext.displayName = 'UploadModelContext';

/**
 * Single source of truth for the active model upload. Mounted at the PatioEditor
 * root and consumed by both the upload dialog and the sidebar's pending item, so
 * the two stay in sync off one state machine. Supports one active upload at a time.
 */
export const UploadModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, { status: 'idle' });
    const uploadMutation = useUploadModelMutation();
    const uploadThumbnailMutation = useUploadModelThumbnailMutation();
    const deleteMutation = useDeleteModelMutation();

    const abortRef = useRef<AbortController | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const thumbnailUrlRef = useRef<string | null>(null);

    const revokeObjectUrl = useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    }, []);

    const revokeThumbnailUrl = useCallback(() => {
        if (thumbnailUrlRef.current) {
            URL.revokeObjectURL(thumbnailUrlRef.current);
            thumbnailUrlRef.current = null;
        }
    }, []);

    const open = useCallback(() => {
        dispatch({ type: 'open' });
    }, []);

    const selectFile = useCallback((file: File) => {
        dispatch({ type: 'selectFile', file });
    }, []);

    const setError = useCallback((error: string) => {
        dispatch({ type: 'setError', error });
    }, []);

    const clearFile = useCallback(() => {
        dispatch({ type: 'clearFile' });
    }, []);

    // Shared by the initial upload and retry: spins up both tracks for the given file.
    const runUpload = useCallback(
        async (file: File) => {
            const objectUrl = URL.createObjectURL(file);
            objectUrlRef.current = objectUrl;

            const controller = new AbortController();
            abortRef.current = controller;

            dispatch({ type: 'uploadStarted', objectUrl });

            // Track A: parse the model locally. Track B: mock upload with progress.
            // A failed parse aborts the upload so we don't wait on a doomed flow.
            let parseFailed = false;
            const parsePromise = new GLTFLoader().loadAsync(objectUrl).catch((parseError) => {
                parseFailed = true;
                controller.abort();
                throw parseError;
            });
            const uploadPromise = uploadMutation.mutateAsync({
                file,
                signal: controller.signal,
                onProgress: (progress) => {
                    dispatch({ type: 'progress', progress });
                },
            });

            const [parseResult, uploadResult] = await Promise.allSettled([parsePromise, uploadPromise]);

            // User discarded mid-flight — discard() already tore everything down.
            if (controller.signal.aborted && !parseFailed) {
                return;
            }

            if (parseFailed) {
                revokeObjectUrl();
                dispatch({ type: 'parseFailed', error: PARSE_ERROR_MESSAGE });
                toast.error(PARSE_ERROR_MESSAGE);
                return;
            }

            if (uploadResult.status === 'rejected') {
                revokeObjectUrl();
                dispatch({ type: 'uploadFailed', error: UPLOAD_ERROR_MESSAGE });
                toast.error(UPLOAD_ERROR_MESSAGE);
                return;
            }

            const gltf = (parseResult as PromiseFulfilledResult<GLTF>).value;
            dispatch({ type: 'previewReady', gltf, modelId: uploadResult.value.id });
        },
        [uploadMutation, revokeObjectUrl]
    );

    const startUpload = useCallback(() => {
        if (state.status !== 'selecting' || !state.file) {
            return;
        }
        runUpload(state.file);
    }, [state, runUpload]);

    const retry = useCallback(() => {
        if (state.status !== 'error') {
            return;
        }
        runUpload(state.file);
    }, [state, runUpload]);

    const captureThumbnail = useCallback(
        (blob: Blob) => {
            // Drop the previous snapshot's URL before deriving a new one — re-captures
            // would otherwise leak an object URL per click.
            revokeThumbnailUrl();
            const url = URL.createObjectURL(blob);
            thumbnailUrlRef.current = url;
            dispatch({ type: 'setThumbnail', blob, url });
        },
        [revokeThumbnailUrl]
    );

    const setName = useCallback((name: string) => {
        dispatch({ type: 'setName', name });
    }, []);

    const save = useCallback(() => {
        if (state.status !== 'preview') {
            return;
        }
        const name = state.name.trim();
        if (!name) {
            return;
        }

        const { modelId, objectUrl, thumbnailUrl, thumbnailBlob } = state;

        const model: Model3D = {
            id: modelId,
            name,
            gltfUrl: objectUrl,
            previewUrl: thumbnailUrl ?? '',
        };
        // Append client-side; the fixtures query never refetches this asset.
        queryClient.setQueryData<Model3D[]>(modelsKeys.list(), (prev) => {
            return [...(prev ?? []), model];
        });

        // Ownership of the object URLs transfers to the saved asset — null the refs
        // (without revoking) so teardown doesn't pull them out from under it.
        objectUrlRef.current = null;
        thumbnailUrlRef.current = null;
        abortRef.current = null;
        dispatch({ type: 'reset' });

        toast.success({ title: 'Asset saved', description: `${name} was added to your assets.` });

        // Mock thumbnail persistence — non-blocking; a failure only toasts.
        if (thumbnailBlob) {
            uploadThumbnailMutation.mutateAsync({ id: modelId, blob: thumbnailBlob }).catch(() => {
                toast.error(THUMBNAIL_ERROR_MESSAGE);
            });
        }
    }, [state, uploadThumbnailMutation]);

    const discard = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;

        // A model id is only issued once the upload succeeds (preview step) — clean up
        // the persisted asset. Mock delete is non-blocking; a failure only toasts.
        if (state.status === 'preview') {
            deleteMutation.mutateAsync(state.modelId).catch(() => {
                toast.error(DELETE_ERROR_MESSAGE);
            });
        }

        revokeObjectUrl();
        revokeThumbnailUrl();
        dispatch({ type: 'reset' });
    }, [state, deleteMutation, revokeObjectUrl, revokeThumbnailUrl]);

    return (
        <UploadModelContext
            value={{
                state,
                open,
                selectFile,
                setError,
                clearFile,
                startUpload,
                retry,
                captureThumbnail,
                setName,
                save,
                discard,
            }}
        >
            {children}
        </UploadModelContext>
    );
};

/** Access the active upload state + actions. Must be used within an {@link UploadModelProvider}. */
export const useUploadModel = (): UploadModelContextValue => {
    return useSafeContext(UploadModelContext);
};
