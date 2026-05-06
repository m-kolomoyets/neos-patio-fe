import { Patio } from '@/services/patios/types';

export type PatioAutocompleteProps = {
    /**
     * Current search input value. Controlled.
     */
    searchValue: string;
    /**
     * Fires when the search input changes. Also called with `''` after an option is selected.
     */
    onSearchValueChange: (_value: string) => void;
    /**
     * Options to display. Filtered internally by case-insensitive substring match on `label`.
     */
    options: Patio[];
    /**
     * Async: show a loading row in place of the list.
     */
    isLoading?: boolean;
    /**
     * Async: show an error row in place of the list. Takes precedence over `isLoading`.
     */
    isError?: boolean;
    /**
     * Copy for the loading row. Defaults to "Loading…".
     */
    loadingLabel?: string;
    /**
     * Copy for the error row. Defaults to "Something went wrong".
     */
    errorLabel?: string;
    /**
     * Copy shown when filtered list is empty. Defaults to "No results".
     */
    emptyLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onOptionSelect: (_option: Patio) => void;
};
