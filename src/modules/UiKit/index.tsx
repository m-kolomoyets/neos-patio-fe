import type { ButtonSize, ButtonVariant } from '@/components/ui/Button/types';
import type { NotificationBadgeSize } from '@/components/ui/NotificationBadge/types';
import type { ToggleGroupSize } from '@/components/ui/ToggleGroup/types';
import type { TypographyVariant } from '@/components/ui/Typography/types';
import ArrowRightIcon from '@/icons/arrow-right_24.svg?react';
import EditIcon from '@/icons/edit_24.svg?react';
import SearchIcon from '@/icons/search_24.svg?react';
import TrashIcon from '@/icons/trash_24.svg?react';
import clsx from 'clsx';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { OptionItem } from '@/components/ui/OptionItem';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs } from '@/components/ui/Tabs';
import { ToggleGroup } from '@/components/ui/ToggleGroup';
import { Tooltip } from '@/components/ui/Tooltip';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

type SectionProps = {
    title: string;
    children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ title, children }) => {
    return (
        <section className={clsx(s.section, 'surface-thick')}>
            <Typography variant="display-sm">{title}</Typography>
            <div className={s.sectionContent}>{children}</div>
        </section>
    );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
    return (
        <div className={s.row}>
            <Typography variant="text-sm" className={s.rowLabel}>
                {label}
            </Typography>
            {children}
        </div>
    );
};

const TYPOGRAPHY_VARIANTS: TypographyVariant[] = [
    'display-2xl',
    'display-xl',
    'display-lg',
    'display-md',
    'display-sm',
    'display-xs',
    'text-xl',
    'text-lg',
    'text-md',
    'text-sm',
    'text-xs',
];

const BUTTON_VARIANTS: ButtonVariant[] = ['brand', 'surface', 'link'];
const BUTTON_SIZES: ButtonSize[] = ['xl', 'lg', 'md', 'sm'];

const TABS_ITEMS = [
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Activity' },
    { value: 'settings', label: 'Settings' },
];

const TOOLTIP_SIDES = ['top', 'right', 'bottom', 'left'] as const;

const SCROLL_AREA_OPTIONS = Array.from({ length: 20 }, (_, index) => {
    return {
        value: `option-${index + 1}`,
        label: `Option ${index + 1}`,
    };
});

const TOGGLE_GROUP_SIZES: ToggleGroupSize[] = ['md', 'sm'];

const NOTIFICATION_BADGE_SIZES: NotificationBadgeSize[] = ['lg', 'md', 'xs'];

const TOGGLE_GROUP_ITEMS = [
    { value: 'edit', icon: <EditIcon />, label: 'Edit' },
    { value: 'next', icon: <ArrowRightIcon />, label: 'Next' },
    { value: 'delete', icon: <TrashIcon />, label: 'Delete' },
];

