import type { PatioBounds, PlacedObject } from '@/services/patios/types';
import type { EditorMode } from '../types';
import type { SceneBounds } from '../utils/boundsClamp';
import type { HistoryStacks } from '../utils/undoRedoHistory';
import { createContext, useMemo, useReducer } from 'react';
import { useSafeContext } from '@/hooks/useSafeContext';
import { clampToSceneBounds, deriveSceneBounds } from '../utils/boundsClamp';
import { boundsAnchor, geoToScene } from '../utils/geoSceneProjection';
import {
    canRedo as canRedoStacks,
    canUndo as canUndoStacks,
    createEmptyHistory,
    pushHistory,
    redoHistory,
    undoHistory,
} from '../utils/undoRedoHistory';

type LngLat = { lng: number; lat: number };

type EditorState = {
    objects: PlacedObject[];
    selectedId: string | null;
    mode: EditorMode;
    mapCenter: LngLat;
    bounds: PatioBounds;
    sceneBounds: SceneBounds;
    history: HistoryStacks<PlacedObject[]>;
};

type EditorAction =
    | { type: 'add'; modelId: string }
    | { type: 'remove'; id: string }
    | { type: 'transform'; id: string; patch: Partial<Omit<PlacedObject, 'id' | 'modelId'>> }
    | { type: 'select'; id: string | null }
    | { type: 'setMode'; mode: EditorMode }
    | { type: 'setMapCenter'; center: LngLat }
    | { type: 'undo' }
    | { type: 'redo' };

const DEFAULT_Y = 0;
const DEFAULT_ROT = 0;
const DEFAULT_SCALE = 1;

const reducer = (state: EditorState, action: EditorAction): EditorState => {
    switch (action.type) {
        case 'add': {
            const scene = geoToScene(boundsAnchor(state.bounds), state.mapCenter);
            const clamped = clampToSceneBounds(state.sceneBounds, { x: scene.x, z: scene.z });
            const next: PlacedObject = {
                id: crypto.randomUUID(),
                modelId: action.modelId,
                x: clamped.x,
                y: DEFAULT_Y,
                z: clamped.z,
                rotX: DEFAULT_ROT,
                rotY: DEFAULT_ROT,
                rotZ: DEFAULT_ROT,
                scale: DEFAULT_SCALE,
            };
            return {
                ...state,
                objects: [...state.objects, next],
                selectedId: next.id,
                history: pushHistory(state.history, state.objects),
            };
        }
        case 'remove': {
            return {
                ...state,
                objects: state.objects.filter((o) => {
                    return o.id !== action.id;
                }),
                selectedId: state.selectedId === action.id ? null : state.selectedId,
                history: pushHistory(state.history, state.objects),
            };
        }
        case 'transform': {
            return {
                ...state,
                objects: state.objects.map((o) => {
                    if (o.id !== action.id) return o;
                    const merged = { ...o, ...action.patch };
                    const clamped = clampToSceneBounds(state.sceneBounds, { x: merged.x, z: merged.z });
                    return { ...merged, x: clamped.x, z: clamped.z };
                }),
                history: pushHistory(state.history, state.objects),
            };
        }
        case 'undo': {
            const result = undoHistory(state.history, state.objects);
            if (!result) return state;
            return {
                ...state,
                objects: result.next,
                history: result.stacks,
                selectedId: result.next.some((o) => {
                    return o.id === state.selectedId;
                })
                    ? state.selectedId
                    : null,
            };
        }
        case 'redo': {
            const result = redoHistory(state.history, state.objects);
            if (!result) return state;
            return {
                ...state,
                objects: result.next,
                history: result.stacks,
                selectedId: result.next.some((o) => {
                    return o.id === state.selectedId;
                })
                    ? state.selectedId
                    : null,
            };
        }
        case 'select':
            return { ...state, selectedId: action.id };
        case 'setMode':
            return { ...state, mode: action.mode };
        case 'setMapCenter':
            return { ...state, mapCenter: action.center };
        default:
            return state;
    }
};

type EditorContextValue = {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;
};

export const EditorContext = createContext<EditorContextValue | null>(null);
EditorContext.displayName = 'EditorContext';

type EditorProviderProps = React.PropsWithChildren<{
    initialObjects: PlacedObject[];
    initialMapCenter: LngLat;
    bounds: PatioBounds;
}>;

export const EditorProvider: React.FC<EditorProviderProps> = ({
    initialObjects,
    initialMapCenter,
    bounds,
    children,
}) => {
    const [state, dispatch] = useReducer(reducer, {
        objects: initialObjects,
        selectedId: null,
        mode: 'translate',
        mapCenter: initialMapCenter,
        bounds,
        sceneBounds: deriveSceneBounds(bounds),
        history: createEmptyHistory<PlacedObject[]>(),
    });

    const value = useMemo(() => {
        return { state, dispatch };
    }, [state]);

    return <EditorContext value={value}>{children}</EditorContext>;
};

export const useEditorState = (): EditorState => {
    const ctx = useSafeContext(EditorContext);
    return ctx!.state;
};

export const useEditorDispatch = (): React.Dispatch<EditorAction> => {
    const ctx = useSafeContext(EditorContext);
    return ctx!.dispatch;
};

export const useEditorHistoryFlags = () => {
    const { history } = useEditorState();
    return { canUndo: canUndoStacks(history), canRedo: canRedoStacks(history) };
};
