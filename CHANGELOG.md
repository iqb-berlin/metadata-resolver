# Changelog

## 0.2.2

- With `cache: false`, the getters retain the last successfully loaded
  vocabulary for each URL. Loads in this mode still call `fetch`.
- Share `@iqbspecs/metadata-profile` with consuming projects through a peer
  dependency supporting `^0.11.1` and `^0.12.0`.
- Generate the generic `dist/index.d.ts` with a platform-independent Node.js
  build step and include the changelog in the npm package.
- Cover cache behaviour, HTTP and JSON errors, timeouts, redirects and
  fallbacks with automated tests. CI checks Node.js 22.18.0 and a Node.js 22.x
  release, runs dependency audits and uses the updated lint and test tooling.
- Document releases from `main` and verify the remote tag before publishing to npm.

## 0.2.1 (2026-06-29)

- Add the generic `dist/index.d.ts` declaration.
- [Source commit recorded by npm](https://github.com/iqb-berlin/metadata-resolver/commit/4dbc8357f3c7c6fd312becce1d6cbf825ce3e246).

## 0.2.0 (2026-03-23)

- Migrate the resolver to the IQB metadata profile specification.
- [Source commit recorded by npm](https://github.com/iqb-berlin/metadata-resolver/commit/bccc967ceed78a2fd2a2f3d5a3e08888bd80ba07).
