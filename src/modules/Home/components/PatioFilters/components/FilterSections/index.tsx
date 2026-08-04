import type { Continent, PatioType } from '@/services/patios/types';
import type { FilterSectionsProps } from './types';
import React from 'react';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Chip } from '@/components/ui/Chip';
import { Typography } from '@/components/ui/Typography';
import { CONTINENT_LABELS, TYPE_LABELS } from '../../constants';
import s from './styles.module.css';

export const FilterSections: React.FC<FilterSectionsProps> = ({
    continents,
    types,
    onContinentsChange,
    onTypesChange,
}) => {
    return (
        <>
            <div className={s.section}>
                <Typography variant="text-xs" className={s['section-label']}>
                    Continent
                </Typography>
                <BaseToggleGroup
                    className={s.group}
                    multiple
                    value={continents}
                    onValueChange={(value) => {
                        return onContinentsChange(value as Continent[]);
                    }}
                >
                    {CONTINENT_LABELS.map(({ value, label }) => {
                        return (
                            <Chip key={value} size="lg" value={value}>
                                {label}
                            </Chip>
                        );
                    })}
                </BaseToggleGroup>
            </div>

            <div className={s.section}>
                <Typography variant="text-xs" className={s['section-label']}>
                    Type
                </Typography>
                <BaseToggleGroup
                    className={s.group}
                    multiple
                    value={types}
                    onValueChange={(value) => {
                        return onTypesChange(value as PatioType[]);
                    }}
                >
                    {TYPE_LABELS.map(({ value, label }) => {
                        return (
                            <Chip key={value} size="lg" value={value}>
                                {label}
                            </Chip>
                        );
                    })}
                </BaseToggleGroup>
            </div>
        </>
    );
};
