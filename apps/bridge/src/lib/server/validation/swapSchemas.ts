import { isValidEvmAddress, isValidTronAddress } from '$lib/validation/addresses';
import { z } from 'zod';

const evmHexAddressSchema = z
	.string()
	.regex(/^0x[a-fA-F0-9]{40}$/, 'Signer address must be a valid EVM address (0x...)')
	.transform((value) => value as `0x${string}`);

export const swapDirectionSchema = z.enum(['TRON_TO_EVM', 'EVM_TO_TRON']);
export const evmStablecoinSchema = z.enum(['USDT', 'USDC']);

export const capacityRequestSchema = z.object({
	direction: swapDirectionSchema,
	evmChainId: z.number().int().positive(),
	evmToken: evmStablecoinSchema
});

function validateRecipient(
	data: { direction: 'TRON_TO_EVM' | 'EVM_TO_TRON'; recipientAddress: string },
	ctx: z.RefinementCtx
) {
	const { direction, recipientAddress } = data;

	if (direction === 'TRON_TO_EVM') {
		if (!isValidEvmAddress(recipientAddress)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['recipientAddress'],
				message: 'Recipient must be a valid EVM address (0x...)'
			});
		}
	} else if (direction === 'EVM_TO_TRON') {
		if (!isValidTronAddress(recipientAddress)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['recipientAddress'],
				message: 'Recipient must be a valid Tron address (starts with T)'
			});
		}
	}
}

export const quoteRequestSchema = capacityRequestSchema
	.extend({
		amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
		recipientAddress: z.string().min(1, 'Recipient address is required')
	})
	.superRefine(validateRecipient);

const evmSignerSchema = evmHexAddressSchema.superRefine((value, ctx) => {
	if (!isValidEvmAddress(value)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Signer address must be a valid EVM address (0x...)'
		});
	}
});

const eip712TypeSchema = z.object({
	name: z.string().min(1),
	type: z.string().min(1)
});

export const eip712PayloadSchema = z.object({
	id: z.string().min(1),
	domain: z.object({
		name: z.string().min(1),
		version: z.string().min(1),
		chainId: z.number().int().positive(),
		verifyingContract: evmHexAddressSchema
	}),
	types: z.record(z.string(), z.array(eip712TypeSchema)),
	primaryType: z.string().min(1),
	message: z.record(z.string(), z.any())
});

const payloadSignaturesSchema = z
	.record(
		z.string().min(1),
		z
			.string()
			.regex(/^0x[a-fA-F0-9]+$/, 'Signature must be a 0x-prefixed hex string')
			.transform((value) => value as `0x${string}`)
	)
	.refine((record) => Object.keys(record).length > 0, {
		message: 'At least one signature is required'
	});

const evmToTronBaseSchema = z.object({
	direction: z.literal('EVM_TO_TRON'),
	evmChainId: z.number().int().positive(),
	evmToken: evmStablecoinSchema,
	amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
	recipientAddress: z.string().min(1, 'Recipient address is required'),
	evmSignerAddress: evmSignerSchema
});

export const evmToTronPrepareSchema = evmToTronBaseSchema
	.superRefine(validateRecipient)
	.refine((data) => data.amount !== '0', {
		path: ['amount'],
		message: 'Amount must be greater than zero'
	});

export const evmToTronExecuteSchema = z
	.object({
		direction: z.literal('EVM_TO_TRON'),
		evmChainId: z.number().int().positive(),
		evmToken: evmStablecoinSchema,
		amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
		recipientAddress: z.string().min(1, 'Recipient address is required'),
		evmSignerAddress: evmSignerSchema,
		payloads: z.array(eip712PayloadSchema).min(1),
		payloadSignatures: payloadSignaturesSchema
	})
	.superRefine(validateRecipient)
	.refine((data) => data.amount !== '0', {
		path: ['amount'],
		message: 'Amount must be greater than zero'
	});

export const tronToEvmDepositSchema = z
	.object({
		direction: z.literal('TRON_TO_EVM'),
		evmChainId: z.number().int().positive(),
		evmToken: evmStablecoinSchema,
		amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
		recipientAddress: z.string().min(1, 'Recipient address is required')
	})
	.superRefine(validateRecipient);

export type CapacityRequestPayload = z.infer<typeof capacityRequestSchema>;
/**
 * Payload accepted by the `/api/swap/quote` endpoint. `amount` must already be encoded
 * as a numeric string in the source token's smallest unit.
 */
export type QuoteRequestPayload = z.infer<typeof quoteRequestSchema>;
export type EvmToTronPreparePayload = z.infer<typeof evmToTronPrepareSchema>;
export type EvmToTronExecutePayload = z.infer<typeof evmToTronExecuteSchema>;
export type TronToEvmDepositPayload = z.infer<typeof tronToEvmDepositSchema>;
