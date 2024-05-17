#!/bin/bash

START_TIME=$(date +%s)

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."

    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Add the current user to the docker group
    sudo usermod -aG docker $USER

    # Start and enable the Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    echo "Docker has been installed."
else
    echo "Docker is already installed."
fi

# Function to prompt user for input
prompt_input() {
    local prompt_message=$1
    local input_variable=$2
    read -p "$prompt_message" $input_variable
}

prompt_input_with_tenant_validation() {
    local prompt_message=$1
    local input_variable=$2
    local validation_message=$3

    while true; do
        read -p "$prompt_message" $input_variable
        case "${!input_variable}" in
        true | false)
            break
            ;;
        *)
            echo "$validation_message"
            ;;
        esac
    done
}

prompt_input_with_webhook_host_validation() {
    local prompt_message=$1
    local input_variable=$2
    local validation_message=$3INDY_LEDGER_FORMATTED

    while true; do
        read -p "$prompt_message" $input_variable
        local input_value="${!input_variable}"
        local ip_address=$(echo "$input_value" | cut -d ':' -f 1 | sed 's/http:\/\///;s/https:\/\///')
        local port=$(echo "$input_value" | cut -d ':' -f 3)

        if [[ "$input_value" =~ ^http:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$ && "$port" =~ ^[0-9]+$ ]]; then
            break
        elif [[ "$input_value" =~ ^https:\/\/[a-zA-Z0-9.-]+$ ]]; then
            break
        else
            echo "$validation_message"
        fi
    done
}

# Function to validate INDY_LEDGER input against the provided options
validate_indy_ledger() {
    local input_ledger=$1
    case "$input_ledger" in
    1) echo 'No ledger' ;; # Option for "no ledger"
    2) echo 'Polygon' ;;   # Option for "polygon"
    3) echo '{"genesisTransactions":"http://test.bcovrin.vonx.io/genesis","indyNamespace":"bcovrin:testnet"}' ;;
    4) echo '{"genesisTransactions":"https://raw.githubusercontent.com/Indicio-tech/indicio-network/main/genesis_files/pool_transactions_testnet_genesis","indyNamespace":"indicio:testnet"}' ;;
    5) echo '{"genesisTransactions":"https://raw.githubusercontent.com/Indicio-tech/indicio-network/main/genesis_files/pool_transactions_demonet_genesis","indyNamespace":"indicio:demonet"}' ;;
    6) echo '{"genesisTransactions":"https://raw.githubusercontent.com/Indicio-tech/indicio-network/main/genesis_files/pool_transactions_mainnet_genesis","indyNamespace":"indicio:mainnet"}' ;;
    *) echo "Invalid choice" ;;
    esac
}

# Prompt user for input
prompt_input "Enter ORGANIZATION_ID: " ORGANIZATION_ID
prompt_input "Enter WALLET_NAME: " WALLET_NAME
prompt_input "Enter WALLET_PASSWORD: " WALLET_PASSWORD

# Prompt user for RANDOM_SEED input and validate it
while true; do
    prompt_input "Enter RANDOM_SEED: " RANDOM_SEED
    if [ ${#RANDOM_SEED} -eq 32 ]; then
        break
    else
        echo "Error: RANDOM_SEED must be exactly 32 characters."
    fi
done

echo "RANDOM_SEED accepted: $RANDOM_SEED"

# Display options to the user for INDY_LEDGER
echo "Choose INDY_LEDGER option(s) (comma-separated, e.g., 1):"
echo "1) No ledger"
echo "2) Polygon"
echo "3) bcovrin:testnet"
echo "4) indicio:testnet"
echo "5) indicio:demonet"
echo "6) indicio:mainnet"

# Prompt user to choose INDY_LEDGER option(s)
INDY_LEDGER=()
read -r INDY_LEDGER_INPUT

# Split the input by commas and process each choice
IFS=',' read -ra CHOICES <<<"$INDY_LEDGER_INPUT"
for choice in "${CHOICES[@]}"; do
    choice=$(echo "$choice" | tr -d ' ') # Remove any spaces
    case $choice in
    1 | 2 | 3 | 4 | 5 | 6)
        if [ -n "${INDY_LEDGER}" ]; then
            echo "Error: Only one INDY_LEDGER option can be selected."
            exit 1
        fi
        INDY_LEDGER=$(validate_indy_ledger $choice)
        ;;
    *)
        echo "Invalid choice: $choice"
        ;;
    esac
done

