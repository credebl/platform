#!/bin/sh

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
INBOUND_ENDPOINT=${16}
SCHEMA_FILE_SERVER_URL=${17}
AGENT_HOST=${18}
AWS_ACCOUNT_ID=${19}
S3_BUCKET_ARN=${20}
CLUSTER_NAME=${21}
TESKDEFINITION_FAMILY=${22}

DESIRED_COUNT=1

generate_random_string() {
  echo "$(date +%s%N | sha256sum | base64 | head -c 12)"
}

# Call the function to generate a random string
random_string=$(generate_random_string)

# Print the generated random string
echo "Random String: $random_string"

SERVICE_NAME="${CONTAINER_NAME}-service-test"
EXTERNAL_IP=$(echo "$2" | tr -d '[:space:]')
ADMIN_PORT_FILE="$PWD/agent-provisioning/AFJ/port-file/last-admin-port.txt"
INBOUND_PORT_FILE="$PWD/agent-provisioning/AFJ/port-file/last-inbound-port.txt"
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

# Define a regular expression pattern for IP address
IP_REGEX="^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$"

# Check if INBOUND_ENDPOINT is a domain or IP address
if [[ $INBOUND_ENDPOINT =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  echo "INBOUND_ENDPOINT is a domain: $INBOUND_ENDPOINT"
  # Extracting the domain name without the protocol
  AGENT_ENDPOINT=$(echo "$INBOUND_ENDPOINT" | sed 's/^https\?:\/\///')
else
  # Check if the input is an IP address
  if [[ $INBOUND_ENDPOINT =~ $IP_REGEX ]]; then
    echo "INBOUND_ENDPOINT is an IP address: $INBOUND_ENDPOINT"
    # Adding the protocol to the IP address
    AGENT_ENDPOINT="${PROTOCOL}://${INBOUND_ENDPOINT}:${INBOUND_PORT}"
  else
    echo "Invalid input for INBOUND_ENDPOINT: $INBOUND_ENDPOINT"
  fi
fi

cat <<EOF >/app/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json
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
  "logLevel": 2,
  "inboundTransport": [
    {
      "transport": "$PROTOCOL",
      "port": $INBOUND_PORT
    }
  ],
  "outboundTransport": [
    "$PROTOCOL"
  ],
  "webhookUrl": "$WEBHOOK_HOST/wh/$AGENCY",
  "adminPort": $ADMIN_PORT,
  "tenancy": $TENANT,
  "schemaFileServerURL": "$SCHEMA_FILE_SERVER_URL"
}
EOF
# scp ${PWD}/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json ${AGENT_HOST}:/home/ec2-user/config/

# Construct the container definitions dynamically
CONTAINER_DEFINITIONS=$(
  cat <<EOF
[
  {
    "name": "$CONTAINER_NAME",
    "image": "${AFJ_VERSION}",
    "cpu": 154,
    "memory": 307,
    "portMappings": [
      {
        "containerPort": $ADMIN_PORT,
        "hostPort": $ADMIN_PORT,
        "protocol": "tcp"
      },
      {
        "containerPort": $INBOUND_PORT,
        "hostPort": $INBOUND_PORT,
        "protocol": "tcp"
      }
    ],
    "essential": true,
    "command": [
                "--auto-accept-connections",
                "--config",
                "/config.json"
            ],
    "environment": [
      {
        "name": "AFJ_REST_LOG_LEVEL",
        "value": "1"
      }
    ],
    "environmentFiles": [
      {
        "value": "${S3_BUCKET_ARN}",
        "type": "s3"
      }
    ],
    "mountPoints": [
                {
                    "sourceVolume": "config",
                    "containerPath": "/config.json",
                    "readOnly": true
                }
            ],
    "volumesFrom": [],
    "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$TESKDEFINITION_FAMILY",
          "awslogs-create-group": "true",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
          }
        },
    "ulimits": []
  }
]
EOF
)

