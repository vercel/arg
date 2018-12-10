declare function arg<T extends arg.Spec>(spec: T): arg.Result<T>;

declare namespace arg {
	export type Handler<T> = (value: string, argName: string, prev: T) => T;

	export interface Spec {
		[key: string]: string | Handler<any>;
	}

	export type Result<T extends Spec> = { _: string[] } & {
		[K in keyof T]: T[K] extends string
			? never
			: T[K] extends Handler<any>
			? ReturnType<T[K]>
			: never
	};

	export const of: <T>(
		handler: Handler<T>
	) => (value: string, argName: string, prev: T) => Array<T>;
}

export = arg;
