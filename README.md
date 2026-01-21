# @iqb/metadata-resolver

Framework-agnostic TypeScript library for loading metadata profiles and vocabularies.

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

## License

MIT © IQB Berlin