# Check if "No ledger" or "Polygon" is selected and set INDY_LEDGER_FORMATTED accordingly
if [ "$INDY_LEDGER" = "No ledger" ] || [ "$INDY_LEDGER" = "Polygon" ]; then
    INDY_LEDGER_FORMATTED="[]"
else
    # Set INDY_LEDGER_FORMATTED based on selected option
    INDY_LEDGER_FORMATTED="[$INDY_LEDGER]"
fi

echo "INDY_LEDGER chosen: $INDY_LEDGER"
echo "Formatted INDY_LEDGER: $INDY_LEDGER_FORMATTED"

# Proceed to prompt for other parameters
prompt_input_with_webhook_host_validation "Enter WEBHOOK_HOST (host/domain): " WEBHOOK_HOST "Error: WEBHOOK_HOST must be in the format http://host:port or https://domain."
prompt_input "Enter WALLET_STORAGE_HOST: " WALLET_STORAGE_HOST
prompt_input "Enter WALLET_STORAGE_PORT: " WALLET_STORAGE_PORT
prompt_input "Enter WALLET_STORAGE_USER: " WALLET_STORAGE_USER
prompt_input "Enter WALLET_STORAGE_PASSWORD: " WALLET_STORAGE_PASSWORD
prompt_input "Enter AGENT_NAME: " AGENT_NAME
prompt_input "Enter PROTOCOL: " PROTOCOL
prompt_input_with_tenant_validation "Enter TENANT (true/false): " TENANT "Error: TENANT must be either 'true' or 'false'."
prompt_input "Enter CREDO_IMAGE: " CREDO_IMAGE
prompt_input "Enter INBOUND_ENDPOINT: " INBOUND_ENDPOINT
prompt_input "Enter ADMIN_PORT: " ADMIN_PORT
prompt_input "Enter INBOUND_PORT: " INBOUND_PORT

# Run the command using user input
on_premises_agent.sh --ORGANIZATION_ID "$ORGANIZATION_ID" --WALLET_NAME "$WALLET_NAME" --WALLET_PASSWORD "$WALLET_PASSWORD" --RANDOM_SEED "$RANDOM_SEED" --WEBHOOK_HOST "$WEBHOOK_HOST" --WALLET_STORAGE_HOST "$WALLET_STORAGE_HOST" --WALLET_STORAGE_PORT "$WALLET_STORAGE_PORT" --WALLET_STORAGE_USER "$WALLET_STORAGE_USER" --WALLET_STORAGE_PASSWORD "$WALLET_STORAGE_PASSWORD" --AGENT_NAME "$AGENT_NAME" --PROTOCOL "$PROTOCOL" --TENANT "$TENANT" --CREDO_IMAGE "$CREDO_IMAGE" --INDY_LEDGER "$INDY_LEDGER" --INBOUND_ENDPOINT "$INBOUND_ENDPOINT" --ADMIN_PORT "$ADMIN_PORT" --INBOUND_PORT "$INBOUND_PORT"

echo "admin port: $ADMIN_PORT"
echo "inbound port: $INBOUND_PORT"

echo "AGENT SPIN-UP STARTED"

if [ -d "${PWD}/agent-config" ]; then
    echo "agent-config directory exists."
else
    echo "Error: agent-config directory does not exists."
    mkdir ${PWD}/agent-config
fi

# Define a regular expression pattern for IP address
IP_REGEX="^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$"

# Check if the input is a domain
if echo "$INBOUND_ENDPOINT" | grep -qP "^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"; then
    echo "INBOUND_ENDPOINT is a domain: $INBOUND_ENDPOINT"
    AGENT_ENDPOINT=$INBOUND_ENDPOINT
else
    # Check if the input is an IP address
    if [[ $INBOUND_ENDPOINT =~ $IP_REGEX ]]; then
        echo "INBOUND_ENDPOINT is an IP address: $INBOUND_ENDPOINT"
        AGENT_ENDPOINT="${PROTOCOL}://${INBOUND_ENDPOINT}:${INBOUND_PORT}"
    else
        echo "Invalid input for INBOUND_ENDPOINT: $INBOUND_ENDPOINT"
    fi
fi

echo "-----$AGENT_ENDPOINT----"
CONFIG_FILE="${PWD}/agent-config/${ORGANIZATION_ID}_${AGENT_NAME}.json"

# Check if the file exists
if [ -f "$CONFIG_FILE" ]; then
    # If it exists, remove the file
    rm "$CONFIG_FILE"
fi

