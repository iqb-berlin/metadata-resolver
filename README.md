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

## Version

**0.1.0** - Testing phase

## Development

### Setup

```bash
npm install
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

# Format code
npm run format
```

### Build

```bash
npm run build
```

## Release

To publish a new version to NPM:

1.  **Update Version**:
    ```bash
    npm version patch # or minor, major
    ```
    This updates `package.json` and creates a git tag.

2.  **Push Changes**:
    ```bash
    git push && git push --tags
    ```

3.  **Publish**:
    ```bash
    npm run release
    ```
    The `prepublishOnly` script will automatically run tests, linting, and build before publishing ensures only valid code is released.

### Configuration

-   **Registry**: Configured in `.npmrc` (default is npmjs.org).
-   **Access**: defaults to `public` in `package.json`.
-   **Tags**: pass flags to the release script:
    ```bash
    npm run release -- --tag beta
    ```

## License

MIT © IQB Berlin
