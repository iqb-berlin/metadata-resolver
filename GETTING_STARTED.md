# Getting Started Guide - Local Testing

This guide shows you how to test the metadata-resolver package locally.

## Package Structure

```
metadata-resolver/
├── src/
│   ├── index.ts              # Main entry point
│   ├── metadata-resolver.ts  # Core resolver class
│   └── types.ts              # TypeScript type definitions
├── dist/                     # Build output (after npm run build)
│   ├── index.js             # CommonJS build
│   ├── index.mjs            # ES Module build
│   ├── index.d.ts           # TypeScript definitions
│   └── index.d.mts          # TypeScript definitions (ESM)
├── test.html                 # Browser test page
├── package.json
└── README.md
```

## Step 1: Build the Package

Navigate to the metadata-resolver directory and build:

```bash
cd metadata-resolver
npm install
npm run build
```

This creates the dist/ folder with compiled JavaScript and TypeScript definitions.

## Step 2: Test in Browser

Start a local web server in the metadata-resolver directory:

```bash
npx http-server -p 8080
```

Open your browser and navigate to:

```
http://localhost:8080/test.html
```

### Available Tests

**Load Profile Only**
- Shows profile structure
- Lists vocabulary URLs referenced in the profile
- Displays profile metadata

**Load Profile and Vocabularies**
- Loads the profile
- Fetches all vocabularies referenced in the profile
- Shows detailed information for each vocabulary including:
   - Vocabulary title and URL
   - Number of top concepts
   - Total dictionary entries
   - Sample vocabulary entries
   - Loading status

### Using the Test Page

1. Enter a profile URL in the input field (default is pre-filled)
2. Click "Load Profile Only" to test profile loading
3. Click "Load Profile and Vocabularies" to test the complete workflow
4. Review the output in the display area below
5. Use "Clear Output" to reset the display

## Step 3: Link for Local Development

To use this package in another project without publishing to npm:

### Option A: npm link (Recommended)

In the resolver package directory:

```bash
cd metadata-resolver
npm link
```

In your other project directory:

```bash
cd ../your-project
npm link @iqb/metadata-resolver
```

Now you can import it in your project:

```typescript
import { MetadataResolver } from '@iqb/metadata-resolver';
```

### Option B: Direct File Path

In your project's package.json:

```json
{
  "dependencies": {
    "@iqb/metadata-resolver": "file:../metadata-resolver"
  }
}
```

Then run:

```bash
npm install
```

### Option C: Copy dist Files

Copy the dist/ folder contents to your project and import directly:

```typescript
import { MetadataResolver } from './path/to/dist/index.mjs';
```

## Step 4: Use in Your Code

### Basic Usage

```typescript
import { MetadataResolver } from '@iqb/metadata-resolver';

const resolver = new MetadataResolver({
  cache: true,
  preferredLanguage: 'de'
});

// Load profile with vocabularies
const data = await resolver.loadProfileWithVocabularies(
  'https://raw.githubusercontent.com/iqb-vocabs/p16/master/unit.json'
);

console.log(data.profile);
console.log(data.vocabularies);
```

### Advanced Usage

```typescript
import { MetadataResolver } from '@iqb/metadata-resolver';

const resolver = new MetadataResolver({
  cache: true,
  preferredLanguage: 'de',
  requestTimeout: 10000
});

// Load profile
const profile = await resolver.loadProfile(profileUrl);

// Load vocabularies
const vocabularies = await resolver.loadVocabularies(profile);

// Access vocabulary dictionary
const dictionary = resolver.getVocabularyDictionary();

// Look up specific entry
const entry = dictionary['https://w3id.org/iqb/v10/i1/f5b'];
console.log(entry.name);
```

### With Web Components

```typescript
import { MetadataResolver } from '@iqb/metadata-resolver';

const resolver = new MetadataResolver();

// Load data
const { profile, vocabularies } = await resolver.loadProfileWithVocabularies(profileUrl);

// Get form element
const form = document.getElementById('metadata-form');

// Set data
form.profileData = JSON.stringify(profile);
form.vocabularies = vocabularies.map(v => ({ url: v.url, data: v.data }));

// Set vocabulary dictionary
const vocabDict = resolver.getVocabularyDictionary();
form.vocabulariesIdDictionary = vocabDict;

// Listen for changes
form.addEventListener('metadataChange', (event) => {
  console.log('Metadata changed:', event.detail);
});
```

## Troubleshooting

### Module Import Errors

If you get "Cannot find module" errors:

1. Make sure you built the package: `npm run build`
2. Check the import path matches your setup
3. For TypeScript, ensure `@iqb/metadata` is installed as a peer dependency

### Test Page Not Loading

If test.html shows errors:

1. Verify the dist/ folder exists (run `npm run build`)
2. Check browser console for specific error messages
3. Ensure the web server is running on the correct port
4. Verify the import path in test.html points to `./dist/index.mjs`

### Network Request Failures

If vocabularies fail to load:

1. Check the vocabulary URL is accessible
2. Verify network connectivity
3. Check browser network tab for HTTP status codes
4. Ensure vocabulary URLs return valid JSON-LD format

### CORS Errors

If you encounter CORS errors:

Most vocabulary sources (like w3id.org) support CORS by default. If you encounter CORS issues:

1. Verify the vocabulary source supports CORS
2. Check browser console for specific CORS error messages
3. Consider using a backend proxy for production environments

## Development Workflow

While developing, use watch mode to automatically rebuild on changes:

```bash
# Terminal 1: Watch and rebuild on changes
cd metadata-resolver
npm run dev

# Terminal 2: Run your web server
npx http-server -p 8080
```

Changes to source files in src/ will trigger automatic rebuilds.

## Configuration Options

The MetadataResolver accepts these configuration options:

```typescript
interface LoaderOptions {
  cache?: boolean;              // Enable caching (default: true)
  preferredLanguage?: string;   // Language for labels (default: 'de')
  requestTimeout?: number;      // Request timeout in ms (default: 10000)
  corsProxy?: string;           // Optional CORS proxy URL
}
```

Example with all options:

```typescript
const resolver = new MetadataResolver({
  cache: true,
  preferredLanguage: 'en',
  requestTimeout: 15000,
  corsProxy: undefined
});
```

## Next Steps

1. Test with your actual profile URLs
2. Verify vocabularies load correctly
3. Integrate with your application
4. Implement error handling for your use case
5. Review the complete API documentation in README.md

## Resources

- Type Definitions: See src/types.ts
- Test Page: test.html
- Package Configuration: package.json
