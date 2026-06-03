import type { Object3D } from 'three';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, NormalBlending, Vector2 } from 'three';
import { CopyShader, EffectComposer, OutlinePass, RenderPass, ShaderPass } from 'three-stdlib';
import { useEditorState } from '../../../../context/EditorContext';
import { EDITOR_MODEL_USERDATA_KEY } from '../SelectionRaycaster';

const OUTLINE_COLOR = new Color('#ffffff');

// Find the gltf model root for the given id. Targets the model node (not the
// wrapper group), so the outline mask only ever contains model meshes — never
// the transform gizmo, which lives in a separate scene node.
const findModelByEditorId = (root: Object3D, id: string): Object3D | null => {
    let found: Object3D | null = null;
    root.traverse((node) => {
        if (found) return;
        const nodeId = (node.userData as Record<string, unknown>)[EDITOR_MODEL_USERDATA_KEY];
        if (nodeId === id) found = node;
    });
    return found;
};

/**
 * Screen-space contour outline for the selected object.
 *
 * react-three-map draws the Three scene as an overlay on top of MapLibre's
 * framebuffer (`autoClear:false`) — the map pixels are already in the GL buffer
 * and are NOT part of the scene. A stock EffectComposer copies its whole frame
 * to the screen on the final pass, which would overwrite those map pixels. So we
 * hand-build the chain and make the final CopyShader pass blend (NormalBlending,
 * transparent) instead of overwrite: scene pixels (alpha 1) draw over the map,
 * transparent background (alpha 0) leaves the map intact.
 *
 * This component takes over rendering via a `useFrame` with renderPriority > 0:
 * when something is selected it runs the composer, otherwise it falls back to the
 * plain renderer. Everything stays on the demand loop — renders only fire when
 * `invalidate()` is called (selection change, transform drag).
 */
export const SelectionOutline: React.FC = () => {
    const { selectedId } = useEditorState();
    const gl = useThree((s) => {
        return s.gl;
    });
    const scene = useThree((s) => {
        return s.scene;
    });
    const camera = useThree((s) => {
        return s.camera;
    });
    const size = useThree((s) => {
        return s.size;
    });
    const invalidate = useThree((s) => {
        return s.invalidate;
    });

    const { composer, outlinePass } = useMemo(() => {
        const resolution = new Vector2(size.width, size.height);
        const composer = new EffectComposer(gl);
        composer.renderToScreen = true;

        const renderPass = new RenderPass(scene, camera);
        renderPass.clearAlpha = 0;
        composer.addPass(renderPass);

        const outlinePass = new OutlinePass(resolution, scene, camera);
        outlinePass.edgeStrength = 6;
        outlinePass.edgeGlow = 0;
        outlinePass.edgeThickness = 1;
        outlinePass.pulsePeriod = 0;
        outlinePass.visibleEdgeColor.copy(OUTLINE_COLOR);
        outlinePass.hiddenEdgeColor.copy(OUTLINE_COLOR);
        composer.addPass(outlinePass);

        // Final pass: blend the composited frame onto the map instead of
        // overwriting it. Transparent background pixels keep the map visible.
        const copyPass = new ShaderPass(CopyShader);
        copyPass.material.transparent = true;
        copyPass.material.blending = NormalBlending;
        copyPass.material.depthTest = false;
        copyPass.material.depthWrite = false;
        composer.addPass(copyPass);

        return { composer, outlinePass };
    }, [gl, scene, camera, size.width, size.height]);

    // Keep composer + outline pass sized to the drawing buffer.
    useEffect(() => {
        composer.setPixelRatio(gl.getPixelRatio());
        composer.setSize(size.width, size.height);
        outlinePass.resolution.set(size.width, size.height);
    }, [composer, outlinePass, gl, size.width, size.height]);

    // Track the selected Object3D and feed it to the outline pass.
    useEffect(() => {
        if (!selectedId) {
            // eslint-disable-next-line react-hooks/immutability
            outlinePass.selectedObjects = [];
            invalidate();
            return;
        }
        const target = findModelByEditorId(scene, selectedId);
        outlinePass.selectedObjects = target ? [target] : [];
        invalidate();
    }, [selectedId, scene, outlinePass, invalidate]);

    // Dispose GPU resources on unmount.
    useEffect(() => {
        return () => {
            return composer.dispose();
        };
    }, [composer]);

    // Take over the render. renderPriority > 0 disables R3F's automatic render,
    // so we must render every frame ourselves.
    useFrame(() => {
        if (!selectedId || outlinePass.selectedObjects.length === 0) {
            gl.render(scene, camera);
            return;
        }

        // OutlinePass reads the live scene to build both its depth-occluder pass
        // and its selection mask (OutlinePass.js). If the transform gizmo is in
        // the scene while the composer runs, it gets folded into the outlined
        // silhouette — model and gizmo come out as one blob. Hide the gizmo
        // subtrees for the composer pass so they never reach the outline...
        const gizmos: Object3D[] = [];
        scene.traverse((node) => {
            if ((node as { isTransformControls?: boolean }).isTransformControls) {
                gizmos.push(node);
            }
        });

        gizmos.forEach((g) => {
            return (g.visible = false);
        });

        composer.render();

        // ...then draw the gizmo on top of the composite, untouched by the
        // outline. clearDepth so it isn't clipped by leftover scene depth.

        gizmos.forEach((g) => {
            return (g.visible = true);
        });
        // eslint-disable-next-line react-hooks/immutability
        gl.autoClear = false;
        gl.clearDepth();
        gizmos.forEach((g) => {
            return gl.render(g, camera);
        });
    }, 1);

    return null;
};
