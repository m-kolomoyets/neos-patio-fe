import type { MapInteraction, WithClassName } from '@/lib/types';
import type { PatioBounds } from '@/services/patios/types';

export type CesiumMapProps = WithClassName<{
    bounds: PatioBounds;
    /**
     * The patio's authored look-at offset above ground (`Patio.height`). Folded
     * into the final framing so the camera aims at the patio's focal point
     * instead of a spot under the tileset mesh. Defaults to `0` (ground plane).
     */
    height?: number;
    /**
     * How the camera may be driven. `'edit'` (default) preserves the editor's
     * free controller; `'view'` constrains it to orbit + zoom around the framed
     * patio so the camera can never fly away.
     */
    interaction?: MapInteraction;
}>;
