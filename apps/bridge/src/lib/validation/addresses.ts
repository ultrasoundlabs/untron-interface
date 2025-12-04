import { createBase58check } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { isAddress } from 'viem';

const TRON_ADDRESS_REGEX = /^T[a-zA-Z0-9]{33}$/;
const TRON_ADDRESS_PREFIX = 0x41; // Tron mainnet address prefix
const tronBase58Check = createBase58check(sha256);

export const tronAddressRegex = TRON_ADDRESS_REGEX;

export function isValidEvmAddress(address: string): boolean {
	return isAddress(address);
}

export function isValidTronAddress(address: string): boolean {
	if (!TRON_ADDRESS_REGEX.test(address)) {
		return false;
	}

	try {
		const decoded = tronBase58Check.decode(address);

		// Tron addresses are 21 bytes: 1-byte prefix + 20-byte account
		if (decoded.length !== 21) {
			return false;
		}

		if (decoded[0] !== TRON_ADDRESS_PREFIX) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
}
