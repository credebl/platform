// # #!/bin/sh

import { Injectable, Logger } from "@nestjs/common";
import * as fs from 'fs';
import * as util from 'util';
import * as exec from 'child_process';
import * as tcpPortUsed from 'tcp-port-used';
import axios from 'axios';

const execPromise = util.promisify(exec.exec);

const START_TIME = Math.floor(Date.now() / 1000);
// # START_TIME=$(date +%s)

// # AGENCY=$1
// # EXTERNAL_IP=$2
// # WALLET_NAME=$3
// # WALLET_PASSWORD=$4
// # RANDOM_SEED=$5
// # WEBHOOK_HOST=$6
// # WALLET_STORAGE_HOST=$7
// # WALLET_STORAGE_PORT=$8
// # WALLET_STORAGE_USER=$9
// # WALLET_STORAGE_PASSWORD=${10}
// # CONTAINER_NAME=${11}
// # PROTOCOL=${12}
// # TENANT=${13}
// # AFJ_VERSION=${14}
// # INDY_LEDGER=${15}
// # AGENT_HOST=${16}
// # AWS_ACCOUNT_ID=${17}
// # S3_BUCKET_ARN=${18}
// # CLUSTER_NAME=${19}
// # TESKDEFINITION_FAMILY=${20}

// # SERVICE_NAME="${AGENCY}-${CONTAINER_NAME}-service"
// # DESIRED_COUNT=1
// # EXTERNAL_IP=$(echo "$2" | tr -d '[:space:]')
// # ADMIN_PORT_FILE="$PWD/apps/agent-provisioning/AFJ/port-file/last-admin-port.txt"
// # INBOUND_PORT_FILE="$PWD/apps/agent-provisioning/AFJ/port-file/last-inbound-port.txt"
// # ADMIN_PORT=8001
// # INBOUND_PORT=9001

// # increment_port() {
// #     local port="$1"
// #     local lower_limit="$2"

// #     while [ "$port" -le "$lower_limit" ]; do
// #         port=$((port + 1))  # Increment the port using arithmetic expansion
// #     done

// #     echo "$port"
// # }

// # # Check if admin port file exists and if not, create and initialize it
// # if [ ! -e "$ADMIN_PORT_FILE" ]; then
// #     echo "$ADMIN_PORT" > "$ADMIN_PORT_FILE"
// # fi

// # # Read the last used admin port number from the file
// # last_used_admin_port=$(cat "$ADMIN_PORT_FILE")
// # echo "Last used admin port: $last_used_admin_port"

// # # Increment the admin port number starting from the last used port
// # last_used_admin_port=$(increment_port "$last_used_admin_port" "$last_used_admin_port")

// # # Save the updated admin port number back to the file and update the global variable
// # echo "$last_used_admin_port" > "$ADMIN_PORT_FILE"
// # ADMIN_PORT="$last_used_admin_port"

// # # Check if inbound port file exists and if not, create and initialize it
// # if [ ! -e "$INBOUND_PORT_FILE" ]; then
// #     echo "$INBOUND_PORT" > "$INBOUND_PORT_FILE"
// # fi

// # # Read the last used inbound port number from the file
// # last_used_inbound_port=$(cat "$INBOUND_PORT_FILE")
// # echo "Last used inbound port: $last_used_inbound_port"

// # # Increment the inbound port number starting from the last used port
// # last_used_inbound_port=$(increment_port "$last_used_inbound_port" "$last_used_inbound_port")

// # # Save the updated inbound port number back to the file and update the global variable
// # echo "$last_used_inbound_port" > "$INBOUND_PORT_FILE"
// # INBOUND_PORT="$last_used_inbound_port"

// # echo "Last used admin port: $ADMIN_PORT"
// # echo "Last used inbound port: $INBOUND_PORT"
// # echo "AGENT SPIN-UP STARTED"

// # AGENT_ENDPOINT="${PROTOCOL}://${EXTERNAL_IP}:${INBOUND_PORT}"

