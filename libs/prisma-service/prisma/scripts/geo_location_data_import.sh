#!/bin/sh

# Database connection details
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

    # Check if the table contains data
    row_count=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM $table_name;")

    if [ $row_count -eq 0 ]; then
        echo "$table_name is empty. Importing $csv_file..."

        # Import CSV and capture the affected row count
        affected_rows=$(psql $DB_URL -c "\COPY $table_name FROM '$csv_file' CSV HEADER;" -c "SELECT COUNT(*) FROM $table_name;")
        
        if [ $? -eq 0 ]; then
            echo "Successfully imported $csv_file into $table_name."
            echo "Number of rows imported: $affected_rows"
        else
            echo "Failed to import $csv_file into $table_name."
            exit 1
        fi
    else
        echo "$table_name contains data. Skipping import."
    fi
}

# Import the CSVs in sequence if the tables are empty
import_csv_if_table_empty $COUNTRIES_CSV $COUNTRIES_TABLE
import_csv_if_table_empty $STATES_CSV $STATES_TABLE
import_csv_if_table_empty $CITIES_CSV $CITIES_TABLE

echo "CSV import process completed."