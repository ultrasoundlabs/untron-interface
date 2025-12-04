import { env } from '$env/dynamic/private';

const APITRX_API_KEY_ENV = 'APITRX_API_KEY';
const APITRX_BASE_URL_ENV = 'APITRX_BASE_URL';
const DEFAULT_API_BASE = 'https://web.apitrx.com';
const DEFAULT_DURATION_HOURS = Number(env.APITRX_DEFAULT_DURATION_HOURS ?? '1');
const DEFAULT_ENERGY_BUFFER = Number(env.APITRX_ENERGY_BUFFER ?? '5000');
const MIN_ENERGY_VALUE = 32000;
const ENERGY_INCREMENT = 1000;

interface ApitrxEnvelope<T> {
	code: number;
	message: string;
	data?: T;
}

export interface ApitrxEnergyStatus {
	maxValue: number;
	energyLimit: number;
	energyRemaining: number;
	price: number;
	available: boolean;
}

export interface RentEnergyPayload {
	address: string;
	value: number;
	durationHours?: number;
}

export interface RentEnergyResult {
	balance?: number;
	txid?: string;
	amount?: number;
	value: number;
	hours: number;
}

export interface EnsureEnergyParams {
	address: string;
	minRemaining: number;
	currentEnergy?: number;
	buffer?: number;
	valueOverride?: number;
	durationHours?: number;
}

export interface EnsureEnergyResult {
	rented: boolean;
	status: ApitrxEnergyStatus;
	rental?: RentEnergyResult;
	deficit: number;
}

export class TronEnergyError extends Error {
	constructor(
		message: string,
		public readonly code?: number,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'TronEnergyError';
	}
}

function getApiBase(): string {
	return env[APITRX_BASE_URL_ENV]?.trim() || DEFAULT_API_BASE;
}

function getApiKey(): string {
	const apiKey = env[APITRX_API_KEY_ENV]?.trim();
	if (!apiKey) {
		throw new TronEnergyError(`${APITRX_API_KEY_ENV} is not configured`);
	}
	return apiKey;
}

async function callApitrx<T>(
	path: string,
	params: Record<string, string>
): Promise<ApitrxEnvelope<T>> {
	const apiKey = getApiKey();
	const url = new URL(path, getApiBase());
	const query = new URLSearchParams({
		apikey: apiKey,
		...params
	});
	url.search = query.toString();

	let response: Response;
	try {
		response = await fetch(url, {
			method: 'GET',
			headers: {
				accept: 'application/json'
			}
		});
	} catch (error) {
		throw new TronEnergyError('Failed to reach APITRX', undefined, error);
	}

	if (!response.ok) {
		throw new TronEnergyError(`APITRX responded with HTTP ${response.status}`, response.status);
	}

	let payload: ApitrxEnvelope<T>;
	try {
		payload = (await response.json()) as ApitrxEnvelope<T>;
	} catch (error) {
		throw new TronEnergyError('Unable to parse APITRX response', undefined, error);
	}

	if (payload.code !== 200) {
		throw new TronEnergyError(payload.message ?? 'APITRX request failed', payload.code, payload);
	}

	return payload;
}

export async function rentEnergy({
	address,
	value,
	durationHours
}: RentEnergyPayload): Promise<RentEnergyResult> {
	if (!Number.isFinite(value) || value < MIN_ENERGY_VALUE) {
		throw new TronEnergyError(`Energy value must be >= ${MIN_ENERGY_VALUE}, received ${value}`);
	}

	const hours = durationHours ?? DEFAULT_DURATION_HOURS;
	const roundedValue = roundEnergyValue(value);

	const { data } = await callApitrx<{
		balance?: number;
		txid?: string;
		amount?: number;
	}>('/getenergy', {
		add: address,
		value: String(roundedValue),
		hour: String(hours)
	});

	return {
		balance: data?.balance,
		txid: data?.txid,
		amount: data?.amount,
		value: roundedValue,
		hours
	};
}

export async function ensureEnergyCapacity(
	params: EnsureEnergyParams
): Promise<EnsureEnergyResult> {
	const currentEnergy = params.currentEnergy ?? 0;
	const buffer = params.buffer ?? DEFAULT_ENERGY_BUFFER;
	const deficit = params.minRemaining - currentEnergy;
	const status: ApitrxEnergyStatus = {
		maxValue: 0,
		energyLimit: 0,
		energyRemaining: 0,
		price: 0,
		available: true
	};

	if (deficit <= 0) {
		return {
			rented: false,
			status,
			deficit: 0
		};
	}

	const desiredValue = params.valueOverride ?? Math.max(MIN_ENERGY_VALUE, deficit + buffer);
	const roundedValue = roundEnergyValue(desiredValue);

	const rental = await rentEnergy({
		address: params.address,
		value: roundedValue,
		durationHours: params.durationHours ?? DEFAULT_DURATION_HOURS
	});

	return {
		rented: true,
		status,
		rental,
		deficit
	};
}

function roundEnergyValue(value: number): number {
	if (value < MIN_ENERGY_VALUE) {
		return MIN_ENERGY_VALUE;
	}
	const remainder = value % ENERGY_INCREMENT;
	if (remainder === 0) return value;
	return value + (ENERGY_INCREMENT - remainder);
}