// # cat <<EOF >>/app/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json
// # {
// #   "label": "${AGENCY}_${CONTAINER_NAME}",
// #   "walletId": "$WALLET_NAME",
// #   "walletKey": "$WALLET_PASSWORD",
// #   "walletType": "postgres",
// #   "walletUrl": "$WALLET_STORAGE_HOST:$WALLET_STORAGE_PORT",
// #   "walletAccount": "$WALLET_STORAGE_USER",
// #   "walletPassword": "$WALLET_STORAGE_PASSWORD",
// #   "walletAdminAccount": "$WALLET_STORAGE_USER",
// #   "walletAdminPassword": "$WALLET_STORAGE_PASSWORD",
// #   "walletScheme": "DatabasePerWallet",
// #   "indyLedger": $INDY_LEDGER,
// #   "endpoint": [
// #     "$AGENT_ENDPOINT"
// #   ],
// #   "autoAcceptConnections": true,
// #   "autoAcceptCredentials": "contentApproved",
// #   "autoAcceptProofs": "contentApproved",
// #   "logLevel": 5,
// #   "inboundTransport": [
// #     {
// #       "transport": "$PROTOCOL",
// #       "port": "$INBOUND_PORT"
// #     }
// #   ],
// #   "outboundTransport": [
// #     "$PROTOCOL"
// #   ],
// #   "webhookUrl": "$WEBHOOK_HOST/wh/$AGENCY",
// #   "adminPort": $ADMIN_PORT,
// #   "tenancy": $TENANT
// # }
// # EOF
// # # scp ${PWD}/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json ${AGENT_HOST}:/home/ec2-user/config/

// # # Construct the container definitions dynamically
// # CONTAINER_DEFINITIONS=$(
// #   cat <<EOF
// # [
// #   {
// #     "name": "$CONTAINER_NAME",
// #     "image": "${AFJ_IMAGE_URL}",
// #     "cpu": 154,
// #     "memory": 307,
// #     "portMappings": [
// #       {
// #         "containerPort": $ADMIN_PORT,
// #         "hostPort": $ADMIN_PORT,
// #         "protocol": "tcp"
// #       },
// #       {
// #         "containerPort": $INBOUND_PORT,
// #         "hostPort": $INBOUND_PORT,
// #         "protocol": "tcp"
// #       }
// #     ],
// #     "essential": true,
// #     "command": [
// #                 "--auto-accept-connections",
// #                 "--config",
// #                 "/config.json"
// #             ],
// #     "environment": [
// #       {
// #         "name": "AFJ_REST_LOG_LEVEL",
// #         "value": "1"
// #       }
// #     ],
// #     "environmentFiles": [
// #       {
// #         "value": "${S3_BUCKET_ARN}",
// #         "type": "s3"
// #       }
// #     ],
// #     "mountPoints": [
// #                 {
// #                     "sourceVolume": "config",
// #                     "containerPath": "/config.json",
// #                     "readOnly": true
// #                 }
// #             ],
// #     "volumesFrom": [],
// #     "ulimits": []
// #   }
// # ]
// # EOF
// # )

// # # Construct the task definition JSON dynamically
// # TASK_DEFINITION=$(
// #   cat <<EOF
// # {
// #   "family": "$TESKDEFINITION_FAMILY",
// #   "containerDefinitions": $CONTAINER_DEFINITIONS,
// #   "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
// #   "volumes": [
// #         {
// #             "name": "config",
// #             "host": {
// #                 "sourcePath": "/home/ec2-user/config/${AGENCY}_${CONTAINER_NAME}.json"
// #             }
// #         }
// #     ],
// #   "networkMode": "host",
// #   "requiresCompatibilities": [
// #     "EC2"
// #   ],
// #   "cpu": "154",
// #   "memory": "307"
// # }
// # EOF
// # )

// # # Save the task definition JSON to a file
// # echo "$TASK_DEFINITION" >task_definition.json

// # # Register the task definition and retrieve the ARN
// # TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://task_definition.json --query 'taskDefinition.taskDefinitionArn' --output text)

// # # Create the service
// # aws ecs create-service \
// #   --cluster $CLUSTER_NAME \
// #   --service-name $SERVICE_NAME \
// #   --task-definition $TASK_DEFINITION_ARN \
// #   --desired-count $DESIRED_COUNT \
// #   --launch-type EC2 \
// #   --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

