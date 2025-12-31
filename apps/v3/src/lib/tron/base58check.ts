import { bytesToHex, hexToBytes, sha256 } from 'viem';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map<string, number>([...BASE58_ALPHABET].map((c, i) => [c, i]));

function sha256Bytes(data: Uint8Array): Uint8Array {
	return hexToBytes(sha256(bytesToHex(data)));
}

function base58Encode(bytes: Uint8Array): string {
	let x = 0n;
	for (const b of bytes) x = x * 256n + BigInt(b);

	let encoded = '';
	while (x > 0n) {
		const rem = Number(x % 58n);
		x = x / 58n;
		encoded = BASE58_ALPHABET[rem] + encoded;
	}

	let leadingZeros = 0;
	for (const b of bytes) {
		if (b !== 0) break;
		leadingZeros++;
	}
	return '1'.repeat(leadingZeros) + (encoded || '');
}

function base58Decode(str: string): Uint8Array {
	let x = 0n;
	for (const c of str) {
		const v = BASE58_MAP.get(c);
		if (v === undefined) throw new Error(`Invalid Base58 character: ${c}`);
		x = x * 58n + BigInt(v);
	}

	const bytes: number[] = [];
	while (x > 0n) {
		bytes.push(Number(x % 256n));
		x = x / 256n;
	}
	bytes.reverse();

	let leadingZeros = 0;
	for (const c of str) {
		if (c !== '1') break;
		leadingZeros++;
	}

	return Uint8Array.from([...new Array(leadingZeros).fill(0), ...bytes]);
}

export function base58CheckEncode(payload: Uint8Array): string {
	const checksum = sha256Bytes(sha256Bytes(payload)).slice(0, 4);
	const full = new Uint8Array(payload.length + 4);
	full.set(payload, 0);
	full.set(checksum, payload.length);
	return base58Encode(full);
}

export function base58CheckDecode(address: string): Uint8Array {
	const full = base58Decode(address);
	if (full.length < 5) throw new Error('Invalid Base58Check length');

	const payload = full.slice(0, -4);
	const checksum = full.slice(-4);
	const expected = sha256Bytes(sha256Bytes(payload)).slice(0, 4);

	for (let i = 0; i < 4; i++) {
		if (checksum[i] !== expected[i]) throw new Error('Invalid Base58Check checksum');
	}

	return payload;
}
