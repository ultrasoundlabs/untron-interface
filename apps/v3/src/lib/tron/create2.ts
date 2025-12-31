import { bytesToHex, hexToBytes, keccak256 } from 'viem';
import { base58CheckDecode, base58CheckEncode } from './base58check';

export function tronCreate2AddressBase58(args: {
	deployerBase58: string;
	saltHex: `0x${string}`;
	bytecodeHashHex: `0x${string}`;
}): string {
	const deployerPayload = base58CheckDecode(args.deployerBase58);
	if (deployerPayload.length !== 21) {
		throw new Error(`Unexpected deployer payload length: ${deployerPayload.length}`);
	}
	if (deployerPayload[0] !== 0x41) {
		throw new Error(`Unexpected Tron address prefix: 0x${deployerPayload[0].toString(16)}`);
	}

	const deployer = deployerPayload.slice(1); // 20 bytes
	const salt = hexToBytes(args.saltHex);
	const bytecodeHash = hexToBytes(args.bytecodeHashHex);
	if (salt.length !== 32) throw new Error(`Unexpected salt length: ${salt.length}`);
	if (bytecodeHash.length !== 32)
		throw new Error(`Unexpected bytecodeHash length: ${bytecodeHash.length}`);

	// Tron CREATE2 is EVM CREATE2 with a different prefix constant:
	// keccak256(0x41 ++ deployer(20) ++ salt(32) ++ bytecodeHash(32))
	const preimage = new Uint8Array(1 + 20 + 32 + 32);
	preimage[0] = 0x41;
	preimage.set(deployer, 1);
	preimage.set(salt, 1 + 20);
	preimage.set(bytecodeHash, 1 + 20 + 32);

	const hash = hexToBytes(keccak256(bytesToHex(preimage)));
	const addr20 = hash.slice(-20);

	const payload = new Uint8Array(21);
	payload[0] = 0x41;
	payload.set(addr20, 1);
	return base58CheckEncode(payload);
}
