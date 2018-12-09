declare function arg<T extends arg.Spec>(spec: T): arg.Result<T>;

declare namespace arg {
	export type Handler = (value: string) => any;

	export interface Spec {
		[key: string]: string | Handler | [Handler];
	}

	export type Result<T extends Spec> = { _: string[] } & {
		[K in keyof T]: T[K] extends string
			? never
			: T[K] extends Handler
			? ReturnType<T[K]>
			: T[K] extends [Handler]
			? Array<ReturnType<T[K][0]>>
			: never
	};
}

export = arg;
