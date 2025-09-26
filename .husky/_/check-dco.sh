    # #!/bin/sh

    # # Get the range of commits being pushed
    # while read local_ref local_sha remote_ref remote_sha
    # do
    #   if [ -z "$local_sha" ]; then
    #     # Branch deleted
    #     continue
    #   fi

    #   if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
    #     # Branch created
    #     continue
    #   fi

    #   # Check each commit in the range
    #   git log --pretty=format:"%H" "$remote_sha".."$local_sha" | while read commit_sha
    #   do
    #     if ! git cat-file commit "$commit_sha" | grep -q "^Signed-off-by: "; then
    #       echo "Error: Commit $commit_sha does not have a DCO sign-off."
    #       echo "Please add 'Signed-off-by: Name <email@example.com>' to your commit message."
    #       exit 1
    #     fi
    #   done
    # done

    # exit 0