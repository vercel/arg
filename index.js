function arg(opts, {argv, permissive = false} = {}) {
	if (!opts) {
		throw new Error('Argument specification must be specified');
	}

	const result = {_: []};

	argv = argv || process.argv.slice(2);

	const aliases = {};
	const handlers = {};

	for (const key of Object.keys(opts)) {
		if (key[0] !== '-') {
			throw new TypeError(`Argument key must start with '-' but found: '${key}'`);
		}

		if (key.length === 1) {
			throw new Error(`Argument key must have a name; singular "-" keys are not allowed: ${key}`);
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
			throw new Error(`Short argument keys (with a single hyphen) must have only one character: ${key}`);
		}

		handlers[key] = type;
	}

	for (let i = 0, len = argv.length; i < len; i++) {
		const arg = argv[i];

		if (arg.length < 2) {
			result._.push(arg);
			continue;
		}

		if (arg === '--') {
			result._ = result._.concat(argv.slice(i + 1));
			break;
		}

		if (arg[0] === '-') {
			const [originalArgName, argStr] = arg[1] === '-' ? arg.split('=', 2) : [arg, undefined];

			let argName = originalArgName;
			while (argName in aliases) {
				argName = aliases[argName];
			}

			if (!(argName in handlers)) {
				// Handle repeating boolean flags
				const shortArg = argName.substring(0, 2);
				const rest = argName.substring(2);
				if (shortArg in handlers &&
					Array.isArray(handlers[shortArg]) &&
					rest.length > 0 &&
					rest === argName.substring(1, 2).repeat(rest.length)
				) {
					argName = shortArg;

					if (!result[argName]) {
						result[argName] = [];
					}

					result[argName].push(...Array(rest.length + 1).fill(true));
					continue;
				} else if (permissive) {
					result._.push(arg);
					continue;
				} else {
					const err = new Error(`Unknown or unexpected option: ${originalArgName}`);
					err.code = 'ARG_UNKNOWN_OPTION';
					throw err;
				}
			}

			const [type, isArray] = Array.isArray(handlers[argName]) ?
				[handlers[argName][0], true] :
				[handlers[argName], false];

			let value;
			if (type === Boolean) {
				value = true;
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
		} else {
			result._.push(arg);
		}
	}

	return result;
}

module.exports = arg;
