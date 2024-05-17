import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IWalletProvision } from './interface/agent-provisioning.interfaces';
import * as dotenv from 'dotenv';
import { AgentType } from '@credebl/enum/enum';
import * as fs from 'fs';
import { exec } from 'child_process';
dotenv.config();

@Injectable()
export class AgentProvisioningService {

  constructor(
    private readonly logger: Logger
  ) { }

  /**
   * Description: Wallet provision
   * @param payload 
   * @returns Get DID and verkey
   */
  async walletProvision(payload: IWalletProvision): Promise<object> {
    try {

      const { containerName, externalIp, orgId, seed, walletName, walletPassword, walletStorageHost, walletStoragePassword, walletStoragePort, walletStorageUser, webhookEndpoint, agentType, protocol, credoImage, tenant, indyLedger, inboundEndpoint } = payload;
      if (agentType === AgentType.AFJ) {
        // The wallet provision command is used to invoke a shell script
        const walletProvision = `${process.cwd() + process.env.AFJ_AGENT_SPIN_UP} ${orgId} "${externalIp}" "${walletName}" "${walletPassword}" ${seed} ${webhookEndpoint} ${walletStorageHost} ${walletStoragePort} ${walletStorageUser} ${walletStoragePassword} ${containerName} ${protocol} ${tenant} ${credoImage} "${indyLedger}" ${inboundEndpoint} ${process.env.SCHEMA_FILE_SERVER_URL} ${process.env.AGENT_HOST} ${process.env.AWS_ACCOUNT_ID} ${process.env.S3_BUCKET_ARN} ${process.env.CLUSTER_NAME} ${process.env.TESKDEFINITION_FAMILY}`;
        const spinUpResponse: object = new Promise(async (resolve) => {

          await exec(walletProvision, async (err, stdout, stderr) => {
            this.logger.log(`shell script output: ${stdout}`);
            if (stderr) {
              this.logger.log(`shell script error: ${stderr}`);
            }

            const agentEndpointPath = `${process.cwd()}${process.env.AFJ_AGENT_ENDPOINT_PATH}${orgId}_${containerName}.json`;
            const agentTokenPath = `${process.cwd()}${process.env.AFJ_AGENT_TOKEN_PATH}${orgId}_${containerName}.json`;

            const agentEndPointExists = await this.checkFileExistence(agentEndpointPath);
            const agentTokenExists = await this.checkFileExistence(agentTokenPath);

            let agentEndPoint;
            let agentToken;

            if (agentEndPointExists && agentTokenExists) {
              this.logger.log('Both files exist');
              agentEndPoint = await fs.readFileSync(agentEndpointPath, 'utf8');
              agentToken = await fs.readFileSync(agentTokenPath, 'utf8');
              // Proceed with accessing the files if needed
            } else {
              this.logger.log('One or both files do not exist');
              throw new NotFoundException(`${agentEndpointPath} or ${agentTokenPath} files do not exist `);
            }

            resolve({
              agentEndPoint: JSON.parse(agentEndPoint).CONTROLLER_ENDPOINT,
              agentToken: JSON.parse(agentToken).token
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
