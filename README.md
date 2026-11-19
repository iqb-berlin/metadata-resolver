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
# Use Node.js 22.18.0 or later in the Node.js 22 LTS line.
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
(
  set -euo pipefail

  git fetch origin main
  commit=$(git rev-parse HEAD)
  main_commit=$(git rev-parse FETCH_HEAD)
  working_tree=$(git status --porcelain)
  if [[ "$commit" != "$main_commit" || -n "$working_tree" ]]; then
    echo 'Release requires a clean checkout of origin/main.' >&2
    exit 1
  fi

  npm ci --engine-strict
  npm run typecheck
  npm run lint
  npm test
  npm run build
  npm pack --dry-run

  version=$(node -p 'require("./package.json").version')
  tag="v$version"
  tag_ref="refs/tags/$tag"
  if ! git show-ref --verify --quiet "$tag_ref"; then
    git tag -a "$tag" -m "Release $tag" "$commit"
  fi
  test "$(git rev-parse "$tag_ref^{commit}")" = "$commit"
  git push origin "$tag_ref"

  remote_commit=$(git ls-remote --exit-code --tags origin "$tag_ref^{}" | cut -f1)
  if [[ "$remote_commit" != "$commit" ]]; then
    echo "Remote tag $tag does not point to $commit." >&2
    exit 1
  fi

  npm run release
  test "$(npm view "@iqb/metadata-resolver@$version" gitHead)" = "$commit"
)
```

After the registry commit check passes, create a GitHub release from the tag
using the corresponding changelog entry. For a prerelease, use an explicit
prerelease version and replace the publish command in the block with
`npm run release -- --tag beta`.

## License

MIT © IQB Berlin
