import { useMediaQuery } from '@react-hookz/web';

export const useIsMobile = () => {
    return useMediaQuery('(max-width: 767px)') ?? false;
};
