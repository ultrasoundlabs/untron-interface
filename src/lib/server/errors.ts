import type { SwapServiceErrorCode } from '$lib/types/errors';

export class SwapDomainError extends Error {
	constructor(
		message: string,
		public code: SwapServiceErrorCode,
		public statusCode: number = 400
	) {
		super(message);
		this.name = 'SwapDomainError';
	}
}

export function assert(
	condition: unknown,
	message: string,
	code: SwapServiceErrorCode
): asserts condition {
	if (!condition) {
		throw new SwapDomainError(message, code);
	}
}
