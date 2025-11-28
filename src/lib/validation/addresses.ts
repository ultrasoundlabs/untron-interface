const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const TRON_ADDRESS_REGEX = /^T[a-zA-Z0-9]{33}$/;

export const evmAddressRegex = EVM_ADDRESS_REGEX;
export const tronAddressRegex = TRON_ADDRESS_REGEX;

export function isValidEvmAddress(address: string): boolean {
	return EVM_ADDRESS_REGEX.test(address);
}

export function isValidTronAddress(address: string): boolean {
	return TRON_ADDRESS_REGEX.test(address);
}
