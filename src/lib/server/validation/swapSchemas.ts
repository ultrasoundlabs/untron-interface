import { isValidEvmAddress, isValidTronAddress } from '$lib/validation/addresses';
import { z } from 'zod';

export const swapDirectionSchema = z.enum(['TRON_TO_EVM', 'EVM_TO_TRON']);
export const evmStablecoinSchema = z.enum(['USDT', 'USDC']);

export const capacityRequestSchema = z.object({
	direction: swapDirectionSchema,
	evmChainId: z.number().int().positive(),
	evmToken: evmStablecoinSchema
});

export const quoteRequestSchema = capacityRequestSchema
	.extend({
		amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
		recipientAddress: z.string().min(1, 'Recipient address is required')
	})
	.superRefine((data, ctx) => {
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
	});

export const createOrderSchema = quoteRequestSchema.pick({
	direction: true,
	evmChainId: true,
	evmToken: true,
	amount: true,
	recipientAddress: true
});

export const createSigningSessionSchema = createOrderSchema
	.extend({
		evmSignerAddress: z.string().min(1, 'Signer address is required')
	})
	.superRefine((data, ctx) => {
		if (!isValidEvmAddress(data.evmSignerAddress)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['evmSignerAddress'],
				message: 'Signer address must be a valid EVM address (0x...)'
			});
		}
	})
	.refine((data) => data.direction === 'EVM_TO_TRON', {
		path: ['direction'],
		message: 'Signing sessions are only supported for EVM→Tron swaps'
	});

export const submitSignaturesSchema = z.object({
	signatures: z
		.array(
			z.object({
				payloadId: z.string().min(1),
				signature: z.string().min(1)
			})
		)
		.min(1)
});

export type CapacityRequestPayload = z.infer<typeof capacityRequestSchema>;
/**
 * Payload accepted by the `/api/swap/quote` endpoint. `amount` must already be encoded
 * as a numeric string in the source token's smallest unit.
 */
export type QuoteRequestPayload = z.infer<typeof quoteRequestSchema>;
export type CreateOrderRequestPayload = z.infer<typeof createOrderSchema>;
export type CreateSigningSessionRequestPayload = z.infer<typeof createSigningSessionSchema>;
export type SubmitSignaturesPayload = z.infer<typeof submitSignaturesSchema>;
