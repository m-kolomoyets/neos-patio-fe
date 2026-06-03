import type { Model3D } from './types';
import { sleep } from '@/lib/utils/sleep';

const MOCK_DELAY_MS = 200;
const SAMPLE_ASSETS_BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

const buildAsset = (name: string, dirName?: string): Pick<Model3D, 'gltfUrl' | 'previewUrl'> => {
    const dir = dirName ?? name;
    return {
        gltfUrl: `${SAMPLE_ASSETS_BASE}/${dir}/glTF-Binary/${name}.glb`,
        previewUrl: `${SAMPLE_ASSETS_BASE}/${dir}/screenshot/screenshot.jpg`,
    };
};

const MODELS_FIXTURES: Model3D[] = [{ id: 'lantern', name: 'Lantern', ...buildAsset('Lantern') }];

export const listModels = async (): Promise<Model3D[]> => {
    await sleep(MOCK_DELAY_MS);
    return MODELS_FIXTURES;
};
