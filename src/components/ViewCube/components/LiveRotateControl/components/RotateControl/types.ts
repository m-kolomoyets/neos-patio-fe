import type { WithClassName } from '@/lib/types';

export type RotateControlProps = WithClassName<{
    onRotateLeft: () => void;
    onRotateRight: () => void;
}>;
