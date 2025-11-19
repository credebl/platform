#!/bin/sh

START_TIME=$(date +%s)

AGENCY=$1
EXTERNAL_IP=$2
WALLET_NAME=$3
WALLET_PASSWORD=$4
RANDOM_SEED=$5a
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
AWS_ACCOUNT_ID=${17}
S3_BUCKET_ARN=${18}
CLUSTER_NAME=${19}
FILESYSTEMID=${20}
ACCESSPOINTID=${21}
VPC_ID=${22}
ECS_SUBNET_ID=${23}
ALB_SUBNET_ID_ONE=${24}
ALB_SUBNET_ID_TWO=${25}
EFS_SECURITY_GROUP_ID=${26}
AWS_PUBLIC_REGION=${27}
STAGE=${28}
AGENT_WEBSOCKET_PROTOCOL=${29}
DB_SECURITY_GROUP_ID=${30}
TESKDEFINITION_FAMILY="${STAGE_}_${CONTAINER_NAME}_TASKDEFIITION"


echo "START_TIME: $START_TIME"
echo "AGENCY: $AGENCY"
echo "EXTERNAL_IP: $EXTERNAL_IP"
echo "WALLET_NAME: $WALLET_NAME"
echo "WALLET_PASSWORD: $WALLET_PASSWORD"
echo "RANDOM_SEED: $RANDOM_SEED"
echo "WEBHOOK_HOST: $WEBHOOK_HOST"
echo "WALLET_STORAGE_HOST: $WALLET_STORAGE_HOST"
echo "WALLET_STORAGE_PORT: $WALLET_STORAGE_PORT"
echo "WALLET_STORAGE_USER: $WALLET_STORAGE_USER"
echo "WALLET_STORAGE_PASSWORD: $WALLET_STORAGE_PASSWORD"
echo "CONTAINER_NAME: $CONTAINER_NAME"
echo "PROTOCOL: $PROTOCOL"
echo "TENANT: $TENANT"
echo "AFJ_VERSION: $AFJ_VERSION"
echo "INDY_LEDGER: $INDY_LEDGER"
echo "INBOUND_ENDPOINT: $INBOUND_ENDPOINT"
echo "AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo "S3_BUCKET_ARN: $S3_BUCKET_ARN"
echo "CLUSTER_NAME: $CLUSTER_NAME"
echo "TESKDEFINITION_FAMILY: $TESKDEFINITION_FAMILY"
echo "FILESYSTEMID: $FILESYSTEMID"
echo "ACCESSPOINTID: $ACCESSPOINTID"
echo "VPC_ID: $VPC_ID"
echo "ECS_SUBNET_ID: $ECS_SUBNET_ID"
echo "ALB_SUBNET_ID_ONE: $ALB_SUBNET_ID_ONE"
echo "ALB_SUBNET_ID_TWO: $ALB_SUBNET_ID_TWO"
echo "SSL_CRTS: $SSL_CRTS"
echo "EFS_SECURITY_GROUP_ID: $EFS_SECURITY_GROUP_ID"
echo "AGENT_URL: $AGENT_URL"
echo "AWS_PUBLIC_REGION: $AWS_PUBLIC_REGION"
echo "STAGE: $STAGE"
echo "AGENT_WEBSOCKET_PROTOCOL: $AGENT_WEBSOCKET_PROTOCOL"
echo "ALB_SECURITY_GROUP_ID: $ALB_SECURITY_GROUP_ID"
echo "ADMIN_TG_ARN: $ADMIN_TG_ARN"
echo "INBOUND_TG_ARN: $INBOUND_TG_ARN"
echo "AGENT_INBOUND_URL: $AGENT_INBOUND_URL"
echo "DB_SECURITY_GROUP_ID: $DB_SECURITY_GROUP_ID"


DESIRED_COUNT=1

generate_random_string() {
  echo "$(date +%s%N | sha256sum | base64 | head -c 3)"
}

# Call the function to generate a random string
random_string=$(generate_random_string)

# Print the generated random string
echo "Random String: $random_string"

SERVICE_NAME="${AGENCY}-${CONTAINER_NAME}-service-${random_string}"
EXTERNAL_IP=$(echo "$2" | tr -d '[:space:]')
ADMIN_PORT_FILE="$PWD/agent-provisioning/AFJ/port-file/last-admin-port.txt"
INBOUND_PORT_FILE="$PWD/agent-provisioning/AFJ/port-file/last-inbound-port.txt"
echo "AGENCY: $SERVICE_NAME"
echo "EXTERNAL_IP: $EXTERNAL_IP"
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


#CLUSTER_NAME=$(aws ecs create-cluster --cluster-name ${CONTAINER_NAME})

