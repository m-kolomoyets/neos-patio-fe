import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Model3D } from '@/services/models/types';
import type { BundleManifest, ModelBundle } from '../components/UploadModelFlow/utils/modelBundle';
import { createContext, useCallback, useReducer, useRef } from 'react';
import { queryClient } from '@/lib/@queryClient';
import { useSafeContext } from '@/hooks/useSafeContext';
import {
    useDeleteModelMutation,
    useUploadModelMutation,
    useUploadModelThumbnailMutation,
} from '@/services/models/queries';
import { modelsKeys } from '@/services/models/queryKeys';
import { toast } from '@/components/ui/Toast';
import { UPLOAD_FLOW_DEBUG } from '../constants';
import { createBundleLoader } from '../components/UploadModelFlow/utils/createBundleLoader';
import {
    getBundleDefaultName,
    getBundleEntryUrl,
    materializeBundle,
} from '../components/UploadModelFlow/utils/modelBundle';

const PARSE_ERROR_MESSAGE = 'Could not read that model. Try a different .glb / .gltf file.';
const UPLOAD_ERROR_MESSAGE = 'Upload failed. Please try again.';
const THUMBNAIL_ERROR_MESSAGE = 'Could not save the thumbnail.';
const DELETE_ERROR_MESSAGE = 'Could not delete the uploaded model.';

/**
 * Single active upload, modelled as a discriminated union:
 * - `idle` — dialog closed, nothing in flight.
 * - `selecting` — picker open; the bundle is gathered + validated here, before upload.
 * - `uploading` — both tracks (local parse ∥ mock API) running; `progress` is the API track.
 * - `error` — selection/upload failed. `manifest` is the retryable bundle for an upload
 *   failure, or `null` for a validation / parse failure (where retry reopens the picker).
 * - `preview` — both tracks succeeded; parsed `gltf` + issued `modelId` ready.
 *
 * From `uploading` onward the selection is carried as a normalized {@link ModelBundle},
 * so a single file and a multi-file glTF bundle flow through identically.
 */
export type UploadModelState =
    | { status: 'idle' }
    | { status: 'selecting' }
    | { status: 'uploading'; bundle: ModelBundle; progress: number }
    | { status: 'error'; manifest: BundleManifest | null; error: string }
    | {
          status: 'preview';
          bundle: ModelBundle;
          gltf: GLTF;
          modelId: string;
          /** Editable asset name; defaulted from the folder/zip or filename. */
          name: string;
          /** Captured snapshot `Blob` + its derived object URL; null until the first capture. */
          thumbnailBlob: Blob | null;
          thumbnailUrl: string | null;
      };

type UploadModelAction =
    | { type: 'open' }
    | { type: 'setError'; error: string }
    | { type: 'uploadStarted'; bundle: ModelBundle }
    | { type: 'progress'; progress: number }
    | { type: 'previewReady'; gltf: GLTF; modelId: string }
    | { type: 'setName'; name: string }
    | { type: 'setThumbnail'; blob: Blob; url: string }
    | { type: 'uploadFailed'; manifest: BundleManifest; error: string }
    | { type: 'parseFailed'; error: string }
    | { type: 'reset' };

