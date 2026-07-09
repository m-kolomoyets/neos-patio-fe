import { getRouteApi } from '@tanstack/react-router';

const route = getRouteApi('/');

export const useHomeSearch = route.useSearch;
export const useHomeNavigate = route.useNavigate;
