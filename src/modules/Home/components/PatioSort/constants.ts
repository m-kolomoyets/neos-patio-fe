import type { SortKey } from '@/services/patios/types';
import HashtagIcon from '@/icons/hashtag_24.svg?react';
import NewIcon from '@/icons/new_24.svg?react';
import SortAlphaIcon from '@/icons/sort-alpha-descending_24.svg?react';
import StarIcon from '@/icons/star-filled_24.svg?react';
import TargetIcon from '@/icons/target_24.svg?react';

export const SORT_OPTIONS: Array<{
    value: SortKey;
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}> = [
    { value: 'id', label: 'ID', Icon: HashtagIcon },
    { value: 'newest', label: 'Newest', Icon: NewIcon },
    { value: 'nearest', label: 'Nearest to me', Icon: TargetIcon },
    { value: 'popular', label: 'Most popular', Icon: StarIcon },
    { value: 'name', label: 'Name', Icon: SortAlphaIcon },
];
