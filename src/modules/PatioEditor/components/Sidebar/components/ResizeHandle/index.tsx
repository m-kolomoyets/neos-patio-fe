import clsx from 'clsx';
import s from './styles.module.css';

type ResizeHandleProps = {
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    onPointerDown: (_event: React.PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (_event: React.KeyboardEvent<HTMLDivElement>) => void;
    onDoubleClick: () => void;
};

/**
 * Drag handle on the sidebar's right edge. Presentational — width state and all
 * interaction logic live in `useSidebarResize`; props are spread in from there.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = (props) => {
    return (
        <div
            className={clsx(s.handle)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={0}
            {...props}
        >
            <span className={s.grip} aria-hidden="true" />
        </div>
    );
};
