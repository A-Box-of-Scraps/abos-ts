# abos-ts

TypeScripts utilities and lint rules shared across projects.

## Project Structure

Here is an overview of the project:

```
coverage/
.githooks/
node_modules/
packages/
  rules/
  utils/
scripts/
test/
.gitattributes
.gitignore
.jscpd.json
AGENTS.md
dprint.json
knip.json
LICENSE
oxlint.config.ts
package.json
package-lock.json
README.md
tsconfig.json
vite.config.ts
vitest.config.ts
```

## Development

- You must write tests that are easy to scan and understand with clear `Arrange / Act / Assert` sections.

## Verification

`npm run check` must pass to validate changes.

## Commits & Pull Requests

- Follow the Conventional Commits specification for commit messages.
- Pull request summaries should include the related issue(s), a brief description of the changes, and how the changes
  were tested.