# Construct the task definition JSON dynamically
TASK_DEFINITION=$(
  cat <<EOF
{
  "family": "$TESKDEFINITION_FAMILY",
  "containerDefinitions": $CONTAINER_DEFINITIONS,
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "volumes": [
        {
            "name": "config",
            "host": {
                "sourcePath": "/home/ec2-user/config/${AGENCY}_${CONTAINER_NAME}.json"
            }
        }
    ],
  "networkMode": "host",
  "requiresCompatibilities": [
    "EC2"
  ],
  "cpu": "154",
  "memory": "307"
}
EOF
)

# Save the task definition JSON to a file
echo "$TASK_DEFINITION" >task_definition.json

# Register the task definition and retrieve the ARN
TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://task_definition.json --query 'taskDefinition.taskDefinitionArn' --output text)
echo "Task Definition ARN: $TASK_DEFINITION_ARN"

# Create the service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_DEFINITION_ARN \
  --desired-count $DESIRED_COUNT \
  --launch-type EC2 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

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
# Describe the ECS service and filter by service name
service_description=$(aws ecs describe-services --service $SERVICE_NAME --cluster $CLUSTER_NAME --region $AWS_PUBLIC_REGION)
echo "service_description=$service_description"


# Extract Task ID from the service description events
task_id=$(echo "$service_description" | jq -r '.services[0].events[] | select(.message | test("has started 1 tasks")) | .message | capture("\\(task (?<id>[^)]+)\\)") | .id')
#echo "task_id=$task_id"

# to fetch log group of container 
.............................................................
log_group=/ecs/$TESKDEFINITION_FAMILY
echo "log_group=$log_group"

# Get Log Stream Name
log_stream=ecs/$CONTAINER_NAME/$task_id

echo "logstrem=$log_stream"


# Fetch logs
#echo "$(aws logs get-log-events --log-group-name "/ecs/$TESKDEFINITION_FAMILY/$CONTAINER_NAME" --log-stream-name "$log_stream" --region $AWS_PUBLIC_REGION)"

# Check if the token folder exists, and create it if it doesn't
token_folder="$PWD/agent-provisioning/AFJ/token"
if [ ! -d "$token_folder" ]; then
    mkdir -p "$token_folder"
fi

# Set maximum retry attempts
RETRIES=3

# Loop to attempt retrieving token from logs
# Loop to attempt retrieving token from logs
for attempt in $(seq 1 $RETRIES); do
    echo "Attempt $attempt: Checking service logs for token..."
    
    # Fetch logs and grep for API token
    token=$(aws logs get-log-events \
    --log-group-name "$log_group" \
    --log-stream-name "$log_stream" \
    --region ap-southeast-1 \
    | grep -o '*** API Key: [^ ]*' \
    | cut -d ' ' -f 3
)
   # echo "token=$token"
    if [ -n "$token" ]; then
        echo "Token found: $token"
        # Write token to a file
        echo "{\"token\": \"$token\"}" > "$PWD/agent-provisioning/AFJ/token/${AGENCY}_${CONTAINER_NAME}.json"
        break  # Exit loop if token is found
    else
        echo "Token not found in logs. Retrying..."
        if [ $attempt -eq $RETRIES ]; then
            echo "Reached maximum retry attempts. Token not found."
        fi
    fi
    # Add a delay of 10 seconds between retries
    sleep 10
done


  echo "Creating agent config"
  cat <<EOF >${PWD}/agent-provisioning/AFJ/endpoints/${AGENCY}_${CONTAINER_NAME}.json
    {
        "CONTROLLER_ENDPOINT":"${EXTERNAL_IP}:${ADMIN_PORT}",
        "AGENT_ENDPOINT" : "${INTERNAL_IP}:${ADMIN_PORT}"
    }
EOF

  cat <<EOF >${PWD}/agent-provisioning/AFJ/token/${AGENCY}_${CONTAINER_NAME}.json
    {
        "token" : "$token"
    }
EOF

  echo "Agent config created"
else
  echo "==============="
  echo "ERROR : Failed to spin up the agent!"
  echo "===============" && exit 125
fi
echo "Total time elapsed: $(date -ud "@$(($(date +%s) - $START_TIME))" +%T) (HH:MM:SS)"