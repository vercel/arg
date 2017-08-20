function defaultUnknownHandler(name, /* , val */) {
	throw new Error(`Unknown or unexpected option: ${name}`);
}

function zarg(argv, opts, unknownHandler) {
	if (!Array.isArray(argv)) {
		unknownHandler = opts;
		opts = argv;
		argv = null;
	}

	if (typeof opts === 'function') {
		unknownHandler = opts;
		opts = null;
	}

	argv = argv || process.argv.slice(2);
	opts = opts || {};
	unknownHandler = unknownHandler || defaultUnknownHandler;

	const handlers = {};
	const setType = (name, type, dest) => {
		if (name in handlers) {
			const odest = handlers[name][1];
			const extended = `--${dest}` === name ? '' : `alias for --${dest}, `;
			throw new Error(`Duplicate option configuration: ${name} (${extended}originally for --${odest})`);
		}

		handlers[name] = [type, dest];
	};

	for (const key of Object.keys(opts)) {
		const [type, aliases] = Array.isArray(opts[key]) ? [opts[key][0], opts[key].slice(1)] : [opts[key], []];

		const name = `--${key}`;

		if (!type || typeof type !== 'function') {
			throw new Error(`Type missing or not a function: ${name}`);
		}

		setType(name, type, key);

		for (const alias of aliases) {
			setType(alias, type, key);
		}
	}

	const result = {_: []};

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
			const [argName, argStr] = arg[1] === '-' ? arg.split('=', 2) : [arg, undefined];

			if (!(argName in handlers)) {
				unknownHandler(argName, argStr);
				continue;
			}

			const [type, dest] = handlers[argName];

			if (type === Boolean) {
				result[dest] = true;
			} else if (argStr === undefined) {
				if (argv.length < i + 2 || (argv[i + 1].length > 1 && argv[i + 1][0] === '-')) {
					const extended = `--${dest}` === argName ? '' : ` (alias for --${dest})`;
					throw new Error(`Option requires argument: ${argName}${extended}`);
				}

				result[dest] = type(argv[i + 1], argName, result[dest]);
				++i;
			} else {
				result[dest] = type(argStr, argName, result[dest]);
			}
		} else {
			result._.push(arg);
		}
	}

	return result;
}

module.exports = zarg;
