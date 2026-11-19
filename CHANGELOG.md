# Changelog

## 0.2.2 (unreleased)

- Keep successfully loaded vocabularies available through the resolver's getters
  with `cache: false`, while bypassing the resolver cache on each load.
- Support `@iqbspecs/metadata-profile` 0.11.1 and 0.12.x as a peer dependency.
- Include ESM and CommonJS builds and all three TypeScript declaration files.
- Cover vocabulary loading, cache behaviour, timeouts, HTTP errors and URL
  resolution with automated tests. Update the lint, test and CI tooling.

## 0.2.1 (2026-06-29)

- Add the generic `dist/index.d.ts` declaration.
- [Source commit recorded by npm](https://github.com/iqb-berlin/metadata-resolver/commit/4dbc8357f3c7c6fd312becce1d6cbf825ce3e246).

## 0.2.0 (2026-03-23)

- Migrate the resolver to the IQB metadata profile specification.
- [Source commit recorded by npm](https://github.com/iqb-berlin/metadata-resolver/commit/bccc967ceed78a2fd2a2f3d5a3e08888bd80ba07).
