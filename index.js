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

		if (typeof opts[key] === 'string') {
			aliases[key] = opts[key];
			continue;
		}

		const type = opts[key];

		if (typeof type !== 'function') {
			throw new TypeError(`Type is not a function: ${key}`);
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
				if (permissive) {
					result._.push(arg);
					continue;
				} else {
					const err = new Error(`Unknown or unexpected option: ${originalArgName}`);
					err.code = 'ARG_UNKNOWN_OPTION';
					throw err;
				}
			}

			const type = handlers[argName];
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

			result[argName] = value;
		} else {
			result._.push(arg);
		}
	}

	return result;
}

arg.of = fn => (value, argName, prev = []) => {
	return prev.concat(fn(value, argName, prev[prev.length - 1]));
};

module.exports = arg;
