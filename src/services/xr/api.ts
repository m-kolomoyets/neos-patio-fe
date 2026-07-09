import type { XRLoginCodeResponse } from './types';
import { sleep } from '@/lib/utils/sleep';

const MOCK_DELAY_MS = 1200;
const CODE_LENGTH = 6;

export const generateXRLoginCode = async (): Promise<XRLoginCodeResponse> => {
    await sleep(MOCK_DELAY_MS);

    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += Math.floor(Math.random() * 10).toString();
    }

    return { code };
};
