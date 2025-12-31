import * as dotenv from 'dotenv';
import * as fs from 'fs';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AgentType } from '@credebl/enum/enum';
import { IWalletProvision } from './interface/agent-provisioning.interfaces';
import { RpcException } from '@nestjs/microservices';
import { exec } from 'child_process';

dotenv.config();

@Injectable()
export class AgentProvisioningService {
  constructor(private readonly logger: Logger) {}

  /**
   * Description: Wallet provision
   * @param payload
   * @returns Get DID and verkey
   */
  async walletProvision(payload: IWalletProvision): Promise<object> {
    try {
      const {
        containerName,
        externalIp,
        orgId,
        seed,
        walletName,
        walletPassword,
        walletStorageHost,
        walletStoragePassword,
        walletStoragePort,
        walletStorageUser,
        webhookEndpoint,
        agentType,
        protocol,
        credoImage,
        tenant,
        indyLedger,
        inboundEndpoint
      } = payload;
      if (agentType === AgentType.AFJ) {
        // The wallet provision command is used to invoke a shell script
        const walletProvision = `${process.cwd() + process.env.AFJ_AGENT_SPIN_UP} ${orgId} "${externalIp}" "${walletName}" "${walletPassword}" ${seed} ${webhookEndpoint} ${walletStorageHost} ${walletStoragePort} ${walletStorageUser} ${walletStoragePassword} ${containerName} ${protocol} ${tenant} ${credoImage} "${indyLedger}" ${inboundEndpoint} ${process.env.SCHEMA_FILE_SERVER_URL} ${process.env.AGENT_API_KEY} ${process.env.AWS_ACCOUNT_ID} ${process.env.S3_BUCKET_ARN} ${process.env.CLUSTER_NAME} ${process.env.TASKDEFINITION_FAMILY} ${process.env.ADMIN_TG_ARN} ${process.env.INBOUND_TG_ARN} ${process.env.FILESYSTEMID} ${process.env.ECS_SUBNET_ID} ${process.env.ECS_SECURITY_GROUP_ID}`;
        const spinUpResponse: object = new Promise(async (resolve) => {
          await exec(walletProvision, async (err, stdout, stderr) => {
            this.logger.log(`shell script output: ${stdout}`);
            if (stderr) {
              this.logger.log(`shell script error: ${stderr}`);
            }

            const agentEndpointPath = `${process.cwd()}${process.env.AFJ_AGENT_ENDPOINT_PATH}${orgId}_${containerName}.json`;

            const agentEndPointExists = await this.checkFileExistence(agentEndpointPath);

            let agentEndPoint;

            if (agentEndPointExists) {
              this.logger.log('Agent endpoint file exists');
              agentEndPoint = await fs.readFileSync(agentEndpointPath, 'utf8');
              // Proceed with accessing the files if needed
            } else {
              this.logger.log('Agent endpoint file does not exist');
              throw new NotFoundException(`Agent endpoint file does not exist: ${agentEndpointPath}`);
            }

            let parsedEndpoint;
            try {
              parsedEndpoint = JSON.parse(agentEndPoint);
            } catch (parseError) {
              this.logger.error(`Failed to parse agent endpoint file: ${parseError.message}`);
              throw new Error(`Invalid JSON in agent endpoint file: ${agentEndpointPath}`);
            }

            if (!parsedEndpoint.CONTROLLER_ENDPOINT) {
              this.logger.error('CONTROLLER_ENDPOINT key missing in agent endpoint file');
              throw new Error(`Missing CONTROLLER_ENDPOINT in: ${agentEndpointPath}`);
            }

            resolve({
              agentEndPoint: parsedEndpoint.CONTROLLER_ENDPOINT
            });
          });
        });
        return spinUpResponse;
      } else if (agentType === AgentType.ACAPY) {
        // TODO: ACA-PY Agent Spin-Up
      }
    } catch (error) {
      this.logger.error(`[walletProvision] - error in wallet provision: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async checkFileExistence(filePath: string): Promise<boolean> {
    try {
      await fs.accessSync(filePath);
      return true; // File exists
    } catch (error) {
      return false; // File does not exist
    }
  }
}
