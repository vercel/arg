// Types
export type Handler<T = any> = (
	value: string,
	name: string,
	previousValue?: T
) => T;

export interface Spec {
	[key: string]: string | Handler | [Handler];
}

export type Result<T extends Spec> = { _: string[] } & {
	[K in keyof T]?: T[K] extends Handler
		? ReturnType<T[K]>
		: T[K] extends [Handler]
		? Array<ReturnType<T[K][0]>>
		: never;
};

export interface Options {
	argv?: string[];
	permissive?: boolean;
	stopAtPositional?: boolean;
}

// Exports
declare const flagSymbol: unique symbol;

export class ArgError extends Error {
	constructor(message: string, code: string);

	code: string;
}

export function run<T extends Spec>(spec: T, options?: Options): Result<T>;

export function flag<T>(fn: T): T & { [flagSymbol]: true };

export const COUNT: Handler<number> & { [flagSymbol]: true };
