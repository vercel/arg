/* global test */
/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;
const arg = require('.');

test('basic parses arguments from process.argv', () => {
	const curArgs = process.argv;
	process.argv = ['node', 'test.js', '--foo', '1337', '-B', 'hello', '--mcgee'];
	try {
		const args = arg({
			'--foo': Number,
			'--bar': String,
			'--mcgee': Boolean,
			'-B': '--bar'
		});

		expect(args).to.exist;
		expect(args['--foo']).to.equal(1337);
		expect(args['--bar']).to.equal('hello');
		expect(args['--mcgee']).to.equal(true);
	} finally {
		process.argv = curArgs;
	}
});

test('arg with no arguments', () => {
	expect(() => arg()).to.throw('Argument specification object is required');
});

test('basic extra arguments parsing', () => {
	const argv = ['hi', 'hello', 'there', '-'];
	expect(arg({}, {argv})).to.deep.equal({_: argv});
});

test('basic string parsing', () => {
	const argv = ['hey', '--foo', 'hi', 'hello'];
	expect(arg({'--foo': String}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': 'hi'});
});

test('basic string parsing (equals long-arg)', () => {
	const argv = ['hey', '--foo=hi', 'hello'];
	expect(arg({'--foo': String}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': 'hi'});
});

test('basic number parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	expect(arg({'--foo': Number}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': 1234});
});

test('basic boolean parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	expect(arg({'--foo': Boolean}, {argv})).to.deep.equal({_: ['hey', '1234', 'hello'], '--foo': true});
});

test('basic custom type parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	const customType = (val, name) => `:${name}:${val}:`;
	expect(arg({'--foo': customType}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': ':--foo:1234:'});
});

test('basic string parsing (array)', () => {
	const argv = ['hey', '--foo', 'hi', 'hello', '--foo', 'hey'];
	expect(arg({'--foo': [String]}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': ['hi', 'hey']});
});

test('basic number parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', '5432'];
	expect(arg({'--foo': [Number]}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': [1234, 5432]});
});

test('basic boolean parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', 'hallo'];
	expect(arg({'--foo': [Boolean]}, {argv})).to.deep.equal({_: ['hey', '1234', 'hello', 'hallo'], '--foo': [true, true]});
});

test('basic custom type parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', '8911hi'];
	const customType = (val, name) => `:${name}:${val}:`;
	expect(arg({'--foo': [customType]}, {argv})).to.deep.equal({_: ['hey', 'hello'], '--foo': [':--foo:1234:', ':--foo:8911hi:']});
});

test('basic alias parsing', () => {
	const argv = ['--foo', '1234', '-B', '-', 'hello', '--not-foo-or-bar', 'ohai'];

	const opts = {
		'--foo': Number,
		'--bar': String,
		'--another-arg': Boolean,
		'-a': '--another-arg',
		'--not-foo-or-bar': '--another-arg',
		'-B': '--bar'
	};

	expect(arg(opts, {argv})).to.deep.equal({
		_: ['hello', 'ohai'],
		'--foo': 1234,
		'--bar': '-',
		'--another-arg': true
	});
});

test('double-dash parsing', () => {
	const argv = ['--foo', '1234', 'hi', '--foo', '5678', 'there', '--', '--foo', '2468'];
	expect(arg({'--foo': Number}, {argv})).to.deep.equal({_: ['hi', 'there', '--foo', '2468'], '--foo': 5678});
});

test('error: invalid option', () => {
	const argv = ['--foo', '1234', '--bar', '8765'];
	expect(() => arg({'--foo': Number}, {argv})).to.throw('Unknown or unexpected option: --bar');
});

test('error: expected argument', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg({'--foo': String, '--bar': Number}, {argv})).to.throw('Option requires argument: --foo');
});

test('error: expected argument (end flag)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => arg({'--foo': Boolean, '--bar': Number}, {argv})).to.throw('Option requires argument: --bar');
});

test('error: expected argument (alias)', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg({'--realfoo': String, '--foo': '--realfoo', '--bar': Number}, {argv})).to.throw('Option requires argument: --foo (alias for --realfoo)');
});

test('error: expected argument (end flag) (alias)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => arg({'--foo': Boolean, '--realbar': Number, '--bar': '--realbar'}, {argv})).to.throw('Option requires argument: --bar (alias for --realbar)');
});

