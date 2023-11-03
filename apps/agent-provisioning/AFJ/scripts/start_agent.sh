START_TIME=$(date +%s)

AGENCY=$1
EXTERNAL_IP=$2
WALLET_NAME=$3
WALLET_PASSWORD=$4
RANDOM_SEED=$5
WEBHOOK_HOST=$6
WALLET_STORAGE_HOST=$7
WALLET_STORAGE_PORT=$8
WALLET_STORAGE_USER=$9
WALLET_STORAGE_PASSWORD=${10}
CONTAINER_NAME=${11}
PROTOCOL=${12}
TENANT=${13}
AFJ_VERSION=${14}
INDY_LEDGER=${15}

echo "-----$AGENCY-----"
echo "-----$EXTERNAL_IP-----"
echo "-----$WALLET_NAME-----"
echo "-----$WALLET_PASSWORD-----"
echo "-----$RANDOM_SEED-----"
echo "-----$WEBHOOK_HOST-----"
echo "-----$WALLET_STORAGE_HOST-----"
echo "-----$WALLET_STORAGE_PORT-----"
echo "-----$WALLET_STORAGE_USER-----"
echo "-----$WALLET_STORAGE_PASSWORD-----"
echo "-----$CONTAINER_NAME-----"
echo "-----$PROTOCOL-----"
echo "-----$TENANT-----"
echo "-----$AFJ_VERSION-----"
echo "-----$INDY_LEDGER-----"

NETWORK_NAME="credebl-network"
ADMIN_PORT_FILE="$PWD/apps/agent-provisioning/AFJ/port-file/last-admin-port.txt"
INBOUND_PORT_FILE="$PWD/apps/agent-provisioning/AFJ/port-file/last-inbound-port.txt"
ADMIN_PORT=8001
INBOUND_PORT=9001

increment_port() {
    local port="$1"
    local lower_limit="$2"

    while [ "$port" -le "$lower_limit" ]; do
        port=$((port + 1))  # Increment the port using arithmetic expansion
    done

    echo "$port"
}

# Check if admin port file exists and if not, create and initialize it
if [ ! -e "$ADMIN_PORT_FILE" ]; then
    echo "$ADMIN_PORT" > "$ADMIN_PORT_FILE"
fi

# Read the last used admin port number from the file
last_used_admin_port=$(cat "$ADMIN_PORT_FILE")
echo "Last used admin port: $last_used_admin_port"

# Increment the admin port number starting from the last used port
last_used_admin_port=$(increment_port "$last_used_admin_port" "$last_used_admin_port")

# Save the updated admin port number back to the file and update the global variable
echo "$last_used_admin_port" > "$ADMIN_PORT_FILE"
ADMIN_PORT="$last_used_admin_port"

# Check if inbound port file exists and if not, create and initialize it
if [ ! -e "$INBOUND_PORT_FILE" ]; then
    echo "$INBOUND_PORT" > "$INBOUND_PORT_FILE"
fi

# Read the last used inbound port number from the file
last_used_inbound_port=$(cat "$INBOUND_PORT_FILE")
echo "Last used inbound port: $last_used_inbound_port"

# Increment the inbound port number starting from the last used port
last_used_inbound_port=$(increment_port "$last_used_inbound_port" "$last_used_inbound_port")

# Save the updated inbound port number back to the file and update the global variable
echo "$last_used_inbound_port" > "$INBOUND_PORT_FILE"
INBOUND_PORT="$last_used_inbound_port"

echo "Last used admin port: $ADMIN_PORT"
echo "Last used inbound port: $INBOUND_PORT"

echo "AGENT SPIN-UP STARTED"

if [ -d "${PWD}/apps/agent-provisioning/AFJ/endpoints" ]; then
  echo "Endpoints directory exists."
else
  echo "Error: Endpoints directory does not exists."
  mkdir ${PWD}/apps/agent-provisioning/AFJ/endpoints
fi

docker build . -t $AFJ_VERSION -f apps/agent-provisioning/AFJ/afj-controller/Dockerfile