// # if [ $? -eq 0 ]; then

// #   n=0
// #   until [ "$n" -ge 6 ]; do
// #     if netstat -tln | grep ${ADMIN_PORT} >/dev/null; then

// #       AGENTURL="http://${EXTERNAL_IP}:${ADMIN_PORT}/agent"
// #       agentResponse=$(curl -s -o /dev/null -w "%{http_code}" $AGENTURL)

// #       if [ "$agentResponse" = "200" ]; then
// #         echo "Agent is running" && break
// #       else
// #         echo "Agent is not running"
// #         n=$((n + 1))
// #         sleep 10
// #       fi
// #     else
// #       echo "No response from agent"
// #       n=$((n + 1))
// #       sleep 10
// #     fi
// #   done

// #   echo "Creating agent config"
// #   cat <<EOF >>${PWD}/agent-provisioning/AFJ/endpoints/${AGENCY}_${CONTAINER_NAME}.json
// #     {
// #         "CONTROLLER_ENDPOINT":"${EXTERNAL_IP}:${ADMIN_PORT}",
// #         "AGENT_ENDPOINT" : "${INTERNAL_IP}:${ADMIN_PORT}"
// #     }
// # EOF
// #   echo "Agent config created"
// # else
// #   echo "==============="
// #   echo "ERROR : Failed to spin up the agent!"
// #   echo "===============" && exit 125
// # fi
// # echo "Total time elapsed: $(date -ud "@$(($(date +%s) - $START_TIME))" +%T) (HH:MM:SS)"

@Injectable()
export class AgentStartEcsService {

    constructor(
        private readonly logger: Logger
    ) { }

    async startAgent(
        AGENCY: string,
        EXTERNAL_IP: string,
        WALLET_NAME: string,
        WALLET_PASSWORD: string,
        WEBHOOK_HOST: string,
        WALLET_STORAGE_HOST: string,
        WALLET_STORAGE_PORT: string,
        WALLET_STORAGE_USER: string,
        WALLET_STORAGE_PASSWORD: string,
        CONTAINER_NAME: string,
        PROTOCOL: string,
        TENANT: string,
        AFJ_VERSION: string,
        INDY_LEDGER: string,
        AGENT_HOST: string,
        AWS_ACCOUNT_ID: string,
        S3_BUCKET_ARN: string,
        CLUSTER_NAME: string,
        TESKDEFINITION_FAMILY: string,
        AFJ_IMAGE_URL: string
    ): Promise<string> {

        try {
            await this.main(
                AGENCY,
                EXTERNAL_IP,
                WALLET_NAME,
                WALLET_PASSWORD,
                WEBHOOK_HOST,
                WALLET_STORAGE_HOST,
                WALLET_STORAGE_PORT,
                WALLET_STORAGE_USER,
                WALLET_STORAGE_PASSWORD,
                CONTAINER_NAME,
                PROTOCOL,
                TENANT,
                AFJ_VERSION,
                INDY_LEDGER,
                AGENT_HOST,
                AWS_ACCOUNT_ID,
                S3_BUCKET_ARN,
                CLUSTER_NAME,
                TESKDEFINITION_FAMILY,
                AFJ_IMAGE_URL
            );

            return 'Agent spin-up successfully';
        } catch (err) {
            this.logger.error(`Error in main function: ${err}`);
            process.exit(1);
        }
    }

