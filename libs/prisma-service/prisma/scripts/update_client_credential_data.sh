#!/bin/sh

# Database connection URL
DB_URL=$1
CLIENT_ID=$2
CLIENT_SECRET=$3

# Function to update clientId and clientSecret
update_client_credentials() {
    local update_query="UPDATE \"user\" SET \"clientId\" = '${CLIENT_ID}', \"clientSecret\" = '${CLIENT_SECRET}' WHERE \"clientId\" IS NULL AND \"clientSecret\" IS NULL;"

    echo "Updating clientId and clientSecret where they are NULL..."

    # Execute the update query and capture the output
    local result=$(psql "$DB_URL" -c "$update_query" 2>&1)

    echo "$result"
    # Check if the query was successful
    if [ $? -eq 0 ]; then
        # Check if the output contains "UPDATE 0"
        if echo "$result" | grep -q "UPDATE 0"; then
            echo "There is nothing to update for the clientId and clientSecret."
        else
            echo "Successfully updated clientId and clientSecret."
            echo "Client Id and Client Secret updated successfully."
        fi
    else
        echo "Failed to update clientId and clientSecret."
    fi
}

# Check if CLIENT_ID and CLIENT_SECRET are not empty
if [[ -n "$CLIENT_ID" && -n "$CLIENT_SECRET" ]]; then
    # Update client credentials if both CLIENT_ID and CLIENT_SECRET are provided
    update_client_credentials
else
    echo "CLIENT_ID or CLIENT_SECRET is null. Skipping the update of client credentials."
fi
