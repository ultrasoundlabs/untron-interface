import { describe, expect, it } from 'vitest';
import { parseAccountId, parseAssetId, parseCaip2, toAccountId } from './caip';

describe('caip utils', () => {
	it('parses CAIP-2', () => {
		expect(parseCaip2('eip155:1')).toEqual({ chainNamespace: 'eip155', chainReference: '1' });
		expect(parseCaip2('tron:0x2b6653dc')).toEqual({
			chainNamespace: 'tron',
			chainReference: '0x2b6653dc'
		});
	});

	it('formats CAIP-10 (lowercases EVM accounts)', () => {
		expect(
			toAccountId({ chainId: 'eip155:1', account: '0xAbC0000000000000000000000000000000000000' })
		).toBe('eip155:1:0xabc0000000000000000000000000000000000000');

		expect(toAccountId({ chainId: 'tron:0x2b6653dc', account: 'TExampleAddress' })).toBe(
			'tron:0x2b6653dc:TExampleAddress'
		);
	});

	it('parses CAIP-10', () => {
		expect(parseAccountId('eip155:42161:0xabc')).toEqual({
			chainId: 'eip155:42161',
			chainNamespace: 'eip155',
			chainReference: '42161',
			account: '0xabc'
		});
	});

	it('parses CAIP-19', () => {
		expect(parseAssetId('eip155:1/erc20:0xa0b8')).toEqual({
			chainId: 'eip155:1',
			chainNamespace: 'eip155',
			chainReference: '1',
			assetNamespace: 'erc20',
			assetReference: '0xa0b8'
		});
	});
});