# Create security groups
ALB_SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name "${STAGE}-${AGENCY}-${random_string}-alb-sg" --description "Security group for ALB" --vpc-id $VPC_ID --output text)
ECS_SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name "${STAGE}-${AGENCY}-${random_string}-ecs-sg" --description "Security group for ECS Fargate service" --vpc-id $VPC_ID --output text)

echo "ALB_SECURITY_GROUP_ID:$ALB_SECURITY_GROUP_ID"
echo "ECS_SECURITY_GROUP_ID:$ECS_SECURITY_GROUP_ID"
echo "EFS_SECURITY_GROUP_ID:$SECURITY_GROUP_ID"

# Allow inbound traffic from the ECS Fargate security group to the EFS security group on NFS port
aws ec2 authorize-security-group-ingress \
    --group-id "$EFS_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 2049 \
    --source-group "$ECS_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-allow},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION
    
# Authorize inbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-ingress \
    --group-id "$ECS_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$ADMIN_PORT" \
    --source-group "$ALB_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-alb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION


# Authorize outbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-egress \
    --group-id "$ECS_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$ADMIN_PORT" \
    --source-group "$ALB_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-alb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION


# Authorize inbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-ingress \
    --group-id "$ECS_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$INBOUND_PORT" \
    --source-group "$ALB_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-alb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION

# Authorize outbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-egress \
    --group-id "$ECS_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$INBOUND_PORT" \
    --source-group "$ALB_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-alb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION

# Authorize inbound traffic for ECS security group from DB security group
aws ec2 authorize-security-group-ingress \
    --group-id "$DB_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$WALLET_STORAGE_PORT" \
    --source-group "$ECS_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-ecs-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION

# Authorize outbound traffic for ECS security group from DB security group
aws ec2 authorize-security-group-egress \
    --group-id "$DB_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$WALLET_STORAGE_PORT" \
    --source-group "$ECS_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-ecs-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION

# Authorize inbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-ingress \
    --group-id "$ALB_SECURITY_GROUP_ID" \
    --ip-permissions IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0,Description="Allowing 0.0.0.0/0 to the LB port"}]' \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=allow-the-world}]" \
    --region $AWS_PUBLIC_REGION

# Authorize outbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-egress \
    --group-id "$ALB_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$ADMIN_PORT" \
    --source-group "$ECS_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-adminalb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION

# Authorize inbound traffic for ALB security group from ECS security group
aws ec2 authorize-security-group-ingress \
    --group-id "$ALB_SECURITY_GROUP_ID" \
    --ip-permissions IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0,Description="Allowing 0.0.0.0/0 to the LB port"}]' \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=allow-the-world}]" \
    --region $AWS_PUBLIC_REGION

# Authorize outbound traffic of ALB security group for ECS security group
aws ec2 authorize-security-group-egress \
    --group-id "$ALB_SECURITY_GROUP_ID" \
    --protocol tcp \
    --port "$INBOUND_PORT" \
    --source-group "$ECS_SECURITY_GROUP_ID" \
    --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=${STAGE}-${AGENCY}-${CONTAINER_NAME}-inboundalb-sg},{Key=ENV,Value=test}]" \
    --region $AWS_PUBLIC_REGION


# Create Target Groups for admin port
ADMIN_TG_ARN=$(aws elbv2 create-target-group \
  --name "${STAGE}-${ADMIN_PORT}-tg" \
  --protocol HTTP \
  --port 80 \
  --target-type ip \
  --vpc-id $VPC_ID \
  --health-check-protocol HTTP \
  --health-check-port $ADMIN_PORT \
  --health-check-path /agent \
  --health-check-interval-seconds 120 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)


echo "admin-tg-arm: $ADMIN_TG_ARN"

