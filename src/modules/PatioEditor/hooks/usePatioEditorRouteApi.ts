import { getRouteApi } from '@tanstack/react-router';

const route = getRouteApi('/patios/$id');

export const usePatioEditorParams = route.useParams;
export const usePatioEditorNavigate = route.useNavigate;
