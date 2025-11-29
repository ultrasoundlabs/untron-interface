type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SettlementWorkflowLogContext {
	work?: string;
	orderId?: string;
	evmTxHash?: `0x${string}` | string;
	step?: string;
	relayerAddress?: string;
	[key: string]: unknown;
}

export interface SettlementWorkflowLogger {
	context: SettlementWorkflowLogContext;
	child(extra: Partial<SettlementWorkflowLogContext>): SettlementWorkflowLogger;
	debug(message: string, meta?: Record<string, unknown>): void;
	info(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
	error(message: string, meta?: Record<string, unknown>): void;
}

function logWithLevel(
	level: LogLevel,
	context: SettlementWorkflowLogContext,
	message: string,
	meta?: Record<string, unknown>
) {
	const payload = {
		timestamp: new Date().toISOString(),
		level,
		workflow: 'evm-to-tron-settlement',
		...context,
		message,
		...meta
	};

	if (level === 'error') {
		console.error(payload);
	} else if (level === 'warn') {
		console.warn(payload);
	} else if (level === 'debug') {
		console.debug(payload);
	} else {
		console.info(payload);
	}
}

export function createSettlementWorkflowLogger(
	context: SettlementWorkflowLogContext
): SettlementWorkflowLogger {
	const baseContext: SettlementWorkflowLogContext = {
		...context
	};

	return {
		context: baseContext,
		child(extra) {
			return createSettlementWorkflowLogger({
				...baseContext,
				...extra
			});
		},
		debug(message, meta) {
			logWithLevel('debug', baseContext, message, meta);
		},
		info(message, meta) {
			logWithLevel('info', baseContext, message, meta);
		},
		warn(message, meta) {
			logWithLevel('warn', baseContext, message, meta);
		},
		error(message, meta) {
			logWithLevel('error', baseContext, message, meta);
		}
	};
}

export function describeWorkflowError(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			errorName: error.name,
			errorMessage: error.message,
			errorStack: error.stack
		};
	}

	if (typeof error === 'string') {
		return { errorMessage: error };
	}

	return { errorMessage: 'Unknown error', error: error as unknown };
}

export interface RetryOptions {
	attempts?: number;
	initialDelayMs?: number;
	backoffFactor?: number;
	maxDelayMs?: number;
	timeoutMs?: number;
}

const defaultRetryOptions: Required<RetryOptions> = {
	attempts: 3,
	initialDelayMs: 1000,
	backoffFactor: 2,
	maxDelayMs: 10_000,
	timeoutMs: 0
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetries<T>(
	operation: (attempt: number) => Promise<T>,
	options: RetryOptions = {},
	logger?: SettlementWorkflowLogger,
	label = 'operation'
): Promise<T> {
	const { attempts, initialDelayMs, backoffFactor, maxDelayMs, timeoutMs } = {
		...defaultRetryOptions,
		...options
	};

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			if (timeoutMs > 0) {
				return await Promise.race([
					operation(attempt),
					new Promise<never>((_, reject) =>
						setTimeout(
							() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
							timeoutMs
						)
					)
				]);
			}

			return await operation(attempt);
		} catch (error) {
			if (attempt === attempts) {
				throw error;
			}

			const delay = Math.min(initialDelayMs * backoffFactor ** (attempt - 1), maxDelayMs);
			logger?.warn(`Retrying ${label}`, {
				attempt,
				delayMs: delay,
				...describeWorkflowError(error)
			});
			await sleep(delay);
		}
	}

	throw new Error(`Exhausted retries for ${label}`);
}
