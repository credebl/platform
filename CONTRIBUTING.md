## How to contribute

You are encouraged to contribute to the repository by **forking and submitting a pull request**.

For significant changes, please open an issue first to discuss the proposed changes to avoid re-work.

(If you are new to GitHub, you might start with a [basic tutorial](https://help.github.com/articles/set-up-git) and check out a more detailed guide to [pull requests](https://help.github.com/articles/using-pull-requests/).)

Pull requests will be evaluated by the repository guardians on a schedule and if deemed beneficial will be committed to the `main` branch. Pull requests should have a descriptive name, include an summary of all changes made in the pull request description, and include unit tests that provide good coverage of the feature or fix. A Continuous Integration (CI) pipeline is executed on all PRs before review and contributors are expected to address all CI issues identified. Where appropriate, PRs that impact the
end-user and developer demos (if any) in the repo should include updates or extensions to those demos to cover the new capabilities.

If you would like to propose a significant change, please open an issue first to discuss the work with the community.

## Dependency updates

[Dependabot](https://github.com/credebl/platform/blob/main/.github/dependabot.yml) opens grouped pull requests for npm (patch and minor), GitHub Actions, Docker, and Docker Compose dependencies on a weekly schedule.

Because the unit specs mock the affected libraries away, dependency and security bumps should be verified against the real runtime packages before merging. Run the matching `*.integration.spec.ts` suite from the [README Testing section](https://github.com/credebl/platform/blob/main/README.md#testing) (e.g. SMTP for nodemailer changes, the HTTP suite for axios, the tracer suite for @opentelemetry/sdk-node, the multipart upload suite for form-data/multer). These suites run entirely in-process and require no external services or credentials.

When Dependabot PRs conflict with merged updates, prefer rebasing the PR onto `main` (resolving the lockfile with `pnpm install --lockfile-only`) over closing and reopening, so review history is preserved. All commits must remain signed and DCO-compliant.

Contributions are made pursuant to the Developer's Certificate of Origin, available at [https://developercertificate.org](https://developercertificate.org), and licensed under the Apache License, version 2.0 (Apache-2.0).
