# Rules

A Box of Scraps's TypeScript lint rules.

## Installation

Choose the setup for your linter. Both examples register the plugin as `abos` and enable `named-conditions` as a
warning. Enable other rules with `abos/<rule-name>`.

### ESLint

```sh
npm install --save-dev eslint typescript @typescript-eslint/parser @a-box-of-scraps/ts-rules
```

In `eslint.config.mjs`:

```js
import abos from "@a-box-of-scraps/ts-rules";
import tsParser from "@typescript-eslint/parser";

export default [{
	files: ["**/*.{ts,tsx,mts,cts}"],
	languageOptions: { parser: tsParser },
	plugins: { abos },
	rules: { "abos/named-conditions": "warn" },
}];
```

### Oxlint

```sh
npm install --save-dev oxlint @a-box-of-scraps/ts-rules
```

In `.oxlintrc.json`:

```json
{
  "jsPlugins": [{ "name": "abos", "specifier": "@a-box-of-scraps/ts-rules" }],
  "rules": { "abos/named-conditions": "warn" }
}
```

## Rules

Browse the [rule reference](docs/README.md) for examples and configuration options.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/rules/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
