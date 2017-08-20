/* global test */
/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;
const zarg = require('.');

test('basic parses arguments from process.argv', () => {
	const curArgs = process.argv.slice(0);
	process.argv.splice(2, 1000, '--foo', '1337', '-B', 'hello', '--mcgee');
	try {
		const args = zarg({foo: Number, bar: [String, '-B'], mcgee: Boolean});
		expect(args).to.exist;
		expect(args.foo).to.equal(1337);
		expect(args.bar).to.equal('hello');
		expect(args.mcgee).to.equal(true);
	} finally {
		process.argv.splice(0, 1000, ...curArgs);
	}
});

test('basic extra arguments parsing', () => {
	const argv = ['hi', 'hello', 'there', '-'];

	const forms = [
		zarg(argv),
		zarg(argv, {}),
		zarg(argv, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: argv});
	}
});

test('basic string parsing', () => {
	const argv = ['hey', '--foo', 'hi', 'hello'];

	const forms = [
		zarg(argv, {foo: String}),
		zarg(argv, {foo: String}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: 'hi'});
	}
});

test('basic string parsing (equals long-arg)', () => {
	const argv = ['hey', '--foo=hi', 'hello'];

	const forms = [
		zarg(argv, {foo: String}),
		zarg(argv, {foo: String}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: 'hi'});
	}
});

test('basic number parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const forms = [
		zarg(argv, {foo: Number}),
		zarg(argv, {foo: Number}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: 1234});
	}
});

test('basic boolean parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const forms = [
		zarg(argv, {foo: Boolean}),
		zarg(argv, {foo: Boolean}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', '1234', 'hello'], foo: true});
	}
});

test('basic custom type parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const customType = (val, name) => `:${name}:${val}:`;

	const forms = [
		zarg(argv, {foo: customType}),
		zarg(argv, {foo: customType}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: ':--foo:1234:'});
	}
});

test('basic string parsing (array)', () => {
	const argv = ['hey', '--foo', 'hi', 'hello'];

	const forms = [
		zarg(argv, {foo: [String]}),
		zarg(argv, {foo: [String]}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: 'hi'});
	}
});

test('basic number parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const forms = [
		zarg(argv, {foo: [Number]}),
		zarg(argv, {foo: [Number]}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: 1234});
	}
});

test('basic boolean parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const forms = [
		zarg(argv, {foo: [Boolean]}),
		zarg(argv, {foo: [Boolean]}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', '1234', 'hello'], foo: true});
	}
});

test('basic custom type parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];

	const customType = (val, name) => `:${name}:${val}:`;

	const forms = [
		zarg(argv, {foo: [customType]}),
		zarg(argv, {foo: [customType]}, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({_: ['hey', 'hello'], foo: ':--foo:1234:'});
	}
});

test('basic alias parsing', () => {
	const argv = ['--foo', '1234', '-B', '-', 'hello', '--not-foo-or-bar', 'ohai'];

	const opts = {
		foo: Number,
		bar: [String, '-B'],
		'another-arg': [Boolean, '-a', '--not-foo-or-bar']
	};

	const forms = [
		zarg(argv, opts),
		zarg(argv, opts, () => {})
	];

	for (const args of forms) {
		expect(args).to.deep.equal({
			_: ['hello', 'ohai'],
			foo: 1234,
			bar: '-',
			'another-arg': true
		});
	}
});

test('double-dash parsing', () => {
	const argv = ['--foo', '1234', 'hi', '--foo', '5678', 'there', '--', '--foo', '2468'];
	expect(zarg(argv, {foo: Number})).to.deep.equal({_: ['hi', 'there', '--foo', '2468'], foo: 5678});
});

test('error: invalid option', () => {
	const argv = ['--foo', '1234', '--bar', '8765'];
	expect(() => zarg(argv, {foo: Number})).to.throw('Unknown or unexpected option: --bar');
});

test('error: invalid option (custom handler)', () => {
	const argv = ['--foo', '1234', '--bar', '8765'];
	expect(zarg(argv, {foo: Number}, () => null)).to.deep.equal({_: ['8765'], foo: 1234});
});

test('error: expected argument', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => zarg(argv, {foo: String, bar: Number})).to.throw('Option requires argument: --foo');
});

test('error: expected argument (end flag)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => zarg(argv, {foo: Boolean, bar: Number})).to.throw('Option requires argument: --bar');
});

test('error: expected argument (alias)', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => zarg(argv, {realfoo: [String, '--foo'], bar: Number})).to.throw('Option requires argument: --foo (alias for --realfoo)');
});

test('error: expected argument (end flag) (alias)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => zarg(argv, {foo: Boolean, realbar: [Number, '--bar']})).to.throw('Option requires argument: --bar (alias for --realbar)');
});

test('error: non-function type', () => {
	expect(() => zarg([], {foo: 10})).to.throw('Type missing or not a function: --foo');
	expect(() => zarg([], {foo: null})).to.throw('Type missing or not a function: --foo');
	expect(() => zarg([], {foo: undefined})).to.throw('Type missing or not a function: --foo');
});

test('error: duplicate handler', () => {
	expect(() => zarg([], {foo: [String, '--foo']})).to.throw('Duplicate option configuration: --foo (originally for --foo)');
	expect(() => zarg([], {foo: Number, bar: [String, '--foo']})).to.throw('Duplicate option configuration: --foo (alias for --bar, originally for --foo)');
});
