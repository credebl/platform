#!/bin/bash

START_TIME=$(date +%s)

AGENCY=$1
EXTERNAL_IP=$2
GENESIS_URL=$3
API_KEY=$4
WALLET_NAME=$5
WALLET_PASSWORD=$6
RANDOM_SEED=$7
WEBHOOK_HOST=$8
WALLET_STORAGE_HOST=$9
WALLET_STORAGE_PORT=${10}
WALLET_STORAGE_USER=${11}
WALLET_STORAGE_PASSWORD=${12}
TAILS_FILE_SERVER=${13}
CONTAINER_NAME=${14}
ACA_PY_IMAGE=${15}
PROTOCOL=${16}
JWT_SECRET=${17}
TENANT=${18}
WALLET_TYPE=${19}
WALLET_STORAGE_TYPE=${20}

ADMIN_PORT_FILE="$PWD/apps/agent-provisioning/ACA-PY/port-file/last-admin-port.txt"
INBOUND_PORT_FILE="$PWD/apps/agent-provisioning/ACA-PY/port-file/last-inbound-port.txt"
ADMIN_PORT=6002
INBOUND_PORT=7002

WALLET_STORAGE_CONFIG=\''{\"url\": \"'${WALLET_STORAGE_HOST}:${WALLET_STORAGE_PORT}'\"}'\'
WALLET_STORAGE_CREDS=\''{\"account\": \"'${WALLET_STORAGE_USER}'\",\"password\" : \"'${WALLET_STORAGE_PASSWORD}'\",\"admin_account\" : \"'${WALLET_STORAGE_USER}'\" , \"admin_password\" : \"'${WALLET_STORAGE_PASSWORD}'\" }'\'

increment_port() {
    local port="$1"
    local lower_limit="$2"

    while [ "$port" -le "$lower_limit" ]; do
        port=$((port + 1)) # Increment the port using arithmetic expansion
    done

    echo "$port"
}

# Check if admin port file exists and if not, create and initialize it
if [ ! -e "$ADMIN_PORT_FILE" ]; then
    echo "$ADMIN_PORT" >"$ADMIN_PORT_FILE"
fi

# Read the last used admin port number from the file
last_used_admin_port=$(cat "$ADMIN_PORT_FILE")
echo "Last used admin port: $last_used_admin_port"

# Increment the admin port number starting from the last used port
last_used_admin_port=$(increment_port "$last_used_admin_port" "$last_used_admin_port")

# Save the updated admin port number back to the file and update the global variable
echo "$last_used_admin_port" >"$ADMIN_PORT_FILE"
ADMIN_PORT="$last_used_admin_port"

# Check if inbound port file exists and if not, create and initialize it
if [ ! -e "$INBOUND_PORT_FILE" ]; then
    echo "$INBOUND_PORT" >"$INBOUND_PORT_FILE"
fi

# Read the last used inbound port number from the file
last_used_inbound_port=$(cat "$INBOUND_PORT_FILE")
echo "Last used inbound port: $last_used_inbound_port"

# Increment the inbound port number starting from the last used port
last_used_inbound_port=$(increment_port "$last_used_inbound_port" "$last_used_inbound_port")

# Save the updated inbound port number back to the file and update the global variable
echo "$last_used_inbound_port" >"$INBOUND_PORT_FILE"
INBOUND_PORT="$last_used_inbound_port"

echo "Last used admin port: $ADMIN_PORT"
echo "Last used inbound port: $INBOUND_PORT"

if [ -d "${PWD}/agent-spinup/logs" ]; then
    echo "Logs directory exists."
else
    echo "Error: Logs directory does not exists."
    mkdir ${PWD}/agent-spinup/logs
fi

if [ -d "${PWD}/agent-spinup/endpoints" ]; then
    echo "Endpoints directory exists."
else
    echo "Error: Endpoints directory does not exists."
    mkdir ${PWD}/agent-spinup/endpoints
fi

endpoint="${PROTOCOL}://${EXTERNAL_IP}:${INBOUND_PORT}"

acapyParams="start --seed $RANDOM_SEED --endpoint ${endpoint} --inbound-transport http 0.0.0.0 $INBOUND_PORT --outbound-transport http --log-level DEBUG --admin 0.0.0.0 $ADMIN_PORT --label ${CONTAINER_NAME} --wallet-storage-config ${WALLET_STORAGE_CONFIG} --wallet-storage-creds ${WALLET_STORAGE_CREDS} --webhook-url ${WEBHOOK_HOST}/wh/${AGENCY} --auto-accept-invites --auto-accept-requests --auto-respond-messages --auto-respond-credential-proposal --auto-respond-credential-offer --auto-respond-credential-request --auto-respond-presentation-proposal --auto-respond-presentation-request --auto-store-credential --auto-ping-connection --auto-provision --preserve-exchange-records --wallet-allow-insecure-seed"

if [ "$TAILS_FILE_SERVER" = false ]; then
    echo "TAILS_FILE_SERVER not found!"
else
    acapyParams="${acapyParams} --tails-server-base-url ${TAILS_FILE_SERVER} "
fi

if [ "$TENANT" = false ]; then
    echo "TENANT not found!"
else
    if [ "$JWT_SECRET" = false ]; then
        echo "Jwt secret not found!!"
        exit 125
    else
        acapyParams="${acapyParams} '--multitenant' '--multitenant-admin' --jwt-secret ${JWT_SECRET}"
    fi
fi

if [ "$API_KEY" = false ]; then
    echo "insecure mode!" | tee -a ${PWD}/logs/${CONTAINER_NAME}.log
    acapyParams="${acapyParams} '--admin-insecure-mode' "
else
    echo "API Key found!"
    acapyParams="${acapyParams} '--admin-api-key' '${API_KEY}'"
fi

if [ "$GENESIS_URL" = "ALL" ]; then
    acapyParams="${acapyParams} --genesis-transactions-list /multi_ledger_config.yml"
elif [ "$GENESIS_URL" = "NA" ]; then
    acapyParams="${acapyParams} --no-ledger"
else
    acapyParams="${acapyParams} --genesis-url '${GENESIS_URL}'"
fi

if [ "$WALLET_NAME" = false ]; then
    echo "Wallet not found!!" | tee -a ${PWD}/logs/${CONTAINER_NAME}.log
    exit 125
else
    acapyParams="${acapyParams} '--wallet-name' '${WALLET_NAME}'"
    if [ "$WALLET_PASSWORD" = false ]; then
        echo "Wallet password not found!!"
        exit 125
    else
        acapyParams="${acapyParams} '--wallet-key' '${WALLET_PASSWORD}'"
    fi
fi

if [ "$WALLET_TYPE" = false ]; then
    echo "Wallet type not found!!" | tee -a ${PWD}/logs/${CONTAINER_NAME}.log
    exit 125
else
    acapyParams="${acapyParams} '--wallet-type' '${WALLET_TYPE}'"
fi

if [ "$WALLET_STORAGE_TYPE" = false ]; then
    echo "Wallet storage type not found!!" | tee -a ${PWD}/logs/${CONTAINER_NAME}.log
    exit 125
else
    acapyParams="${acapyParams} '--wallet-storage-type' '${WALLET_STORAGE_TYPE}'"
fi

#-------------WRITE DOCKER FILE---------------------
FILE_NAME="docker-compose_${AGENCY}_${CONTAINER_NAME}.yaml"
DOCKER_COMPOSE="${PWD}/apps/agent-provisioning/ACA-PY/${FILE_NAME}"

# Check if the file exists
if [ -f "$DOCKER_COMPOSE" ]; then
    # If it exists, remove the file
    rm "$DOCKER_COMPOSE"
fi
cat <<EOF >${DOCKER_COMPOSE}
version: '3'

services:
  agent:
    image: $ACA_PY_IMAGE

    command: "${acapyParams}"
    container_name: ${AGENCY}_${CONTAINER_NAME}
    ports:
     - ${INBOUND_PORT}:${INBOUND_PORT}
     - ${ADMIN_PORT}:${ADMIN_PORT}
    volumes: 
      - ./genesis-transaction-list/multi_ledger_config.yml:/multi_ledger_config.yml 
volumes:
  pgdata:
  agent-indy_client:
  agent-tmp:
EOF

if [ $? -eq 0 ]; then
    cd apps/agent-provisioning/ACA-PY
    echo "docker-compose generated successfully!"
    echo "*****************"
    echo "spinning up the container"
    echo "*****************"
    echo "container-name::::::${CONTAINER_NAME}"
    echo "file-name::::::$FILE_NAME"
    echo "agency::::::${AGENCY}"

    # Convert to lowercase and replace hyphens with underscores
    PROJECT_NAME=$(echo "${AGENCY}_${CONTAINER_NAME}" | tr '[:upper:]' '[:lower:]' | tr '-' '_')

    docker rm -f "${PROJECT_NAME}" || true

    docker compose -f $FILE_NAME --project-name "${PROJECT_NAME}" up -d
    if [ $? -eq 0 ]; then

        n=0
        until [ "$n" -ge 6 ]; do
            if netstat -tln | grep ${ADMIN_PORT} >/dev/null; then
                AGENTURL="http://${EXTERNAL_IP}:${ADMIN_PORT}/status"

                # Check if API_KEY is provided
                if [ -n "$API_KEY" ]; then
                    # API key exists, include it in the header
                    agentResponse=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-KEY: $API_KEY" $AGENTURL)
                else
                    # No API key, make the request without the header
                    agentResponse=$(curl -s -o /dev/null -w "%{http_code}" $AGENTURL)
                fi

                if [ "$agentResponse" = "200" ]; then
                    echo "running" && break
                else
                    echo "agent not running"
                    n=$((n + 1))
                    sleep 10
                fi
            else
                echo "no response from agent"
                n=$((n + 1))
                sleep 10
            fi

        done

        echo "database details | agent details"

        ENDPOINT="${PWD}/endpoints/${AGENCY}_${CONTAINER_NAME}.json"
        # Check if the file exists
        if [ -f "$ENDPOINT" ]; then
            # If it exists, remove the file
            rm "$ENDPOINT"
        fi
        cat <<EOF >${ENDPOINT}
    {
        "CONTROLLER_ENDPOINT":"${EXTERNAL_IP}:${ADMIN_PORT}"
    }
EOF
    else
        echo "=====!!!!!!!!====="
        echo "ERROR : Failed to spin up the agent!"
        echo "=====!!!!!!!!=====" && exit 125
    fi
else
    echo "ERROR : Failed to execute!" && exit 125
fi

echo "Total time elapsed: $(date -ud "@$(($(date +%s) - $START_TIME))" +%T) (HH:MM:SS)"
