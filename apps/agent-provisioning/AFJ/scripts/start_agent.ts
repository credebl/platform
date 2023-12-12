import * as fs from 'fs';
import * as util from 'util';
// eslint-disable-next-line camelcase
import * as child_process from 'child_process';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
const exec = util.promisify(child_process.exec);

const START_TIME = Math.floor(new Date().getTime() / 1000);

@Injectable()
export class AgentStartService {

    constructor(
        private readonly logger: Logger
    ) { }


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
        INDY_LEDGER: string
    ): Promise<string> {
        let lastUsedAdminPort: number;
        let lastUsedInboundPort: number;

        const cleanedJsonString = INDY_LEDGER.replace(/\\/g, '');

        const ADMIN_PORT_FILE = `${process.cwd()}/apps/agent-provisioning/AFJ/port-file/last-admin-port.txt`;
        const INBOUND_PORT_FILE = `${process.cwd()}/apps/agent-provisioning/AFJ/port-file/last-inbound-port.txt`;


        function incrementPort(port: number, lowerLimit: number): number {
            let incrementedPort = port;

            while (incrementedPort < lowerLimit) {
                incrementedPort += 1;
            }

            return incrementedPort;
        }

        try {
            lastUsedAdminPort = parseInt(fs.readFileSync(ADMIN_PORT_FILE, 'utf-8').trim(), 10);
        } catch (err) {
            this.logger.error(`Error reading admin port file: ${err}`);
            process.exit(1);
        }

        this.logger.log(`Last used admin port: ${lastUsedAdminPort}`);
        lastUsedAdminPort = incrementPort(lastUsedAdminPort, lastUsedAdminPort);

        fs.writeFileSync(ADMIN_PORT_FILE, lastUsedAdminPort.toString());

        this.logger.log(`Last used admin port: ${lastUsedAdminPort}`);

        try {
            lastUsedInboundPort = parseInt(fs.readFileSync(INBOUND_PORT_FILE, 'utf-8').trim(), 10);
        } catch (err) {
            this.logger.error(`Error reading inbound port file: ${err}`);
            process.exit(1);
        }

        this.logger.log(`Last used inbound port: ${lastUsedInboundPort}`);
        lastUsedInboundPort = incrementPort(lastUsedInboundPort, lastUsedInboundPort);

        fs.writeFileSync(INBOUND_PORT_FILE, lastUsedInboundPort.toString());

        this.logger.log(`Last used inbound port: ${lastUsedInboundPort}`);

        this.logger.log('AGENT SPIN-UP STARTED');

        if (!fs.existsSync(`${process.cwd()}/apps/agent-provisioning/AFJ/endpoints`)) {
            this.logger.log('Error: Endpoints directory does not exist.');
            fs.mkdirSync(`${process.cwd()}/apps/agent-provisioning/AFJ/endpoints`);
        }


        const AGENT_ENDPOINT = `${PROTOCOL}://${EXTERNAL_IP}:${lastUsedInboundPort}`;

        const agentConfigFilePath = `${process.cwd()}/apps/agent-provisioning/AFJ/agent-config/${AGENCY}_${CONTAINER_NAME}.json`;

        try {
            fs.writeFileSync(agentConfigFilePath, JSON.stringify({
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
                indyLedger: JSON.parse(cleanedJsonString),
                endpoint: [AGENT_ENDPOINT],
                autoAcceptConnections: true,
                autoAcceptCredentials: 'contentApproved',
                autoAcceptProofs: 'contentApproved',
                logLevel: 5,
                inboundTransport: [
                    {
                        transport: PROTOCOL,
                        port: lastUsedInboundPort
                    }
                ],
                outboundTransport: [PROTOCOL],
                webhookUrl: `${WEBHOOK_HOST}/wh/${AGENCY}`,
                adminPort: lastUsedAdminPort,
                tenancy: TENANT
            }, null, 2));
        } catch (err) {
            this.logger.error(`Error writing agent config file: ${err}`);
            process.exit(1);
        }

        const FILE_NAME = `docker-compose_${AGENCY}_${CONTAINER_NAME}.yaml`;

        try {
            fs.writeFileSync(
                `${process.cwd()}/apps/agent-provisioning/AFJ/${FILE_NAME}`,
                `version: '3'

services:
  agent:
    image: ${AFJ_VERSION}

    container_name: ${AGENCY}_${CONTAINER_NAME}
    restart: always
    environment:
      AFJ_REST_LOG_LEVEL: 1
    ports:
      - ${lastUsedInboundPort}:${lastUsedInboundPort}
      - ${lastUsedAdminPort}:${lastUsedAdminPort}
    
    volumes: 
      - ./agent-config/${AGENCY}_${CONTAINER_NAME}.json:/config.json
      
    command: --auto-accept-connections --config /config.json
      
volumes:
  pgdata:
  agent-indy_client:
  agent-tmp:
`
            );
        } catch (err) {
            this.logger.error(`Error writing docker-compose file: ${err}`);
            process.exit(1);
        }

        try {
            const { stdout } = await exec(`docker-compose -f apps/agent-provisioning/AFJ/${FILE_NAME} --project-name ${AGENCY}_${CONTAINER_NAME} up -d`);

            this.logger.log(stdout);

            let n = 0;
            const maxAttempts = 6;

            while (n < maxAttempts) {
                try {
                    const { stdout } = await exec(`netstat -tln | grep ${lastUsedAdminPort}`);
                    if ('' !== stdout.trim()) {
                        const AGENTURL = `http://${EXTERNAL_IP}:${lastUsedAdminPort}/agent`;
                        const agentResponse = await fetch(AGENTURL);

                        if (200 === agentResponse.status) {
                            this.logger.log('Agent is running');
                            break;
                        } else {
                            this.logger.log('Agent is not running');
                        }
                    }
                } catch (err) {
                    this.logger.log('No response from agent');
                }

                n += 1;
                await new Promise(resolve => setTimeout(resolve, 10000)); // Sleep for 10 seconds
            }

            this.logger.log('Creating agent config');
            fs.writeFileSync(
                `${process.cwd()}/apps/agent-provisioning/AFJ/endpoints/${AGENCY}_${CONTAINER_NAME}.json`,
                JSON.stringify({
                    CONTROLLER_ENDPOINT: `${EXTERNAL_IP}:${lastUsedAdminPort}`
                }, null, 2)
            );
            this.logger.log('Agent config created');
        } catch (err) {
            this.logger.error(`Error spinning up the agent: ${err}`);
            process.exit(1);
        }

        this.logger.log(`Total time elapsed: ${new Date((new Date().getTime() - START_TIME) * 1000).toISOString().substring(11, 19)} (HH:MM:SS)`);
        return 'Agent spin-up successfully';
    }

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
        INDY_LEDGER: string
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
                INDY_LEDGER
            );

            return 'Agent spin-up successfully';
        } catch (err) {
            this.logger.error(`Error in main function: ${err}`);
            process.exit(1);
        }
    }
}