    async main(
        AGENCY: string,
        EXTERNAL_IP: string,
        WALLET_NAME: string,
        WALLET_PASSWORD: string,
        WEBHOOK_HOST: string,
        WALLET_STORAGE_HOST: string,
        WALLET_STORAGE_PORT: string,
        WALLET_STORAGE_USER: string,
        WALLET_STORAGE_PASSWORD: string,
        CONTAINER_NAME: string,
        PROTOCOL: string,
        TENANT: string,
        AFJ_VERSION: string,
        INDY_LEDGER: string,
        AGENT_HOST: string,
        AWS_ACCOUNT_ID: string,
        S3_BUCKET_ARN: string,
        CLUSTER_NAME: string,
        TESKDEFINITION_FAMILY: string,
        AFJ_IMAGE_URL: string
    ): Promise<string> {
        const SERVICE_NAME = `${AGENCY}-${CONTAINER_NAME}-service`;
        const DESIRED_COUNT = 1;
        const ADMIN_PORT_FILE = `${process.cwd()}/apps/agent-provisioning/AFJ/port-file/last-admin-port.txt`;
        const INBOUND_PORT_FILE = `${process.cwd()}/apps/agent-provisioning/AFJ/port-file/last-inbound-port.txt`;
        const EXTERNAL_IP_CLEANED = EXTERNAL_IP.replace(/\s/g, '');
        let ADMIN_PORT = 8001;
        let INBOUND_PORT = 9001;

        const cleanedJsonString = INDY_LEDGER.replace(/\\/g, '');

        function incrementPort(port: number, lowerLimit: number): number {
            let incrementedPort = port;

            while (incrementedPort < lowerLimit) {
                incrementedPort += 1;
            }

            return incrementedPort;
        }

        const readLastUsedPort = (file: string): number => {
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, String(ADMIN_PORT));
            }