type UploadModelContextValue = {
    state: UploadModelState;
    /** Open the picker (idle → selecting). */
    open: () => void;
    /** Surface a validation / pre-processing failure on the error screen. */
    setError: (_error: string) => void;
    /** Kick off the parallel parse + upload tracks for a validated bundle. */
    startUpload: (_manifest: BundleManifest) => void;
    /** Recover from the error screen: re-upload the same bundle, or reopen the picker. */
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
            return { status: 'selecting' };
        case 'setError':
            // Validation / pre-processing failed — show the error; retry reopens the picker.
            return { status: 'error', manifest: null, error: action.error };
        case 'uploadStarted':
            // Enter the uploading track from a fresh pick (`selecting`) or a retry (`error`).
            if (state.status === 'selecting' || state.status === 'error') {
                return { status: 'uploading', bundle: action.bundle, progress: 0 };
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
                bundle: state.bundle,
                gltf: action.gltf,
                modelId: action.modelId,
                name: getBundleDefaultName(state.bundle),
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
            // Retain the manifest so retry can re-materialize the bundle and re-upload.
            return { status: 'error', manifest: action.manifest, error: action.error };
        case 'parseFailed':
            // Bad model content — surface the error screen; retry reopens the picker
            // (re-uploading the same unreadable bundle would just fail again).
            return { status: 'error', manifest: null, error: action.error };
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
    // Every object URL minted for the active bundle — revoked together on teardown.
    const bundleUrlsRef = useRef<string[]>([]);
    const thumbnailUrlRef = useRef<string | null>(null);

    const registerBundleUrls = useCallback((bundle: ModelBundle) => {
        bundleUrlsRef.current = [...bundleUrlsRef.current, ...bundle.blobUrls.values()];
    }, []);

    const revokeBundleUrls = useCallback(() => {
        bundleUrlsRef.current.forEach((url) => {
            URL.revokeObjectURL(url);
        });
        bundleUrlsRef.current = [];
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

    const setError = useCallback((error: string) => {
        dispatch({ type: 'setError', error });
    }, []);

    // Shared by the initial upload and retry: materializes the validated manifest into a
    // live bundle, then spins up both tracks (local parse ∥ mock API upload).
    const runUpload = useCallback(
        async (manifest: BundleManifest) => {
            const bundle = materializeBundle(manifest);
            registerBundleUrls(bundle);

            const controller = new AbortController();
            abortRef.current = controller;

            dispatch({ type: 'uploadStarted', bundle });

            // Track B starts first so the mock upload runs while the loader (and its lazy
            // Draco decoder) initializes.
            const uploadPromise = uploadMutation.mutateAsync({
                entryPath: bundle.entry.path,
                files: bundle.payloadFiles,
                signal: controller.signal,
                onProgress: (progress) => {
                    dispatch({ type: 'progress', progress });
                },
            });

            // Track A: parse the model locally via the bundle-aware loader. A failed parse
            // aborts the upload so we don't wait on a doomed flow.
            let parseFailed = false;
            const parsePromise = createBundleLoader(bundle)
                .then((loader) => {
                    return loader.loadAsync(bundle.entry.path);
                })
                .catch((parseError) => {
                    parseFailed = true;
                    controller.abort();
                    throw parseError;
                });

            const [parseResult, uploadResult] = await Promise.allSettled([parsePromise, uploadPromise]);

            // User discarded mid-flight — discard() already tore everything down.
            if (controller.signal.aborted && !parseFailed) {
                return;
            }

            if (parseFailed) {
                revokeBundleUrls();
                dispatch({ type: 'parseFailed', error: PARSE_ERROR_MESSAGE });
                toast.error(PARSE_ERROR_MESSAGE);
                return;
            }

            if (uploadResult.status === 'rejected') {
                revokeBundleUrls();
                dispatch({ type: 'uploadFailed', manifest, error: UPLOAD_ERROR_MESSAGE });
                toast.error(UPLOAD_ERROR_MESSAGE);
                return;
            }

            // Debug: freeze on the uploading step instead of advancing to preview.
            if (UPLOAD_FLOW_DEBUG.stopAtUploading) {
                return;
            }

            const gltf = (parseResult as PromiseFulfilledResult<GLTF>).value;
            dispatch({ type: 'previewReady', gltf, modelId: uploadResult.value.id });
        },
        [uploadMutation, registerBundleUrls, revokeBundleUrls]
    );

    const startUpload = useCallback(
        (manifest: BundleManifest) => {
            runUpload(manifest);
        },
        [runUpload]
    );

    const retry = useCallback(() => {
        if (state.status !== 'error') {
            return;
        }
        // Upload failure retains its manifest → re-run the upload. A validation / parse
        // failure has no usable manifest → drop back to the picker for a fresh pick.
        if (state.manifest) {
            runUpload(state.manifest);
            return;
        }
        dispatch({ type: 'open' });
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

        const { modelId, bundle, thumbnailUrl, thumbnailBlob } = state;

        const model: Model3D = {
            id: modelId,
            name,
            gltfUrl: getBundleEntryUrl(bundle),
            previewUrl: thumbnailUrl ?? '',
        };
        // Append client-side; the fixtures query never refetches this asset.
        queryClient.setQueryData<Model3D[]>(modelsKeys.list(), (prev) => {
            return [...(prev ?? []), model];
        });

        // Ownership of the bundle's object URLs transfers to the saved asset — drop the
        // refs (without revoking) so teardown doesn't pull them out from under it. The
        // whole bundle stays alive for the session so the catalog tile keeps rendering.
        bundleUrlsRef.current = [];
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

        revokeBundleUrls();
        revokeThumbnailUrl();
        dispatch({ type: 'reset' });
    }, [state, deleteMutation, revokeBundleUrls, revokeThumbnailUrl]);

    return (
        <UploadModelContext
            value={{
                state,
                open,
                setError,
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
