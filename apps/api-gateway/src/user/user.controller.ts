import { Controller, Post, Put, Body, Param, UseFilters } from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Res } from '@nestjs/common';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { CommonService } from '@credebl/common';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { BadRequestException } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Get } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { user } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { Invitation } from '@credebl/enum/enum';
import { IUserRequestInterface } from './interfaces';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { AddPasskeyDetails } from './dto/add-user.dto';
import { EmailValidator } from '../dtos/email-validator.dto';

@UseFilters(CustomExceptionFilter)
@Controller('users')
@ApiTags('users')
@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
export class UserController {
  constructor(private readonly userService: UserService, private readonly commonService: CommonService) { }

  /**
   * 
   * @param user 
   * @param orgId 
   * @param res 
   * @returns Users list of organization
   */
  @Get('/public-profiles')
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiOperation({ summary: 'Get users list', description: 'Get users list.' })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  async get(@User() user: IUserRequestInterface, @Query() getAllUsersDto: GetAllUsersDto, @Res() res: Response): Promise<Response> {

    const users = await this.userService.get(getAllUsersDto);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchUsers,
      data: users.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('public-profiles/:username')
  @ApiOperation({
    summary: 'Fetch user details',
    description: 'Fetch user details'
  })
  @ApiParam({
    name: 'username',
    type: String,
    required: false
  })
  async getPublicProfile(@Param('username') username: string, @Res() res: Response): Promise<object> {
    const userData = await this.userService.getPublicProfile(username);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/profile')
  @ApiOperation({
    summary: 'Fetch login user details',
    description: 'Fetch login user details'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProfile(@User() reqUser: user, @Res() res: Response): Promise<object> {

    const userData = await this.userService.getProfile(reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchProfile,
      data: userData.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Get('/activity')
  @ApiOperation({
    summary: 'organization invitations',
    description: 'Fetch organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({ name: 'limit', required: true })
  async getUserActivities(@Query('limit') limit: number, @Res() res: Response, @User() reqUser: user): Promise<Response> {

    const userDetails = await this.userService.getUserActivities(reqUser.id, limit);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.userActivity,
      data: userDetails.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }


  @Get('/org-invitations')
  @ApiOperation({
    summary: 'organization invitations',
    description: 'Fetch organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false
  })
  async invitations(@Query() getAllInvitationsDto: GetAllInvitationsDto, @User() reqUser: user, @Res() res: Response): Promise<object> {

    if (!Object.values(Invitation).includes(getAllInvitationsDto.status)) {
      throw new BadRequestException(ResponseMessages.user.error.invalidInvitationStatus);
    }

    const invitations = await this.userService.invitations(reqUser.id, getAllInvitationsDto.status, getAllInvitationsDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.fetchInvitations,
      data: invitations.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
  *
  * @param email
  * @param res
  * @returns User email check
  */
  @Get('/:email')
  @ApiOperation({ summary: 'Check user exist', description: 'check user existence' })
  async checkUserExist(@Param() emailParam: EmailValidator, @Res() res: Response): Promise<Response> {
    const userDetails = await this.userService.checkUserExist(emailParam.email);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.checkEmail,
      data: userDetails.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }

  /**
   * 
   * @param acceptRejectInvitation 
   * @param reqUser 
   * @param res 
   * @returns Organization invitation status
   */
  @Post('/org-invitations/:invitationId')
  @ApiOperation({
    summary: 'accept/reject organization invitation',
    description: 'Accept or Reject organization invitations'
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async acceptRejectInvitaion(@Body() acceptRejectInvitation: AcceptRejectInvitationDto, @Param('invitationId') invitationId: string, @User() reqUser: user, @Res() res: Response): Promise<object> {
    acceptRejectInvitation.invitationId = parseInt(invitationId);
    const invitationRes = await this.userService.acceptRejectInvitaion(acceptRejectInvitation, reqUser.id);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: invitationRes.response
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);

  }

  @Put('/')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user profile'
  })
  @ApiResponse({ status: 200, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateUserProfile(@Body() updateUserProfileDto: UpdateUserProfileDto, @User() reqUser: user, @Res() res: Response): Promise<Response> {

    const userId = reqUser.id;
    updateUserProfileDto.id = userId;
    await this.userService.updateUserProfile(updateUserProfileDto);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update
    };
    return res.status(HttpStatus.OK).json(finalResponse);

  }

  @Put('/password/:email')
  @ApiOperation({ summary: 'Store user password details', description: 'Store user password details' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async addPasskey(@Body() userInfo: AddPasskeyDetails, @Param('email') email: string, @Res() res: Response): Promise<Response> {
    const userDetails = await this.userService.addPasskey(email, userInfo);
    const finalResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.update,
      data: userDetails.response
    };

    return res.status(HttpStatus.OK).json(finalResponse);

  }
}