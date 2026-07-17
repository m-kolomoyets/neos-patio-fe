import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { PatioFiltersDrawer } from './components/PatioFiltersDrawer';
import { PatioFiltersPopover } from './components/PatioFiltersPopover';

export const PatioFilters: React.FC = () => {
    const isMobile = useIsMobile();

    return isMobile ? <PatioFiltersDrawer /> : <PatioFiltersPopover />;
};
