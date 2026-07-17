import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { PatioSortDrawer } from './components/PatioSortDrawer';
import { PatioSortMenu } from './components/PatioSortMenu';

export const PatioSort: React.FC = () => {
    const isMobile = useIsMobile();

    return isMobile ? <PatioSortDrawer /> : <PatioSortMenu />;
};
