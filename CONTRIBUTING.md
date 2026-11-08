## How to contribute

You are encouraged to contribute to the repository by **forking and submitting a pull request**.

For significant changes, please open an issue first to discuss the proposed changes to avoid re-work.

(If you are new to GitHub, you might start with a [basic tutorial](https://help.github.com/articles/set-up-git) and check out a more detailed guide to [pull requests](https://help.github.com/articles/using-pull-requests/).)

Pull requests will be evaluated by the repository guardians on a schedule and if deemed beneficial will be committed to the `main` branch. Pull requests should have a descriptive name, include an summary of all changes made in the pull request description, and include unit tests that provide good coverage of the feature or fix. A Continuous Integration (CI) pipeline is executed on all PRs before review and contributors are expected to address all CI issues identified. Where appropriate, PRs that impact the
end-user and developer demos (if any) in the repo should include updates or extensions to those demos to cover the new capabilities.

If you would like to propose a significant change, please open an issue first to discuss the work with the community.

## Release notes and versioning

The platform uses [Changesets](https://github.com/changesets/changesets) to collect release notes while the work is done instead of reconstructing them at release time. The root `api-gateway` package carries the platform version, the same number as the `vX.Y.Z` release tag. The internal workspace packages are not versioned on their own.

### When to add a changeset

Add one to every pull request that changes behaviour a deployer or API consumer can notice: features, fixes, API or schema changes, configuration changes, dependency updates that matter at runtime. Pull requests that only touch documentation, CI or tests pass the **Changeset check** without one. If a change is neither of those and still needs no release note (a pure refactor, for example), add an empty changeset with `pnpm changeset --empty`.

### How to add a changeset

```bash
pnpm changeset
```

The prompt asks for the bump type and a summary. Pick `api-gateway`, choose the bump, and write the summary for the people reading the release notes: what changed and what a deployer must do about it. Commit the generated `.changeset/*.md` file with your pull request.

| Bump | Use it for |
| --- | --- |
| `patch` | Bug fixes, security updates, internal changes with no visible effect |
| `minor` | New features and new, backwards-compatible endpoints or options |
| `major` | Breaking API, schema or configuration changes that need a migration or a coordinated rollout |

### How a release is cut

1. Changesets merged into `main` are collected by the **Version Packages** workflow into a pull request named `chore: version packages`. It bumps the version in `package.json` and writes the entries into `CHANGELOG.md`.
2. A maintainer reviews that pull request and merges it when the release is ready.
3. A maintainer then pushes the `vX.Y.Z` tag (or `vX.Y.Z-rc.N` for a release candidate) for the merge commit. The tag starts the existing **Continuous Delivery** workflow, which builds and pushes the service images. The Changesets workflows never publish or tag anything.

## Dependency updates

[Dependabot](https://github.com/credebl/platform/blob/main/.github/dependabot.yml) opens grouped pull requests for npm (patch and minor), GitHub Actions, Docker, and Docker Compose dependencies on a weekly schedule.

Because the unit specs mock the affected libraries away, dependency and security bumps should be verified against the real runtime packages before merging. Run the matching `*.integration.spec.ts` suite from the [README Testing section](https://github.com/credebl/platform/blob/main/README.md#testing) (e.g. SMTP for nodemailer changes, the HTTP suite for axios, the tracer suite for @opentelemetry/sdk-node, the multipart upload suite for form-data/multer). These suites run entirely in-process and require no external services or credentials.

When Dependabot PRs conflict with merged updates, prefer rebasing the PR onto `main` (resolving the lockfile with `pnpm install --lockfile-only`) over closing and reopening, so review history is preserved. All commits must remain signed and DCO-compliant.

Contributions are made pursuant to the Developer's Certificate of Origin, available at [https://developercertificate.org](https://developercertificate.org), and licensed under the Apache License, version 2.0 (Apache-2.0).
