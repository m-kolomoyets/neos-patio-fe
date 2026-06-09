import { Activity, useState } from 'react';
import ArrowLeftIcon from '@/icons/arrow-left_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
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
import { CatalogPanel } from '../CatalogPanel';
import { ScenePanel } from '../ScenePanel';
import s from './styles.module.css';

type SidebarTab = 'scene' | 'assets';

export const Sidebar: React.FC = () => {
    const { id } = usePatioEditorParams();
    const { data: patio } = useSuspenseQuery(getPatioQueryOptions(id));
    const [tab, setTab] = useState<SidebarTab>('assets');

    return (
        <aside className={clsx(s.sidebar, 'surface-regular')}>
            <header className={s.header}>
                <Button className={s.back} render={<Link to="/" />} size="md" variant="link" isIcon title="Back">
                    <ArrowLeftIcon />
                    <span className="sr-only">Back</span>
                </Button>
                <Typography className={clsx(s.title, 'truncate')} variant="text-sm">
                    {patio.name}
                </Typography>
            </header>
            <Separator orientation="horizontal" />
            <Tabs.Root
                className={s.tabs}
                value={tab}
                onValueChange={(value) => {
                    setTab(value as SidebarTab);
                }}
            >
                <Tabs.List>
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
                <CatalogPanel />
            </Activity>
            <Activity mode={tab === 'scene' ? 'visible' : 'hidden'}>
                <ScenePanel />
            </Activity>
        </aside>
    );
};
