import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsMobileLandscape } from '@/hooks/useIsMobileLandscape';
import { PatioFiltersDrawer } from './components/PatioFiltersDrawer';
import { PatioFiltersPopover } from './components/PatioFiltersPopover';

export const PatioFilters: React.FC = () => {
    const isMobilePortrait = useIsMobile();
    const isMobileLandscape = useIsMobileLandscape();

    const isMobile = isMobileLandscape || isMobilePortrait;

    return isMobile ? <PatioFiltersDrawer /> : <PatioFiltersPopover />;
};