cat <<EOF >${CONFIG_FILE}
{
  "label": "${ORGANIZATION_ID}_${AGENT_NAME}",
  "walletId": "$WALLET_NAME",
  "walletKey": "$WALLET_PASSWORD",
  "walletType": "postgres",
  "walletUrl": "$WALLET_STORAGE_HOST:$WALLET_STORAGE_PORT",
  "walletAccount": "$WALLET_STORAGE_USER",
  "walletPassword": "$WALLET_STORAGE_PASSWORD",
  "walletAdminAccount": "$WALLET_STORAGE_USER",
  "walletAdminPassword": "$WALLET_STORAGE_PASSWORD",
  "walletScheme": "DatabasePerWallet",
  "indyLedger": $INDY_LEDGER_FORMATTED,
  "endpoint": [
    "$AGENT_ENDPOINT"
  ],
  "autoAcceptConnections": true,
  "autoAcceptCredentials": "contentApproved",
  "autoAcceptProofs": "contentApproved",
  "logLevel": 5,
  "inboundTransport": [
    {
      "transport": "$PROTOCOL",
      "port": "$INBOUND_PORT"
    }
  ],
  "outboundTransport": [
    "$PROTOCOL"
  ],
  "webhookUrl": "$WEBHOOK_HOST/wh/$ORGANIZATION_ID",
  "adminPort": "$ADMIN_PORT",
  "tenancy": $TENANT
}
EOF

FILE_NAME="docker-compose_${ORGANIZATION_ID}_${AGENT_NAME}.yaml"

DOCKER_COMPOSE="${PWD}/${FILE_NAME}"

# Check if the file exists
if [ -f "$DOCKER_COMPOSE" ]; then
    # If it exists, remove the file
    rm "$DOCKER_COMPOSE"
fi
cat <<EOF >${DOCKER_COMPOSE}
version: '3'

services:
  agent:
    image: $CREDO_IMAGE

    container_name: ${ORGANIZATION_ID}_${AGENT_NAME}
    restart: always
    environment:
      AFJ_REST_LOG_LEVEL: 1
    ports:
     - ${INBOUND_PORT}:${INBOUND_PORT}
     - ${ADMIN_PORT}:${ADMIN_PORT}
   
    volumes: 
      - ./agent-config/${ORGANIZATION_ID}_${AGENT_NAME}.json:/config.json   
      
    command: --auto-accept-connections --config /config.json
      
volumes:
  pgdata:
  agent-indy_client:
  agent-tmp:
EOF

if [ $? -eq 0 ]; then
    cd ${PWD}
    echo "docker-compose generated successfully!"
    echo "================="
    echo "spinning up the container"
    echo "================="
    echo "container-name::::::${AGENT_NAME}"
    echo "file-name::::::$FILE_NAME"

    docker compose -p "${ORGANIZATION_ID}_${AGENT_NAME}" -f $FILE_NAME up -d
    if [ $? -eq 0 ]; then

        echo "Creating agent config"
        # Capture the logs from the container
        container_id=$(docker ps -q --filter "name=${ORGANIZATION_ID}_${AGENT_NAME}")

        if [ -z "$container_id" ]; then
            echo "Error: No container found with name ${ORGANIZATION_ID}_${AGENT_NAME}"
            exit 1
        fi

        # Wait for the container to generate logs
        retries=5
        delay=10
        while [ $retries -gt 0 ]; do
            container_logs=$(docker logs "$container_id" 2>/dev/null)
            if [ -n "$container_logs" ]; then
                break
            else
                echo "Waiting for logs to be generated..."
                sleep $delay
                retries=$((retries - 1))
            fi
        done

        if [ -z "$container_logs" ]; then
            echo "Error: No logs found for container ${ORGANIZATION_ID}_${AGENT_NAME} after waiting"
            exit 1
        fi

        # Extract the token from the logs using sed
        token=$(echo "$container_logs" | sed -nE 's/.*API Token: ([^ ]+).*/\1/p')

        if [ -z "$token" ]; then
            echo "Error: Failed to extract API token from logs"
            exit 1
        fi

        # Highlight the token line when printing
        highlighted_token="Token: \x1b[1;31m$token\x1b[0m"

        # Print the extracted token with highlighting
        echo -e "$highlighted_token"
        echo "Agent config created"

        # Check if the token exists to determine if the agent is running
        if [ -n "$token" ]; then
            echo "Agent is running"
        else
            echo "Agent is not running"
            exit 1
        fi

    else
        echo "==============="
        echo "ERROR : Failed to spin up the agent!"
        echo "===============" && exit 125
    fi
else
    echo "ERROR : Failed to execute!" && exit 125
fi

echo "Total time elapsed: $(date -ud "@$(($(date +%s) - $START_TIME))" +%T) (HH:MM:SS)"
