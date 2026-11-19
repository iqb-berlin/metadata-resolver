# @iqb/metadata-resolver

TypeScript library for loading metadata profiles and vocabularies.

## Installation
```bash
npm install @iqb/metadata-resolver
```

## Quick Start
```typescript
import { MetadataResolver } from '@iqb/metadata-resolver';

const resolver = new MetadataResolver();
const data = await resolver.loadProfileWithVocabularies(
  'https://raw.githubusercontent.com/iqb-vocabs/p16/master/unit.json'
);

console.log(data.profile);
console.log(data.vocabularies);
```

## Documentation

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed usage guide.

## Versions

The [npm package](https://www.npmjs.com/package/@iqb/metadata-resolver) lists the
latest published version. The version in [package.json](./package.json) is the
version prepared on this branch. See the [changelog](./CHANGELOG.md) for release
notes and the source commits of older npm releases.

## Development

### Setup

```bash
# Use Node.js 22.13 or later in the Node.js 22 LTS line.
npm ci
```

### Quality Checks

We use **ESLint** and **Prettier** to ensure code quality.

```bash
# Run linting
npm run lint

# Run type check
npm run typecheck

# Run tests
npm run test

# Report dependency vulnerabilities
npm audit --omit=dev
npm audit

# Format code
npm run format
```

CI runs both audits. The scoped `minimatch` override for
`eslint-plugin-sonarjs` follows the [IQB ESLint dependency guidance](https://github.com/iqb-berlin/eslint-config/blob/master/docs/security.md).
When updating the lint stack, check whether its declared dependency range
includes the fixed major before removing the override. The advisory is
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).

### Build

```bash
npm run build
```

## Release

Releases are cut from `main`. Before merging a release PR, update the changelog
and set the intended version in both npm manifests, for example with
`npm version patch --no-git-tag-version` when a bump is needed.

After CI passes on the merged commit, use a clean checkout of that exact commit
from `origin/main`. Confirm that the version has yet to be published to npm.

```bash
npm ci
npm run typecheck && npm run lint && npm test && npm run build
npm pack --dry-run
version=$(node -p 'require("./package.json").version')
git tag -a "v$version" -m "Release v$version"
git push origin "v$version"
npm run release
npm view "@iqb/metadata-resolver@$version" gitHead
git rev-parse "v$version^{commit}"
```

The last two commands should return the same commit. Create a GitHub release
from the tag using the corresponding changelog entry. For a prerelease, use an
explicit prerelease version and run `npm run release -- --tag beta`.

## License

MIT © IQB Berlin
