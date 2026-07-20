import { useMediaQuery } from '@react-hookz/web';

export const useIsMobileLandscape = () => {
    return useMediaQuery('(max-width: 1023px) and (orientation: landscape)') ?? false;
};
