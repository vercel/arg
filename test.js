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
	expect(arg()).to.deep.equal({_: []});
});

test('basic extra arguments parsing', () => {
	const argv = ['hi', 'hello', 'there', '-'];
	expect(arg(argv, {})).to.deep.equal({_: argv});
});

test('basic string parsing', () => {
	const argv = ['hey', '--foo', 'hi', 'hello'];
	expect(arg(argv, {'--foo': String})).to.deep.equal({_: ['hey', 'hello'], '--foo': 'hi'});
});

test('basic string parsing (equals long-arg)', () => {
	const argv = ['hey', '--foo=hi', 'hello'];
	expect(arg(argv, {'--foo': String})).to.deep.equal({_: ['hey', 'hello'], '--foo': 'hi'});
});

test('basic number parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	expect(arg(argv, {'--foo': Number})).to.deep.equal({_: ['hey', 'hello'], '--foo': 1234});
});

test('basic boolean parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	expect(arg(argv, {'--foo': Boolean})).to.deep.equal({_: ['hey', '1234', 'hello'], '--foo': true});
});

test('basic custom type parsing', () => {
	const argv = ['hey', '--foo', '1234', 'hello'];
	const customType = (val, name) => `:${name}:${val}:`;
	expect(arg(argv, {'--foo': customType})).to.deep.equal({_: ['hey', 'hello'], '--foo': ':--foo:1234:'});
});

test('basic string parsing (array)', () => {
	const argv = ['hey', '--foo', 'hi', 'hello', '--foo', 'hey'];
	expect(arg(argv, {'--foo': [String]})).to.deep.equal({_: ['hey', 'hello'], '--foo': ['hi', 'hey']});
});

test('basic number parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', '5432'];
	expect(arg(argv, {'--foo': [Number]})).to.deep.equal({_: ['hey', 'hello'], '--foo': [1234, 5432]});
});

test('basic boolean parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', 'hallo'];
	expect(arg(argv, {'--foo': [Boolean]})).to.deep.equal({_: ['hey', '1234', 'hello', 'hallo'], '--foo': [true, true]});
});

test('basic custom type parsing (array)', () => {
	const argv = ['hey', '--foo', '1234', 'hello', '--foo', '8911hi'];
	const customType = (val, name) => `:${name}:${val}:`;
	expect(arg(argv, {'--foo': [customType]})).to.deep.equal({_: ['hey', 'hello'], '--foo': [':--foo:1234:', ':--foo:8911hi:']});
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

	expect(arg(argv, opts)).to.deep.equal({
		_: ['hello', 'ohai'],
		'--foo': 1234,
		'--bar': '-',
		'--another-arg': true
	});
});

test('double-dash parsing', () => {
	const argv = ['--foo', '1234', 'hi', '--foo', '5678', 'there', '--', '--foo', '2468'];
	expect(arg(argv, {'--foo': Number})).to.deep.equal({_: ['hi', 'there', '--foo', '2468'], '--foo': 5678});
});

test('error: invalid option', () => {
	const argv = ['--foo', '1234', '--bar', '8765'];
	expect(() => arg(argv, {'--foo': Number})).to.throw('Unknown or unexpected option: --bar');
});

test('error: expected argument', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg(argv, {'--foo': String, '--bar': Number})).to.throw('Option requires argument: --foo');
});

test('error: expected argument (end flag)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => arg(argv, {'--foo': Boolean, '--bar': Number})).to.throw('Option requires argument: --bar');
});

test('error: expected argument (alias)', () => {
	const argv = ['--foo', '--bar', '1234'];
	expect(() => arg(argv, {'--realfoo': String, '--foo': '--realfoo', '--bar': Number})).to.throw('Option requires argument: --foo (alias for --realfoo)');
});

test('error: expected argument (end flag) (alias)', () => {
	const argv = ['--foo', '--bar'];
	expect(() => arg(argv, {'--foo': Boolean, '--realbar': Number, '--bar': '--realbar'})).to.throw('Option requires argument: --bar (alias for --realbar)');
});

test('error: non-function type', () => {
	expect(() => arg([], {'--foo': 10})).to.throw('Type missing or not a function or valid array type: --foo');
	expect(() => arg([], {'--foo': null})).to.throw('Type missing or not a function or valid array type: --foo');
	expect(() => arg([], {'--foo': undefined})).to.throw('Type missing or not a function or valid array type: --foo');
});
