#!/usr/bin/env bash
# Fails a pull request that changes releasable code without adding a changeset.
#
# A changeset is any new .changeset/*.md file other than README.md. An empty
# changeset (created with `changeset --empty`) counts, so a change that needs no
# release note can opt out explicitly. Pull requests that only touch paths
# matching CHANGESET_EXEMPT_REGEX (documentation, CI, tests) pass without one.
#
# Environment:
#   BASE_REF                base branch of the pull request (for example main)
#   CHANGESET_EXEMPT_REGEX  extended regex of paths that never need a changeset
set -euo pipefail

base="origin/${BASE_REF:?BASE_REF is required}"
exempt="${CHANGESET_EXEMPT_REGEX:?CHANGESET_EXEMPT_REGEX is required}"

added=$(git diff --name-only --diff-filter=A "${base}...HEAD" -- '.changeset/*.md' | grep -v '^\.changeset/README\.md$' || true)
if [ -n "$added" ]; then
  echo "Changeset found:"
  echo "$added" | sed 's/^/  /'
  exit 0
fi

needs=$(git diff --name-only "${base}...HEAD" | grep -Ev "$exempt" || true)
if [ -z "$needs" ]; then
  echo "Only documentation, CI or test files changed; no changeset needed."
  exit 0
fi

echo "::error title=Changeset missing::This pull request changes files that ship in a release but adds no changeset."
cat <<'MSG'

Files that need a changeset:
MSG
echo "$needs" | sed 's/^/  /'
cat <<'MSG'

Add one by running the changeset command from the contributing guide, commit the
generated .changeset/*.md file and push. If this change needs no release note,
run the same command with --empty and commit the empty changeset instead.
MSG
exit 1
