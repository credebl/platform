import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Post, Logger, Body, HttpStatus, Res, UseFilters, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { CloudWalletService } from './cloud-wallet.service';
import { AcceptOfferDto, CreateCloudWalletDidDto, CreateCloudWalletDto, ReceiveInvitationUrlDTO } from './dtos/cloudWallet.dto';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UserRoleGuard } from '../authz/guards/user-role.guard';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { validateDid } from '@credebl/common/did.validator';
import { CommonConstants } from '@credebl/common/common.constant';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('cloud-wallet')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class CloudWalletController {

    private readonly logger = new Logger('cloud-wallet');
    constructor(private readonly cloudWalletService: CloudWalletService
    ) { }

     /**
        * Create cloud wallet
        * @param cloudWalletDetails 
        * @param res 
        * @returns Sucess message and wallet details
    */
     @Post('/create-wallet')
     @ApiOperation({ summary: 'Create cloud wallet', description: 'Create cloud wallet' })
     @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
     @ApiBearerAuth()
     @UseGuards(AuthGuard('jwt'), UserRoleGuard)
     async createCloudWallet(
         @Res() res: Response,
         @Body() cloudWalletDetails: CreateCloudWalletDto,
         @User() user: user
     ): Promise<Response> {
         const {email, id} = user;
         cloudWalletDetails.email = email;
         cloudWalletDetails.userId = id;
         const cloudWalletData = await this.cloudWalletService.createCloudWallet(cloudWalletDetails);
         const finalResponse: IResponse = {
             statusCode: HttpStatus.CREATED,
             message: ResponseMessages.cloudWallet.success.create,
             data: cloudWalletData
         };
         return res.status(HttpStatus.CREATED).json(finalResponse);
 
     }

      /**
        * Receive invitation by URL
        * @param receiveInvitation 
        * @param res 
        * @returns Response from agent
    */
      @Post('/receive-invitation-url')
      @ApiOperation({ summary: 'Receive inviation using URL', description: 'Receive inviation using URL' })
      @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
      @ApiBearerAuth()
      @UseGuards(AuthGuard('jwt'), UserRoleGuard)
      async receiveInvitationByUrl(
          @Res() res: Response,
          @Body() receiveInvitation: ReceiveInvitationUrlDTO,
          @User() user: user
      ): Promise<Response> {
        const {email, id} = user;
        receiveInvitation.email = email;
        receiveInvitation.userId = id;
          const receiveInvitationData = await this.cloudWalletService.receiveInvitationByUrl(receiveInvitation);
          const finalResponse: IResponse = {
              statusCode: HttpStatus.CREATED,
              message: ResponseMessages.cloudWallet.success.receive,
              data: receiveInvitationData
          };
          return res.status(HttpStatus.CREATED).json(finalResponse);
  
      }

      /**
        * Accept offer
        * @param acceptOffer 
        * @param res 
        * @returns Response from agent
    */
      @Post('/accept-offer')
      @ApiOperation({ summary: 'Accept credential offer', description: 'Accept credential offer' })
      @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
      @ApiBearerAuth()
      @UseGuards(AuthGuard('jwt'), UserRoleGuard)
      async acceptOffer(
          @Res() res: Response,
          @Body() acceptOffer: AcceptOfferDto,
          @User() user: user
      ): Promise<Response> {
        const {email, id} = user;
        acceptOffer.email = email;
        acceptOffer.userId = id;
          const receiveInvitationData = await this.cloudWalletService.acceptOffer(acceptOffer);
          const finalResponse: IResponse = {
              statusCode: HttpStatus.CREATED,
              message: ResponseMessages.cloudWallet.success.receive,
              data: receiveInvitationData
          };
          return res.status(HttpStatus.CREATED).json(finalResponse);
  
      }

      // This function will be used after multiple did method implementation in create wallet
  /**
   * Create did
   * @param orgId
   * @returns did
   */
  @Post('/create-did')
  @ApiOperation({
    summary: 'Create new did',
    description: 'Create new did for cloud wallet'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createDid(
    @Body() createDidDto: CreateCloudWalletDidDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await validateDid(createDidDto);
    const {email, id} = user;
    createDidDto.email = email;
    createDidDto.userId = id;
    if (createDidDto.seed && CommonConstants.SEED_LENGTH !== createDidDto.seed.length) {
      throw new BadRequestException(ResponseMessages.agent.error.seedChar, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.badRequest
      });
    }

    const didDetails = await this.cloudWalletService.createDid(createDidDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createDid,
      data: didDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}