test('error: non-function type', () => {
	const argv = [];
	expect(() => arg({'--foo': 10}, {argv})).to.throw('Type missing or not a function or valid array type: --foo');
	expect(() => arg({'--foo': null}, {argv})).to.throw('Type missing or not a function or valid array type: --foo');
	expect(() => arg({'--foo': undefined}, {argv})).to.throw('Type missing or not a function or valid array type: --foo');
});

test('error: no singular - keys allowed', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg({'-': Boolean, '--bar': Number}, {argv})).to.throw('Argument key must have a name; singular \'-\' keys are not allowed: -');
});

test('error: no multi character short arguments', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg({'-abc': Boolean, '--bar': Number}, {argv})).to.throw('Short argument keys (with a single hyphen) must have only one character: -abc');
});

test('permissive mode allows unknown args', () => {
	const argv = ['foo', '--real', 'nice', '--unreal', 'stillnice', '-a', '1', '-b', '2', 'goodbye'];
	const result = arg(
		{
			'--real': String,
			'--first': Number,
			'-a': '--first'
		}, {
			argv,
			permissive: true
		}
	);

	expect(result).to.deep.equal({
		_: ['foo', '--unreal', 'stillnice', '-b', '2', 'goodbye'],
		'--real': 'nice',
		'--first': 1
	});
});

test('permissive mode works with no argv specified', () => {
	const curArgs = process.argv;
	process.argv = ['node', 'test.js', '--foo', '1337', '-B', 'hello', '--mcgee'];
	try {
		const result = arg({
			'--foo': Number,
			'--mcgee': Boolean,
			'--unused': Boolean
		}, {
			permissive: true
		});

		expect(result).to.deep.equal({
			_: ['-B', 'hello'],
			'--foo': 1337,
			'--mcgee': true
		});
	} finally {
		process.argv = curArgs;
	}
});

test('ensure that all argument properties start with a hyphen', () => {
	expect(() =>
		arg({
			'--foo': Number,
			bar: String,
			'--baz': Boolean
		})
	).to.throw(TypeError, 'Argument key must start with \'-\' but found: \'bar\'');
});

test('types with the Flag symbol should be passed true instead of an argument', () => {
	const argv = ['--mcgee', '--foo', 'bar', '--baz', '10', 'qix'];

	const result = arg({
		'--mcgee': Boolean,
		'--foo': arg.flag(() => 1337),
		'--baz': Number
	}, {
		argv
	});

	expect(result).to.deep.equal({
		_: ['bar', 'qix'],
		'--mcgee': true,
		'--foo': 1337,
		'--baz': 10
	});
});

test('COUNT should count the number of times a flag has been passed', () => {
	const argv = ['--verbose', '-v', '--verbose', 'foo', '-vvvv', '-vv'];

	const result = arg({
		'--verbose': arg.COUNT,
		'-v': '--verbose'
	}, {
		argv
	});

	expect(result).to.deep.equal({
		_: ['foo'],
		'--verbose': 9
	});
});

test('should parse combined shortarg flags', () => {
	const argv = ['-vv', '-sd', 'foo', '-vdv'];

	const result = arg({
		'-v': [Boolean],
		'-s': Boolean,
		'-d': arg.COUNT
	}, {
		argv
	});

	expect(result).to.deep.equal({
		_: ['foo'],
		'-v': [true, true, true, true],
		'-s': true,
		'-d': 2
	});
});

test('should parse combined shortarg alias flags', () => {
	const argv = ['-vv', '--verbose', '-dvd', 'foo', '--dee', '-vdv'];

	const result = arg({
		'--verbose': [Boolean],
		'-v': '--verbose',
		'--dee': arg.COUNT,
		'-d': '--dee'
	}, {
		argv
	});

	expect(result).to.deep.equal({
		_: ['foo'],
		'--verbose': [true, true, true, true, true, true],
		'--dee': 4
	});
});

test('should allow a non-flag shortarg to suffix a string of shortarg flags', () => {
	const argv = ['-vvLo', 'foo'];

	const result = arg({
		'-v': arg.COUNT,
		'-L': Boolean,
		'-o': String
	}, {
		argv
	});

	expect(result).to.deep.equal({
		_: [],
		'-v': 2,
		'-L': true,
		'-o': 'foo'
	});
});

test('should error if a non-flag shortarg comes before a shortarg flag in a condensed shortarg argument', () => {
	const argv = ['-vsv', 'foo'];

	expect(() => arg({
		'-v': arg.COUNT,
		'-s': String
	}, {
		argv
	})).to.throw(TypeError, 'Option requires argument (but was followed by another short argument): -s');
});
