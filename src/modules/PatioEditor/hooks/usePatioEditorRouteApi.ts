import { getRouteApi } from '@tanstack/react-router';

const route = getRouteApi('/patios/$slug/edit');

export const usePatioEditorParams = route.useParams;
export const usePatioEditorNavigate = route.useNavigate;
