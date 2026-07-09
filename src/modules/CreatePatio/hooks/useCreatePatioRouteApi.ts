import { getRouteApi } from '@tanstack/react-router';

const route = getRouteApi('/create-patio');

export const useCreatePatioSearch = route.useSearch;
export const useCreatePatioNavigate = route.useNavigate;