AGENT_ENDPOINT="${PROTOCOL}://${EXTERNAL_IP}:${INBOUND_PORT}"

echo "-----$AGENT_ENDPOINT----"
cat <<EOF >>${PWD}/apps/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json
{
  "label": "${AGENCY}_${CONTAINER_NAME}",
  "walletId": "$WALLET_NAME",
  "walletKey": "$WALLET_PASSWORD",
  "walletType": "postgres",
  "walletUrl": "$WALLET_STORAGE_HOST:$WALLET_STORAGE_PORT",
  "walletAccount": "$WALLET_STORAGE_USER",
  "walletPassword": "$WALLET_STORAGE_PASSWORD",
  "walletAdminAccount": "$WALLET_STORAGE_USER",
  "walletAdminPassword": "$WALLET_STORAGE_PASSWORD",
  "walletScheme": "DatabasePerWallet",
  "indyLedger": $INDY_LEDGER,
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
  "webhookUrl": "$WEBHOOK_HOST/wh/$AGENCY",
  "adminPort": "$ADMIN_PORT",
  "tenancy": $TENANT
}
EOF

FILE_NAME="docker-compose_${AGENCY}_${CONTAINER_NAME}.yaml"
cat <<EOF >>${PWD}/apps/agent-provisioning/AFJ/${FILE_NAME}
version: '3'

services:
  agent:
    image: $AFJ_VERSION

    container_name: agent${AGENCY}_${CONTAINER_NAME}
    restart: always
    environment:
      AFJ_REST_LOG_LEVEL: 1
    ports:
     - ${INBOUND_PORT}:${INBOUND_PORT}
     - ${ADMIN_PORT}:${ADMIN_PORT}
   
    volumes: 
      - ./agent-config/${AGENCY}_${CONTAINER_NAME}.json:/config.json   
      
    command: --auto-accept-connections --config /config.json
      
volumes:
  pgdata:
  agent-indy_client:
  agent-tmp:
EOF

if [ $? -eq 0 ]; then
  cd apps/agent-provisioning/AFJ
  echo "docker-compose generated successfully!"
  echo "================="
  echo "spinning up the container"
  echo "================="
  echo "container-name::::::${CONTAINER_NAME}"
  echo "file-name::::::$FILE_NAME"

  docker-compose -f $FILE_NAME --project-name agent${AGENCY}_${CONTAINER_NAME} up -d
  if [ $? -eq 0 ]; then

    n=0
    until [ "$n" -ge 6 ]; do
      if netstat -tln | grep ${ADMIN_PORT} >/dev/null; then

        AGENTURL="http://${EXTERNAL_IP}:${ADMIN_PORT}/agent"
        agentResponse=$(curl -s -o /dev/null -w "%{http_code}" $AGENTURL)

        if [ "$agentResponse" = "200" ]; then
          echo "Agent is running" && break
        else
          echo "Agent is not running"
          n=$((n + 1))
          sleep 10
        fi
      else
        echo "No response from agent"
        n=$((n + 1))
        sleep 10
      fi
    done

    echo "Creating agent config"
    cat <<EOF >>${PWD}/endpoints/${AGENCY}_${CONTAINER_NAME}.json
    {
        "CONTROLLER_ENDPOINT":"${EXTERNAL_IP}:${ADMIN_PORT}",
        "CONTROLLER_IP" : "${CONTROLLER_IP}",
        "CONTROLLER_PORT" : "${CONTROLLER_PORT}",
        "POSTGRES_ENDPOINT" : "${POSTGRES_IP}:${POSTGRES_PORT}",
        "AGENT_ENDPOINT" : "${INTERNAL_IP}:${ADMIN_PORT}"
    }
EOF
    echo "Agent config created"
  else
    echo "==============="
    echo "ERROR : Failed to spin up the agent!"
    echo "===============" && exit 125
  fi
else
  echo "ERROR : Failed to execute!" && exit 125
fi

echo "Total time elapsed: $(date -ud "@$(($(date +%s) - $START_TIME))" +%T) (HH:MM:SS)"