            return parseInt(fs.readFileSync(file, 'utf-8'), 10);
        };

        const updateAndSavePort = (file: string, port: number): void => {
            fs.writeFileSync(file, String(port));
        };

        const lastUsedAdminPort = readLastUsedPort(ADMIN_PORT_FILE);
        ADMIN_PORT = incrementPort(lastUsedAdminPort, lastUsedAdminPort);
        updateAndSavePort(ADMIN_PORT_FILE, ADMIN_PORT);

        const lastUsedInboundPort = readLastUsedPort(INBOUND_PORT_FILE);
        INBOUND_PORT = incrementPort(lastUsedInboundPort, lastUsedInboundPort);
        updateAndSavePort(INBOUND_PORT_FILE, INBOUND_PORT);

        this.logger.log(`Last used admin port: ${lastUsedAdminPort}`);
        this.logger.log(`Last used inbound port: ${lastUsedInboundPort}`);
        this.logger.log('AGENT SPIN-UP STARTED');

        const AGENT_ENDPOINT = `${PROTOCOL}://${EXTERNAL_IP_CLEANED}:${INBOUND_PORT}`;

        const agentConfig = {
            label: `${AGENCY}_${CONTAINER_NAME}`,
            walletId: WALLET_NAME,
            walletKey: WALLET_PASSWORD,
            walletType: 'postgres',
            walletUrl: `${WALLET_STORAGE_HOST}:${WALLET_STORAGE_PORT}`,
            walletAccount: WALLET_STORAGE_USER,
            walletPassword: WALLET_STORAGE_PASSWORD,
            walletAdminAccount: WALLET_STORAGE_USER,
            walletAdminPassword: WALLET_STORAGE_PASSWORD,
            walletScheme: 'DatabasePerWallet',
            indyLedger: cleanedJsonString,
            endpoint: [AGENT_ENDPOINT],
            autoAcceptConnections: true,
            autoAcceptCredentials: 'contentApproved',
            autoAcceptProofs: 'contentApproved',
            logLevel: 5,
            inboundTransport: [{ transport: PROTOCOL, port: INBOUND_PORT }],
            outboundTransport: [PROTOCOL],
            webhookUrl: `${WEBHOOK_HOST}/wh/${AGENCY}`,
            adminPort: ADMIN_PORT,
            tenancy: TENANT
        };

        fs.writeFileSync(
            `${process.cwd()}/app/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json`,
            JSON.stringify(agentConfig, null, 2)
        );

        const CONTAINER_DEFINITIONS = [
            {
                name: CONTAINER_NAME,
                image: AFJ_IMAGE_URL,
                cpu: 154,
                memory: 307,
                portMappings: [
                    { containerPort: ADMIN_PORT, hostPort: ADMIN_PORT, protocol: 'tcp' },
                    { containerPort: INBOUND_PORT, hostPort: INBOUND_PORT, protocol: 'tcp' }
                ],
                essential: true,
                command: ['--auto-accept-connections', '--config', '/config.json'],
                environment: [{ name: 'AFJ_REST_LOG_LEVEL', value: '1' }],
                environmentFiles: [{ value: S3_BUCKET_ARN, type: 's3' }],
                mountPoints: [
                    {
                        sourceVolume: 'config',
                        containerPath: '/config.json',
                        readOnly: true
                    }
                ],
                volumesFrom: [],
                ulimits: []
            }
        ];

        const TASK_DEFINITION = {
            family: TESKDEFINITION_FAMILY,
            containerDefinitions: CONTAINER_DEFINITIONS,
            executionRoleArn: `arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole`,
            volumes: [
                {
                    name: 'config',
                    host: {
                        sourcePath: `/home/ec2-user/config/${AGENCY}_${CONTAINER_NAME}.json`
                    }
                }
            ],
            networkMode: 'host',
            requiresCompatibilities: ['EC2'],
            cpu: '154',
            memory: '307'
        };

        fs.writeFileSync(`${process.cwd()}/task_definition.json`, JSON.stringify(TASK_DEFINITION, null, 2));

        const registerTaskDefinitionCommand = `aws ecs register-task-definition --cli-input-json file://task_definition.json --query 'taskDefinition.taskDefinitionArn' --output text`;
        const { stdout: TASK_DEFINITION_ARN } = await execPromise(registerTaskDefinitionCommand.trim());

        const createServiceCommand = `aws ecs create-service --cluster ${CLUSTER_NAME} --service-name ${SERVICE_NAME} --task-definition ${TASK_DEFINITION_ARN} --desired-count ${DESIRED_COUNT} --launch-type EC2 --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"`;

        const createServiceResult = await execPromise(createServiceCommand.trim());

        if (!createServiceResult.stderr) {
            let n = 0;

            while (6 > n) {
                if (await this.isPortOpen(ADMIN_PORT)) {
                    const AGENTURL = `http://${EXTERNAL_IP_CLEANED}:${ADMIN_PORT}/agent`;
                    const agentResponse = await this.curl(AGENTURL);

                    if ('200' === agentResponse) {
                        this.logger.log('Agent is running');
                        break;
                    } else {
                        this.logger.log('Agent is not running');
                        n += 1;
                        await this.sleep(10);
                    }
                } else {
                    this.logger.log('No response from agent');
                    n += 1;
                    await this.sleep(10);
                }
            }

            this.logger.log('Creating agent config');

            const agentConfigFile = `${process.cwd()}/agent-provisioning/AFJ/endpoints/${AGENCY}_${CONTAINER_NAME}.json`;

            fs.writeFileSync(
                agentConfigFile,
                JSON.stringify(
                    {
                        CONTROLLER_ENDPOINT: `${EXTERNAL_IP_CLEANED}:${ADMIN_PORT}`
                    },
                    null,
                    2
                )
            );

            this.logger.log('Agent config created');
        } else {
            this.logger.log('===============');
            this.logger.log('ERROR: Failed to spin up the agent!');
            this.logger.log('===============');
            process.exit(125);
        }

        this.logger.log(`Total time elapsed: ${this.formatTimeElapsed(Date.now() - START_TIME)}`);
        return 'Agent spin-up successfully';
    }

    async formatTimeElapsed(milliseconds: number): Promise<string> {
        const seconds = Math.floor(milliseconds / 1000);
        const hh = Math.floor(seconds / 3600);
        const mm = Math.floor((seconds % 3600) / 60);
        const ss = seconds % 60;
        return `${hh}:${mm}:${ss}`;
    }

    async sleep(seconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }

    async isPortOpen(port: number): Promise<boolean> {
        try {
            const isUsed = await tcpPortUsed.check(port);
            return isUsed;
        } catch (error) {
            this.logger.error(`Error checking if port ${port} is open: ${error.message}`);
            return false;
        }
    }

    async curl(url: string): Promise<string> {
        try {
            const response = await axios.head(url);
            return response.status.toString();
        } catch (error) {
            this.logger.error(`Error making HTTP request to ${url}: ${error.message}`);
            return '0';
        }
    }

}