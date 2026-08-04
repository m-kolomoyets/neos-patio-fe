import type { Continent, PatioType } from '@/services/patios/types';

export type FilterSectionsProps = {
    continents: Continent[];
    types: PatioType[];
    onContinentsChange: (_values: Continent[]) => void;
    onTypesChange: (_values: PatioType[]) => void;
};