export const UiKit: React.FC = () => {
    return (
        <Tooltip.Provider>
            <div className={s.wrap}>
                <Section title="Wallet Connect">
                    <Row label="custom button">
                        <ConnectWalletButton />
                    </Row>
                </Section>

                <Section title="Typography">
                    {TYPOGRAPHY_VARIANTS.map((variant) => {
                        return (
                            <Row key={variant} label={variant}>
                                <Typography variant={variant}>The quick brown fox jumps over the lazy dog</Typography>
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Button — variants × sizes">
                    {BUTTON_VARIANTS.map((variant) => {
                        return (
                            <Row key={variant} label={variant}>
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={size} variant={variant} size={size}>
                                            {variant} / {size}
                                        </Button>
                                    );
                                })}
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Button — with icons">
                    {BUTTON_VARIANTS.map((variant) => {
                        return (
                            <Row key={variant} label={variant}>
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={`${size}-left`} variant={variant} size={size}>
                                            <EditIcon />
                                            Edit
                                        </Button>
                                    );
                                })}
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={`${size}-right`} variant={variant} size={size}>
                                            Next
                                            <ArrowRightIcon />
                                        </Button>
                                    );
                                })}
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Button — icon only">
                    {BUTTON_VARIANTS.map((variant) => {
                        return (
                            <Row key={variant} label={variant}>
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={size} variant={variant} size={size} isIcon aria-label="Edit">
                                            <EditIcon />
                                        </Button>
                                    );
                                })}
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Tabs">
                    <Row label="default">
                        <Tabs.Root defaultValue={TABS_ITEMS[0].value}>
                            <Tabs.List>
                                {TABS_ITEMS.map((item) => {
                                    return (
                                        <Tabs.Tab key={item.value} value={item.value}>
                                            {item.label}
                                        </Tabs.Tab>
                                    );
                                })}
                                <Tabs.Indicator />
                            </Tabs.List>
                        </Tabs.Root>
                    </Row>
                    <Row label="disabled">
                        <Tabs.Root defaultValue={TABS_ITEMS[0].value}>
                            <Tabs.List>
                                <Tabs.Tab value={TABS_ITEMS[0].value}>{TABS_ITEMS[0].label}</Tabs.Tab>
                                <Tabs.Tab value={TABS_ITEMS[1].value} disabled>
                                    {TABS_ITEMS[1].label}
                                </Tabs.Tab>
                                <Tabs.Tab value={TABS_ITEMS[2].value}>{TABS_ITEMS[2].label}</Tabs.Tab>
                                <Tabs.Indicator />
                            </Tabs.List>
                        </Tabs.Root>
                    </Row>
                </Section>
                <Section title="Button — loading & disabled">
                    {BUTTON_VARIANTS.map((variant) => {
                        return (
                            <Row key={variant} label={variant}>
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={`${size}-loading`} variant={variant} size={size} isLoading>
                                            Loading
                                        </Button>
                                    );
                                })}
                                {BUTTON_SIZES.map((size) => {
                                    return (
                                        <Button key={`${size}-disabled`} variant={variant} size={size} disabled>
                                            Disabled
                                        </Button>
                                    );
                                })}
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Toggle Group">
                    {TOGGLE_GROUP_SIZES.map((size) => {
                        return (
                            <Row key={size} label={size}>
                                <ToggleGroup.Root size={size} defaultValue={[TOGGLE_GROUP_ITEMS[0].value]}>
                                    {TOGGLE_GROUP_ITEMS.map((item) => {
                                        return (
                                            <ToggleGroup.Item
                                                key={item.value}
                                                value={item.value}
                                                aria-label={item.label}
                                            >
                                                {item.icon}
                                            </ToggleGroup.Item>
                                        );
                                    })}
                                </ToggleGroup.Root>
                            </Row>
                        );
                    })}
                    <Row label="multiple">
                        <ToggleGroup.Root multiple defaultValue={[TOGGLE_GROUP_ITEMS[0].value]}>
                            {TOGGLE_GROUP_ITEMS.map((item) => {
                                return (
                                    <ToggleGroup.Item key={item.value} value={item.value} aria-label={item.label}>
                                        {item.icon}
                                    </ToggleGroup.Item>
                                );
                            })}
                        </ToggleGroup.Root>
                    </Row>
                    <Row label="disabled">
                        <ToggleGroup.Root disabled defaultValue={[TOGGLE_GROUP_ITEMS[0].value]}>
                            {TOGGLE_GROUP_ITEMS.map((item) => {
                                return (
                                    <ToggleGroup.Item key={item.value} value={item.value} aria-label={item.label}>
                                        {item.icon}
                                    </ToggleGroup.Item>
                                );
                            })}
                        </ToggleGroup.Root>
                    </Row>
                </Section>

                <Section title="Input">
                    <Row label="default">
                        <Input placeholder="Enter your name" />
                    </Row>
                    <Row label="rounded">
                        <Input placeholder="Enter your name" isRounded />
                    </Row>
                    <Row label="left addon">
                        <Input placeholder="Search" leftAddon={<SearchIcon />} />
                    </Row>
                    <Row label="right addon">
                        <Input placeholder="Amount" rightAddon={<Typography variant="text-sm">USD</Typography>} />
                    </Row>
                    <Row label="both addons">
                        <Input
                            placeholder="Search"
                            leftAddon={<SearchIcon />}
                            rightAddon={<Typography variant="text-sm">⌘K</Typography>}
                        />
                    </Row>
                    <Row label="type=search">
                        <Input type="search" placeholder="Type to search…" defaultValue="query" />
                    </Row>
                    <Row label="disabled">
                        <Input placeholder="Disabled" disabled />
                    </Row>
                </Section>

                <Section title="Notification Badge">
                    {NOTIFICATION_BADGE_SIZES.map((size) => {
                        return (
                            <Row key={size} label={size}>
                                <NotificationBadge size={size} value={3} />
                                <NotificationBadge size={size} value={12} />
                                <NotificationBadge size={size} value={99} />
                            </Row>
                        );
                    })}
                </Section>

                <Section title="Option Item">
                    <Row label="default">
                        <OptionItem>Alice</OptionItem>
                    </Row>
                    <Row label="with left addon">
                        <OptionItem leftAddon={<EditIcon />}>Edit profile</OptionItem>
                    </Row>
                    <Row label="checked">
                        <OptionItem leftAddon={<EditIcon />} checked>
                            Selected option
                        </OptionItem>
                    </Row>
                    <Row label="list">
                        <ScrollArea className={s.optionList}>
                            <div className={s.optionListInner}>
                                <OptionItem leftAddon={<SearchIcon />}>Search</OptionItem>
                                <OptionItem leftAddon={<EditIcon />} checked>
                                    Edit
                                </OptionItem>
                                <OptionItem leftAddon={<ArrowRightIcon />}>Next step</OptionItem>
                                <OptionItem leftAddon={<TrashIcon />}>Delete</OptionItem>
                            </div>
                        </ScrollArea>
                    </Row>
                    <Row label="variant=surface">
                        <ScrollArea className={s.optionList}>
                            <div className={s.optionListInner}>
                                <OptionItem variant="surface" leftAddon={<SearchIcon />}>
                                    Search
                                </OptionItem>
                                <OptionItem variant="surface" leftAddon={<EditIcon />} checked>
                                    Edit (selected)
                                </OptionItem>
                                <OptionItem variant="surface" leftAddon={<ArrowRightIcon />}>
                                    Next step
                                </OptionItem>
                                <OptionItem variant="surface" leftAddon={<TrashIcon />}>
                                    Delete
                                </OptionItem>
                            </div>
                        </ScrollArea>
                    </Row>
                </Section>

                <Section title="Scroll Area">
                    <Row label="vertical">
                        <ScrollArea className={s.optionList}>
                            <div className={s.optionListInner}>
                                {SCROLL_AREA_OPTIONS.map((option) => {
                                    return (
                                        <OptionItem key={option.value} leftAddon={<SearchIcon />}>
                                            {option.label}
                                        </OptionItem>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </Row>
                    <Row label="surface">
                        <ScrollArea className={s.optionList}>
                            <div className={s.optionListInner}>
                                {SCROLL_AREA_OPTIONS.map((option) => {
                                    return (
                                        <OptionItem key={option.value} variant="surface" leftAddon={<EditIcon />}>
                                            {option.label}
                                        </OptionItem>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </Row>
                </Section>

                <Section title="Tooltip">
                    <Row label="title + description">
                        <Tooltip.Root>
                            <Tooltip.Trigger render={<Button variant="surface">Hover me</Button>} />
                            <Tooltip.Popup
                                title="Keyboard shortcut"
                                description="Press ⌘K to open the command palette from anywhere in the app."
                            />
                        </Tooltip.Root>
                    </Row>
                    <Row label="description only">
                        <Tooltip.Root>
                            <Tooltip.Trigger render={<Button variant="surface">No title</Button>} />
                            <Tooltip.Popup description="A short description without a title." />
                        </Tooltip.Root>
                    </Row>
                    <Row label="sides">
                        {TOOLTIP_SIDES.map((side) => {
                            return (
                                <Tooltip.Root key={side}>
                                    <Tooltip.Trigger render={<Button variant="surface">{side}</Button>} />
                                    <Tooltip.Popup
                                        side={side}
                                        title={`Side: ${side}`}
                                        description="The arrow follows the rendered side."
                                    />
                                </Tooltip.Root>
                            );
                        })}
                    </Row>
                    <Row label="long content (max 20rem)">
                        <Tooltip.Root>
                            <Tooltip.Trigger render={<Button variant="surface">Long text</Button>} />
                            <Tooltip.Popup
                                title="Long description"
                                description="This tooltip contains enough text to demonstrate the dynamic width clamped at 320px, so it wraps across multiple lines instead of growing indefinitely."
                            />
                        </Tooltip.Root>
                    </Row>
                    <Row label="rich JSX content">
                        <Tooltip.Root>
                            <Tooltip.Trigger render={<Button variant="surface">Rich content</Button>} />
                            <Tooltip.Popup
                                title="Status"
                                description={
                                    <span>
                                        Currently <strong>online</strong> — last seen just now.
                                    </span>
                                }
                            />
                        </Tooltip.Root>
                    </Row>
                </Section>
            </div>
        </Tooltip.Provider>
    );
};
