import { getRouteApi } from '@tanstack/react-router';

const route = getRouteApi('/patios/$id/');

export const usePatioViewParams = route.useParams;
export const usePatioViewNavigate = route.useNavigate;
