import { createConnectionStore } from '@untron/connectkit/wagmi';
import { config } from './config';

export const connection = createConnectionStore(config);
