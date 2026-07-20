import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { PatioSortDrawer } from './components/PatioSortDrawer';
import { PatioSortMenu } from './components/PatioSortMenu';

export const PatioSort: React.FC = () => {
    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();

    const isMobile = isMobileLandscape || isMobilePortrait;

    return isMobile ? <PatioSortDrawer /> : <PatioSortMenu />;
};
