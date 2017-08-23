# Zarg

Zarg is yet another command line option parser.

## Installation

Use Yarn or NPM to install.

```console
$ yarn add zarg
```

or

```console
$ npm install zarg
```

## Usage

`zarg()` takes 1-3 arguments:

1. An array of CLI arguments (_Optional_, defaults to `process.argv.slice(2)`)
2. Options argument (see below)
3. Function to call for unknown options (_Optional_, raises a descriptive error by default)

It returns an object with any values present on the command-line (missing options are thus
missing from the resulting object). Zarg performs no validation/requirement checking - we
leave that up to the application.

All parameters that aren't consumed by options (commonly referred to as "extra" parameters)
are added to `result._`, which is _always_ an array (even if no extra parameters are passed,
in which case an empty array is returned).

```javascript
const zarg = require('zarg');

const args = zarg([argument_array,] options [, unknown_callback_fn]);
```

For example:

```javascript
// node ./hello.js --port=1234 -n 'My name' foo bar
const zarg = require('zarg');

const args = zarg({
	help:    Boolean,                      // --help
	version: [Boolean, '-v'],              // --version or -v
	port:    Number,                       // --port <number> or --port=<number>
	name:    [String, '-n', '--label']     // --name <string>, --name=<string>, -n <string>,
	                                       //     --label <string>, or --label=<string>
});

console.log(args);
/*
{
	_: ["foo", "bar"],
	port: 1234,
	name: "My name"
}
*/
```

The options object defaults to having its keys as long arguments.

The values for each key=&gt;value pair is either a type function or an array.

- In the case of a function, the string value of the argument's value is passed to it,
  and the return value is used as the ultimate value.

- In the case of an array, the first element _must_ be a type function,
  and any subsequent strings are used as aliases.

Type functions are passed three arguments:

1. The parameter value (always a string)
2. The parameter name (e.g. `--label`)
3. The previous value for the destination (useful for reduce-like operatons or for supporting `-v` multiple times, etc.)

This means the built-in `String`, `Number`, and `Boolean` type constructors "just work" as type functions.

If a parameter is present in the argument array but isn't configured in the options object,
the function supplied in the third argument (if present) is called with two arguments:

1. The name of the option that was unknown
2. The argument value (only if the option was formatted as `--long-name=something`)

For example, this is the default unknown handler:

```javascript
function defaultUnknownHandler(name, /* , val */) {
	throw new Error(`Unknown or unexpected option: ${name}`);
}
```

# License

Copyright &copy; 2017 by ZEIT, Inc. Released under the [MIT License](LICENSE.md).
