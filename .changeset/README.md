# Changesets

This folder holds pending release notes. Each pull request that changes the
platform adds a small markdown file here; when a release is prepared, the files
are turned into the version bump and the changelog entry.

The platform is versioned as one unit: the root `api-gateway` package carries
the platform version (the number in the `vX.Y.Z` release tags). The internal
workspace packages (`@credebl/common`, `@credebl/storage`,
`@credebl/notification`) are listed under `ignore` in `config.json` because
they are never released on their own.

Add a changeset with:

```bash
pnpm changeset
```

Use `pnpm changeset --empty` when a change needs no release note. See the
"Release notes and versioning" section of [CONTRIBUTING.md](../CONTRIBUTING.md)
for what patch, minor and major mean here and how a release is cut.

More about Changesets: <https://github.com/changesets/changesets>
