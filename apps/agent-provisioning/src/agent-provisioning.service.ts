import { Injectable, Logger } from '@nestjs/common';
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

      const { containerName, externalIp, orgId, seed, walletName, walletPassword, walletStorageHost, walletStoragePassword, walletStoragePort, walletStorageUser, webhookEndpoint, agentType, protocol, afjVersion, tenant, indyLedger, apiKey} = payload;
      if (agentType === AgentType.AFJ) {
        // The wallet provision command is used to invoke a shell script
        const walletProvision = `${process.cwd() + process.env.AFJ_AGENT_SPIN_UP} ${orgId} "${externalIp}" "${walletName}" "${walletPassword}" ${seed} ${webhookEndpoint} ${walletStorageHost} ${walletStoragePort} ${walletStorageUser} ${walletStoragePassword} ${containerName} ${protocol} ${tenant} ${afjVersion} ${indyLedger} ${apiKey} ${process.env.AGENT_HOST} ${process.env.AWS_ACCOUNT_ID} ${process.env.S3_BUCKET_ARN} ${process.env.CLUSTER_NAME} ${process.env.TESKDEFINITION_FAMILY}`;
        const spinUpResponse: object = new Promise(async (resolve) => {

          await exec(walletProvision, async (err, stdout, stderr) => {
            this.logger.log(`shell script output: ${stdout}`);
            if (stderr) {
              this.logger.log(`shell script error: ${stderr}`);
            }
            const agentEndPoint: string = await fs.readFileSync(`${process.env.PWD}${process.env.AFJ_AGENT_ENDPOINT_PATH}${orgId}_${containerName}.json`, 'utf8');
            resolve(agentEndPoint);
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
}