# Create Target Groups for inbound port
INBOUND_TG_ARN=$(aws elbv2 create-target-group --name "${STAGE}-${INBOUND_PORT}-tg" --protocol HTTP --port 80 --target-type ip --vpc-id $VPC_ID --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "admin-tg-arm: $INBOUND_TG_ARN"


# Create Application Load Balancer
ADMIN_ALB_ARN=$(aws elbv2 create-load-balancer \
--name $STAGE-$CONTAINER_NAME-${ADMIN_PORT}-alb \
--subnets $ALB_SUBNET_ID_ONE $ALB_SUBNET_ID_TWO \
--tags "[{\"Key\":\"Name\", \"Value\":\"${CONTAINER_NAME}-alb\"}]" \
--type application \
--scheme internet-facing \
--security-groups $ALB_SECURITY_GROUP_ID \
--region $AWS_PUBLIC_REGION \
--query "LoadBalancers[0].LoadBalancerArn" \
--output text)

# Describe the ALB to retrieve its DNS name
ADMIN_ALB_DNS=$(aws elbv2 describe-load-balancers \
--load-balancer-arns $ADMIN_ALB_ARN \
--query "LoadBalancers[0].DNSName" \
--output text)

echo "ALB DNS: $ADMIN_ALB_DNS"

# Create HTTP listener
aws elbv2 create-listener \
    --load-balancer-arn "$ADMIN_ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn="$ADMIN_TG_ARN" \
    --region "$AWS_PUBLIC_REGION"



# Create Application Load Balancer
INBOUND_ALB_ARN=$(aws elbv2 create-load-balancer \
--name $STAGE-$CONTAINER_NAME-${INBOUND_PORT}-alb \
--subnets $ALB_SUBNET_ID_ONE $ALB_SUBNET_ID_TWO \
--tags "[{\"Key\":\"Name\", \"Value\":\"${CONTAINER_NAME}-alb\"}]" \
--type application \
--scheme internet-facing \
--security-groups $ALB_SECURITY_GROUP_ID \
--region $AWS_PUBLIC_REGION \
--query "LoadBalancers[0].LoadBalancerArn" \
--output text)

# Describe the ALB to retrieve its DNS name
INBOUND_ALB_DNS=$(aws elbv2 describe-load-balancers \
--load-balancer-arns $INBOUND_ALB_ARN \
--query "LoadBalancers[0].DNSName" \
--output text)

echo "INBOUND_ALB DNS: $INBOUND_ALB_DNS"

#add listner to inbound
aws elbv2 create-listener \
    --load-balancer-arn $INBOUND_ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$INBOUND_TG_ARN \
    --region $AWS_PUBLIC_REGION 


# modify health check of inboud tg    
aws elbv2 modify-target-group \
    --target-group-arn $INBOUND_TG_ARN \
    --health-check-protocol HTTP \
    --health-check-port "traffic-port" \
    --health-check-path "/" \
    --health-check-interval-seconds 30 \
    --healthy-threshold-count 3 \
    --unhealthy-threshold-count 3 \
    --matcher "HttpCode=404" \
    --region $AWS_PUBLIC_REGION


# Generate the agent config JSON
cat <<EOF >$PWD/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json
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
    "http://$INBOUND_ALB_DNS"
  ],
  "autoAcceptConnections": true,
  "autoAcceptCredentials": "contentApproved",
  "autoAcceptProofs": "contentApproved",
  "logLevel": 5,
  "inboundTransport": [
    {
      "transport": "$AGENT_WEBSOCKET_PROTOCOL",
      "port": "$INBOUND_PORT"
    }
  ],
  "outboundTransport": [
    "$AGENT_WEBSOCKET_PROTOCOL"
  ],
  "webhookUrl": "$WEBHOOK_HOST/wh/$AGENCY",
  "adminPort": $ADMIN_PORT,
  "tenancy": $TENANT
}
EOF

# Define the container definitions JSON
CONTAINER_DEFINITIONS=$(
  cat <<EOF
[
  {
    "name": "$CONTAINER_NAME",
    "image": "${AFJ_IMAGE_URL}",
    "cpu": 256,
    "memory": 512,
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
                "/config/${AGENCY}_${CONTAINER_NAME}.json"
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
                    "sourceVolume": "AGENT-CONFIG",
                    "containerPath": "/config",
                    "readOnly": true
                }
                
            ],
    "volumesFrom": [],
    "ulimits": [],
    "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-create-group": "true",
                    "awslogs-group": "/ecs/$TESKDEFINITION_FAMILY/$CONTAINER_NAME",
                    "awslogs-region": "$AWS_PUBLIC_REGION",
                    "awslogs-stream-prefix": "ecs"
                },
                "secretOptions": []
            }
  }
]
EOF
)

# Define the task definition JSON
TASK_DEFINITION=$(cat <<EOF
{
  "family": "$TESKDEFINITION_FAMILY",
  "containerDefinitions": $CONTAINER_DEFINITIONS,
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "volumes": [
        {
            "name": "AGENT-CONFIG",
            "efsVolumeConfiguration": {
                "fileSystemId": "$FILESYSTEMID",
                "rootDirectory": "/",
                "transitEncryption": "ENABLED",
                "authorizationConfig": {
                    "accessPointId": "$ACCESSPOINTID",
                    "iam": "DISABLED"
                }
            }
        }
    ],
  "networkMode": "awsvpc",
  "requiresCompatibilities": [
    "EC2",
    "FARGATE"
  ],
  "cpu": "1024",
  "memory": "2048"
}
EOF
)

# Save the task definition JSON to a file
echo "$TASK_DEFINITION" > task_definition.json

# Register the task definition and retrieve the ARN
TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://task_definition.json --query 'taskDefinition.taskDefinitionArn' --output text)


