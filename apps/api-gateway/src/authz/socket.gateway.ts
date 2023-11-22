import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer

} from '@nestjs/websockets';

import { AgentService } from '../agent/agent.service';
import { ConnectionService } from '../connection/connection.service';
import { Logger } from '@nestjs/common';
import { VerificationService } from '../verification/verification.service';
import { ISocketInterface } from '../interfaces/ISocket.interface';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer() server;

  constructor(
    private readonly verificationService: VerificationService,
    private readonly connectionService: ConnectionService,
    private readonly agentService: AgentService
  ) { }
  private readonly logger = new Logger('SocketGateway');

  handleConnection(): void {
    this.logger.debug(`Socket connected.`);
  }

  /**
   * @description:Method used to disconnect the socket.
   */
  handleDisconnect(): void {
    this.logger.debug(`Socket disconnected.`);
  }

  // @SubscribeMessage('message')
  // async handleMessage(client: Socket): Promise<void> {
  //   const generatedProofRequest: ResponseService = await this.verificationService.generateProofRequestPasswordLess();
  //   this.server.to(client.id).emit('message', generatedProofRequest);
  // }

  @SubscribeMessage('passwordLess')
  async handlePasswordLessResponse(payload: ISocketInterface): Promise<void> {
    this.server.to(payload.clientSocketId).emit('passwordLess', payload.token);
  }

  @SubscribeMessage('agent-spinup-process-initiated')
  async handlAgentSpinUpProccessStartedResponse(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.server.to(payload.clientId).emit('agent-spinup-process-initiated');
  }

  @SubscribeMessage('agent-spinup-process-completed')
  async handlAgentSpinUpProccessSucessResponse(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.server.to(payload.clientId).emit('agent-spinup-process-completed');
  }

  @SubscribeMessage('did-publish-process-initiated')
  async handlDidPublicProcessStarted(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.server.to(payload.clientId).emit('did-publish-process-initiated');
  }

  @SubscribeMessage('did-publish-process-completed')
  async handlDidPublicProcessSuccess(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.server.to(payload.clientId).emit('did-publish-process-completed');
  }

  @SubscribeMessage('invitation-url-creation-started')
  async handleInvitationUrlCreationStartResponse(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.logger.log(`invitation-url-creation-started ${payload.clientId}`);
    this.server.to(payload.clientId).emit('invitation-url-creation-started');
  }

  @SubscribeMessage('invitation-url-creation-success')
  async handleInvitationUrlCreationSuccessResponse(
    client: string,
    payload: ISocketInterface
  ): Promise<void> {
    this.logger.log(`invitation-url-creation-success ${payload.clientId}`);
    this.server.to(payload.clientId).emit('invitation-url-creation-success');
  }

  @SubscribeMessage('error-in-wallet-creation-process')
  async handleErrorResponse(client:string, payload: ISocketInterface): Promise<void> {
    this.logger.log(`error-in-wallet-creation-process ${payload.clientId}`);
    this.server
      .to(payload.clientId)
      .emit('error-in-wallet-creation-process', payload.error);
  }

  @SubscribeMessage('bulk-issuance-process-completed')
  async handleBulkIssuance(client:string, payload: ISocketInterface): Promise<void> {
    this.logger.log(`bulk-issuance-process-completed ${payload.clientId}`);
    this.server
      .to(payload.clientId)
      .emit('bulk-issuance-process-completed');
  }

  @SubscribeMessage('error-in-bulk-issuance-process')
  async handleBulkIssuanceErrorResponse(client:string, payload: ISocketInterface): Promise<void> {
    this.logger.log(`error-in-bulk-issuance-process ${payload.clientId}`);
    this.server
      .to(payload.clientId)
      .emit('error-in-bulk-issuance-process', payload.error);
  }

  @SubscribeMessage('bulk-issuance-process-retry-completed')
  async handleBulkIssuanceRetry(client:string, payload: ISocketInterface): Promise<void> {
    this.logger.log(`bulk-issuance-process-retry-completed ${payload.clientId}`);
    this.server
      .to(payload.clientId)
      .emit('bulk-issuance-process-retry-completed');
  }
}
