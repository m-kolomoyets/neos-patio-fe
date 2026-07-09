import { Activity, useRef, useState } from 'react';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
import SidebarLeftIcon from '@/icons/sidebar-left_24.svg?react';
import SidebarRightIcon from '@/icons/sidebar-right_24.svg?react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { getPatioQueryOptions } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Tabs } from '@/components/ui/Tabs';
import { Typography } from '@/components/ui/Typography';
import { usePatioEditorParams } from '../../hooks/usePatioEditorRouteApi';
import { useSidebarResize } from './hooks/useSidebarResize';
import { ResizeHandle } from './components/ResizeHandle';
import { CatalogPanel } from '../CatalogPanel';
import { ScenePanel } from '../ScenePanel';
import { UploadModelFlow } from '../UploadModelFlow';
import s from './styles.module.css';

type SidebarTab = 'scene' | 'assets';

export const Sidebar: React.FC = () => {
    const { id } = usePatioEditorParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));
    const [tab, setTab] = useState<SidebarTab>('assets');
    const [collapsed, setCollapsed] = useState(false);
    const { width, isResizing, handleProps } = useSidebarResize();
    const sidebarRef = useRef<HTMLElement>(null);

    return (
        <aside
            ref={sidebarRef}
            className={clsx(s.sidebar, 'surface-regular')}
            style={{ width }}
            data-collapsed={collapsed || undefined}
        >
            <header className={s.header}>
                <Button
                    className={s.back}
                    nativeButton={false}
                    render={<Link to="/" />}
                    size="md"
                    variant="link"
                    isIcon
                    title="Back"
                >
                    <ArrowLeftIcon />
                    <span className="sr-only">Back</span>
                </Button>
                <Typography className={clsx(s.title, 'truncate')} variant="text-sm">
                    {patio.name}
                </Typography>
                <Button
                    className={s.collapse}
                    size="md"
                    variant="link"
                    isIcon
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={() => {
                        setCollapsed((prev) => {
                            return !prev;
                        });
                    }}
                >
                    {collapsed ? <SidebarRightIcon /> : <SidebarLeftIcon />}
                    <span className="sr-only">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
                </Button>
            </header>
            <Activity mode={collapsed ? 'hidden' : 'visible'}>
                <Separator orientation="horizontal" />
                <Tabs.Root
                    className={s.tabs}
                    value={tab}
                    onValueChange={(value) => {
                        setTab(value as SidebarTab);
                    }}
                >
                    <Tabs.List className={s['tabs-list']} data-resizing={isResizing || undefined}>
                        <Tabs.Tab value="scene">Scene</Tabs.Tab>
                        <Tabs.Tab value="assets">Assets</Tabs.Tab>
                        <Tabs.Indicator />
                    </Tabs.List>
                </Tabs.Root>
                <Separator orientation="horizontal" />
                <Activity mode={tab === 'assets' ? 'visible' : 'hidden'}>
                    <Input
                        className={s.search}
                        type="search"
                        placeholder="Search"
                        leftAddon={<SearchIcon />}
                        isRounded
                        size="sm"
                    />
                    <CatalogPanel anchorRef={sidebarRef} active={tab === 'assets'} />
                    <Separator orientation="horizontal" />
                    <footer className={s.footer}>
                        <UploadModelFlow />
                    </footer>
                </Activity>
                <Activity mode={tab === 'scene' ? 'visible' : 'hidden'}>
                    <ScenePanel />
                </Activity>
            </Activity>
            {!collapsed && <ResizeHandle {...handleProps} />}
        </aside>
    );
};
