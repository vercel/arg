# Arg

`arg` is yet another command line option parser.

## Installation

Use Yarn or NPM to install.

```console
$ yarn add arg
```

or

```console
$ npm install arg
```

## Usage

`arg()` takes 1 or 2 arguments:

1. An array of CLI arguments (_Optional_, defaults to `process.argv.slice(2)`)
2. Options argument (see below)

It returns an object with any values present on the command-line (missing options are thus
missing from the resulting object). Arg performs no validation/requirement checking - we
leave that up to the application.

All parameters that aren't consumed by options (commonly referred to as "extra" parameters)
are added to `result._`, which is _always_ an array (even if no extra parameters are passed,
in which case an empty array is returned).

```javascript
const arg = require('arg');

const args = arg([argument_array,] options);
```

For example:

```console
$ node ./hello.js --port=1234 -n 'My name' foo bar --tag qux --tag=qix -- --foobar
```

```javascript
// hello.js
const arg = require('arg');

const args = arg({
	// Types
	'--help':    Boolean,
	'--version': Boolean,
	'--port':    Number,      // --port <number> or --port=<number>
	'--name':    String,      // --name <string> or --name=<string>
	'--tag':     [String],    // --tag <string> or --tag=<string>

	// Aliases
	'-v':        '--version',
	'-n':        '--name',    // -n <string>; result is stored in --name
	'--label':   '--name'     // --label <string> or --label=<string>;
	                          //     result is stored in --name
});

console.log(args);
/*
{
	_: ["foo", "bar", "--foobar"],
	'--port': 1234,
	'--name': "My name",
	'--tag': ["qux", "qix"]
}
*/
```

The values for each key=&gt;value pair is either a type (function or [function]) or a string (indicating an alias).

- In the case of a function, the string value of the argument's value is passed to it,
  and the return value is used as the ultimate value.

- In the case of an array, the only element _must_ be a type function. Array types indicate
  that the argument may be passed multiple times, and as such the resulting value in the returned
  object is an array with all of the values that were passed using the specified flag.

- In the case of a string, an alias is established. If a flag is passed that matches the _key_,
  then the _value_ is substituted in its place.

Type functions are passed three arguments:

1. The parameter value (always a string)
2. The parameter name (e.g. `--label`)
3. The previous value for the destination (useful for reduce-like operatons or for supporting `-v` multiple times, etc.)

This means the built-in `String`, `Number`, and `Boolean` type constructors "just work" as type functions.

# License

Copyright &copy; 2017 by ZEIT, Inc. Released under the [MIT License](LICENSE.md).
