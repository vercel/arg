const flagSymbol = Symbol('arg flag');

function arg(opts, {argv, permissive = false} = {}) {
	if (!opts) {
		throw new Error('Argument specification object is required');
	}

	const result = {_: []};

	argv = argv || process.argv.slice(2);

	const aliases = {};
	const handlers = {};

	for (const key of Object.keys(opts)) {
		if (!key) {
			throw new TypeError('Argument key cannot be an empty string');
		}

		if (key[0] !== '-') {
			throw new TypeError(`Argument key must start with '-' but found: '${key}'`);
		}

		if (key.length === 1) {
			throw new TypeError(`Argument key must have a name; singular '-' keys are not allowed: ${key}`);
		}

		if (typeof opts[key] === 'string') {
			aliases[key] = opts[key];
			continue;
		}

		const type = opts[key];

		if (!type || (typeof type !== 'function' && !(Array.isArray(type) && type.length === 1 && typeof type[0] === 'function'))) {
			throw new Error(`Type missing or not a function or valid array type: ${key}`);
		}

		if (key[1] !== '-' && key.length > 2) {
			throw new TypeError(`Short argument keys (with a single hyphen) must have only one character: ${key}`);
		}

		handlers[key] = type;
	}

	for (let i = 0, len = argv.length; i < len; i++) {
		const wholeArg = argv[i];

		if (wholeArg.length < 2) {
			result._.push(wholeArg);
			continue;
		}

		if (wholeArg === '--') {
			result._ = result._.concat(argv.slice(i + 1));
			break;
		}

		if (wholeArg[0] === '-') {
			/* eslint-disable operator-linebreak */
			const separatedArguments = (wholeArg[1] === '-' || wholeArg.length === 2)
				? [wholeArg]
				: wholeArg.slice(1).split('').map(a => `-${a}`);
			/* eslint-enable operator-linebreak */

			for (let j = 0; j < separatedArguments.length; j++) {
				const arg = separatedArguments[j];
				const [originalArgName, argStr] = arg[1] === '-' ? arg.split('=', 2) : [arg, undefined];

				let argName = originalArgName;
				while (argName in aliases) {
					argName = aliases[argName];
				}

				if (!(argName in handlers)) {
					if (permissive) {
						result._.push(arg);
						continue;
					} else {
						const err = new Error(`Unknown or unexpected option: ${originalArgName}`);
						err.code = 'ARG_UNKNOWN_OPTION';
						throw err;
					}
				}

				/* eslint-disable operator-linebreak */
				const [type, isArray] = Array.isArray(handlers[argName])
					? [handlers[argName][0], true]
					: [handlers[argName], false];
				/* eslint-enable operator-linebreak */

				if (!(type === Boolean || type[flagSymbol]) && ((j + 1) < separatedArguments.length)) {
					throw new TypeError(`Option requires argument (but was followed by another short argument): ${originalArgName}`);
				}

				let value;
				if (type === Boolean) {
					value = true;
				} else if (type[flagSymbol]) {
					value = type(true, argName, result[argName]);
				} else if (argStr === undefined) {
					if (argv.length < i + 2 || (argv[i + 1].length > 1 && argv[i + 1][0] === '-')) {
						const extended = originalArgName === argName ? '' : ` (alias for ${argName})`;
						throw new Error(`Option requires argument: ${originalArgName}${extended}`);
					}

					value = type(argv[i + 1], argName, result[argName]);
					++i;
				} else {
					value = type(argStr, argName, result[argName]);
				}

				if (isArray) {
					if (result[argName]) {
						result[argName].push(value);
					} else {
						result[argName] = [value];
					}
				} else {
					result[argName] = value;
				}
			}
		} else {
			result._.push(wholeArg);
		}
	}

	return result;
}

arg.flag = fn => {
	fn[flagSymbol] = true;
	return fn;
};

// Utility types
arg.COUNT = arg.flag((v, name, existingCount) => (existingCount || 0) + 1);

module.exports = arg;
