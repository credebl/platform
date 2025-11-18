#!/bin/sh

DB_URL=$1
echo "$PWD"

# file paths
COUNTRIES_CSV="${PWD}/prisma/data/geo-location-master-data/countries.csv"
STATES_CSV="${PWD}/prisma/data/geo-location-master-data/states.csv"
CITIES_CSV="${PWD}/prisma/data/geo-location-master-data/cities.csv"

# table names
COUNTRIES_TABLE="countries"
STATES_TABLE="states"
CITIES_TABLE="cities"

# function to import CSV into a table if it's empty
import_csv_if_table_empty() {
    local csv_file=$1
    local table_name=$2
    echo "Checking if $table_name contains data..."

    # Get clean numeric output
    row_count=$(psql "$DB_URL" -At -c "SELECT COUNT(*) FROM $table_name;" 2>/dev/null)

    # Validate row_count is numeric
    if ! echo "$row_count" | grep -qE '^[0-9]+$'; then
        echo "ERROR: Failed to query table $table_name. Is PostgreSQL running?"
        exit 1
    fi
    
    if [ "$row_count" -eq 0 ]; then
        echo "$table_name is empty. Importing $csv_file..."
        # Import CSV
        psql "$DB_URL" -c "\COPY $table_name FROM '$csv_file' CSV HEADER;" >/dev/null
        if [ $? -eq 0 ]; then
            new_count=$(psql "$DB_URL" -At -c "SELECT COUNT(*) FROM $table_name;")
            echo "Successfully imported $csv_file into $table_name. Imported $new_count rows."
        else
            echo "Failed to import $csv_file into $table_name."
            exit 1
        fi
    else
        echo "$table_name contains $row_count rows. Skipping import."
    fi
}
import_csv_if_table_empty "$COUNTRIES_CSV" "$COUNTRIES_TABLE"
import_csv_if_table_empty "$STATES_CSV" "$STATES_TABLE"
import_csv_if_table_empty "$CITIES_CSV" "$CITIES_TABLE"

echo "CSV import process completed."