SERVICE=$(cat <<EOF
{
    "cluster": "$CLUSTER_NAME",
    "serviceName": "$SERVICE_NAME",
    "taskDefinition": "$TASK_DEFINITION_ARN",
    "launchType": "FARGATE",
    "platformVersion": "LATEST",
    "networkConfiguration": {
       "awsvpcConfiguration": {
          "assignPublicIp": "DISABLED",
          "securityGroups": [ "$ECS_SECURITY_GROUP_ID" ],
          "subnets": [ "$ECS_SUBNET_ID" ]
       }
    },
    "loadBalancers": [
      {
         "targetGroupArn": "$ADMIN_TG_ARN",
         "containerName": "$CONTAINER_NAME",
         "containerPort": $ADMIN_PORT
      },
      {  
      "targetGroupArn":"$INBOUND_TG_ARN",
      "containerName":"$CONTAINER_NAME",
      "containerPort":$INBOUND_PORT
   }
    ],
    "desiredCount": 1,
    "healthCheckGracePeriodSeconds": 300,
    "tags": [
        {
          "key": "Name",
          "value": "$CONTAINER_NAME"
        }
    ]
}

EOF
)

# Save the service JSON to a file
echo "$SERVICE" > service.json

# Check if the service file was created successfully
if [ -f "$SERVICE_FILE" ]; then
    echo "Service file created successfully: $SERVICE_FILE"
else
    echo "Failed to create service file: $SERVICE_FILE"
fi 

# Create the service
aws ecs create-service \
--service-name $SERVICE_NAME \
--cli-input-json file://service.json \
--region $AWS_PUBLIC_REGION 

# Describe the ECS service and filter by service name
service_description=$(aws ecs describe-services --service $SERVICE_NAME --cluster $CLUSTER_NAME --region $AWS_PUBLIC_REGION)

# Check if the service creation was successful
if [ $? -eq 0 ]; then
    echo "Service creation successful"
else
    echo "Failed to create service"
    exit 1
fi

# Wait for the agent to become ready
# You may need to adjust the number of attempts and sleep time according to your requirements
n=0
max_attempts=15
sleep_time=10
AGENT_HEALTHCHECK_URL="http://$ADMIN_ALB_DNS/agent"
echo "--------AGENT_HEALTHCHECK_URL-----$AGENT_URL"
until [ "$n" -ge "$max_attempts" ]; do
    agentResponse=$(curl -s -o /dev/null -w "%{http_code}" "$AGENT_HEALTHCHECK_URL")
    if [ "$agentResponse" = "200" ]; then
        echo "Agent is running"
        break
    else
        echo "Agent is not running"
        n=$((n + 1))
        sleep "$sleep_time"
    fi
done

 

# Describe the ECS service and filter by service name
service_description=$(aws ecs describe-services --service $SERVICE_NAME --cluster $CLUSTER_NAME --region $AWS_PUBLIC_REGION)
echo "service_description=$service_description"


# Extract Task ID from the service description events
task_id=$(echo "$service_description" | jq -r '.services[0].events[] | select(.message | test("has started 1 tasks")) | .message | capture("\\(task (?<id>[^)]+)\\)") | .id')
#echo "task_id=$task_id"

log_group=/ecs/$TESKDEFINITION_FAMILY/$CONTAINER_NAME
#echo "log_group=$log_group"

# Get Log Stream Name
log_stream=ecs/$CONTAINER_NAME/$task_id

#echo "logstrem=$log_stream"

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
    | grep -o 'API Token: [^ ]*' \
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


# Print variable values for debugging
echo "AGENCY: $AGENCY"
echo "CONTAINER_NAME: $CONTAINER_NAME"
echo "AGENT_URL: $AGENT_URL"
echo "AGENT_INBOUND_URL: $AGENT_INBOUND_URL"

## Construct file path for agent config
config_file="${PWD}/agent-provisioning/AFJ/endpoints/${AGENCY}_${CONTAINER_NAME}.json"

# Check if the directory exists and create it if it doesn't
config_dir=$(dirname "$config_file")
if [ ! -d "$config_dir" ]; then
    mkdir -p "$config_dir"
fi

# Create agent config
echo "Creating agent config"
cat <<EOF >"$config_file"
{
    "CONTROLLER_ENDPOINT": "$ADMIN_ALB_DNS",
    "AGENT_ENDPOINT": "$INBOUND_ALB_DNS"
}
EOF

# Check if the file was created successfully
if [ -f "$config_file" ]; then
    echo "Agent config created successfully: $config_file"
else
    echo "Failed to create agent config: $config_file"
fi

# Print available folders in the AFJ directory
echo "Available folders in the AFJ directory:"
ls -d "${PWD}/agent-provisioning/AFJ/"*/

# Print the content of the JSON files
echo "Content of endpoint JSON file:"
cat "$config_file"
echo "Content of token JSON file:"
cat "${PWD}/agent-provisioning/AFJ/token/${AGENCY}_${CONTAINER_NAME}.json"