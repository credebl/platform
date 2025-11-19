/* eslint-disable arrow-body-style */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable space-in-parens */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as CryptoJS from 'crypto-js';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';

import { CommonConstants } from './common.constant';
import { HttpService } from '@nestjs/axios/dist';
import { ResponseService } from '@credebl/response';
import * as dotenv from 'dotenv';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from './response-messages';
import { IOptionalParams } from './interfaces/interface';
import { OrgAgentType } from '@credebl/enum/enum';
dotenv.config();

@Injectable()
export class CommonService {
  private readonly logger = new Logger('CommonService');
  result: ResponseService = new ResponseService();

  constructor(private readonly httpService: HttpService) { }

  async httpPost(url: string, payload?: any, apiKey?: any) {
    try {
      return await this.httpService
        .post(url, payload, apiKey)
        .toPromise()
        .then((response: any) => {
          return response.data;
        });
    } catch (error) {
      this.logger.error(`ERROR in POST : ${JSON.stringify(error)}`);
      if (
        error
          .toString()
          .includes(CommonConstants.RESP_ERR_HTTP_INVALID_HEADER_VALUE)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            error: CommonConstants.UNAUTH_MSG
          },
          HttpStatus.UNAUTHORIZED
        );
      }
      if (error.toString().includes(CommonConstants.RESP_ERR_NOT_FOUND)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      if (error.toString().includes(CommonConstants.RESP_BAD_REQUEST)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: error.message,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        error.toString().includes(CommonConstants.RESP_ERR_UNPROCESSABLE_ENTITY)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } 
      
        throw new HttpException(
          {
            statusCode: error.response.status,
            message: error.message,
            error: error.response.data ? error.response.data : error.message
          },
          error.response.status
        );
      
    }
  }

  async httpGet(url: string, config?: any) {
    try {
      return await this.httpService
        .get(url, config)
        .toPromise()
        .then((data) =>
          data.data
        );
    } catch (error) {
      this.logger.error(`ERROR in GET : ${JSON.stringify(error)}`);
      if (
        error.message
          .toString()
          .includes(CommonConstants.RESP_ERR_HTTP_ECONNREFUSED)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      if (
        error
          .toString()
          .includes(CommonConstants.RESP_ERR_HTTP_INVALID_HEADER_VALUE)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            error: CommonConstants.UNAUTH_MSG
          },
          HttpStatus.UNAUTHORIZED
        );
      }
      if (error.toString().includes(CommonConstants.RESP_ERR_NOT_FOUND)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      if (error.toString().includes(CommonConstants.RESP_BAD_REQUEST)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        error.toString().includes(CommonConstants.RESP_ERR_UNPROCESSABLE_ENTITY)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async httpPatch(url: string, payload?: any, apiKey?: any) {
    try {
      return await this.httpService
        .patch(url, payload, apiKey)
        .toPromise()
        .then((response: any) => {
          return response.data;
        });
    } catch (error) {
      this.logger.error(`ERROR in PATCH : ${JSON.stringify(error)}`);
      if (
        error
          .toString()
          .includes(CommonConstants.RESP_ERR_HTTP_INVALID_HEADER_VALUE)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            error: CommonConstants.UNAUTH_MSG
          },
          HttpStatus.UNAUTHORIZED
        );
      }
      if (error.toString().includes(CommonConstants.RESP_ERR_NOT_FOUND)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      if (error.toString().includes(CommonConstants.RESP_BAD_REQUEST)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        error.toString().includes(CommonConstants.RESP_ERR_UNPROCESSABLE_ENTITY)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async httpDelete(url: string, config?: unknown) {
    try {
      return await this.httpService
        .delete(url, config)
        .toPromise()
        .then((data) => {
          return data.data;
        });
    } catch (error) {
      this.logger.error(`ERROR in DELETE : ${JSON.stringify(error.response.data)}`);
      if (
        error
          .toString()
          .includes(CommonConstants.RESP_ERR_HTTP_INVALID_HEADER_VALUE)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            error: CommonConstants.UNAUTH_MSG
          },
          HttpStatus.UNAUTHORIZED
        );
      }
      if (error.toString().includes(CommonConstants.RESP_ERR_NOT_FOUND)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      if (error.toString().includes(CommonConstants.RESP_BAD_REQUEST)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        error.toString().includes(CommonConstants.RESP_ERR_UNPROCESSABLE_ENTITY)
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error.response.data ? error.response.data : error.message
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async httpPut(
    url: string,
    payload?: any,
    config?: any
  ): Promise<ResponseService> {
    try {
      const response = await this.httpService
        .put(url, payload, config)
        .toPromise();

      return this.filterResponse(response);
    } catch (error) {
      return this.sendError(error);
    }
  }

  filterResponse(data: any) {
    let response;
    if (
      data.data &&
      data.data.message !== undefined &&
      data.data.success !== undefined
    ) {
      this.logger.debug(
        `CommonService: data is already a response object, return`
      );
      response = data.data;
    } else {
      this.logger.debug(
        `CommonService: create response object: ${JSON.stringify(data?.data)}`
      );
      response = this.result.response(
        'fetched',
        true,
        !data.data.results
          ? !data.data.result
            ? data.data
            : data.data.result
          : data.data
      );
    }

    return response;
  }

  sendError(error: any): ResponseService {
    this.logger.error(
      `in sendError: ${error} StatusCode: ${error.response?.status}`
    );
    if (error.response?.status) {
      throw new HttpException(
        {
          statusCode: error.response.status,
          error: error.response.data ? error.response.data : error.message
        },
        error.response.status
      );
    } else {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.response.data ? error.response.data : error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // To validate space in string
  spaceValidate(text, customMessage) {
    if ('' === text.toString().trim()) {
      throw new BadRequestException(customMessage);
    }
  }
  // To validate password
  passwordValidation(password) {
    const passwordRegEx = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[-!@$%^*])(?=.*[!"$%*,-.\/:;=@^_])[a-zA-Z0-9!"$%*,-.\/:;=@^_]{8,}$/;
    const defaultMessage =
      'Passwords must contain at least 8 characters, including uppercase, lowercase, numbers and special character.';
    if (!passwordRegEx.test(password.trim())) {
      throw new BadRequestException(defaultMessage);
    }
  }
  // To decrypt password
  decryptPassword(encryptedPassword) {
    try {
      const password = CryptoJS.AES.decrypt(
        encryptedPassword,
        process.env.CRYPTO_PRIVATE_KEY
      );

      const decryptedPassword = JSON.parse(password.toString(CryptoJS.enc.Utf8));
      return decryptedPassword;
    } catch (error) {
      throw new BadRequestException('Invalid Credentials');
    }
  }
   dataEncryption(data: string) {
    // eslint-disable-next-line no-useless-catch
    try {
      const encryptedToken = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.CRYPTO_PRIVATE_KEY).toString();

      return encryptedToken;
    } catch (error) {
      throw error;
    }
  }

  handleError(error): Promise<void> {
    if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
      throw new RpcException({
        message: error?.status?.message?.error?.reason
          ? error?.status?.message?.error?.reason
          : error?.status?.message?.error,
        statusCode: error?.status?.code
      });
    } else {
      throw new RpcException(error.response ? error.response : error);
    }
  }
  
async checkAgentHealth(baseUrl: string, apiKey: string): Promise<boolean> {
  if (!baseUrl || !apiKey) {
    throw new BadRequestException(ResponseMessages.cloudWallet.error.agentDetails);
  }
  const url = `${baseUrl}${CommonConstants.URL_AGENT_GET_ENDPOINT}`;
  try {
    const agentHealthCheck = await this.httpGet(url, {
      headers: { authorization: apiKey }
    });
    if (agentHealthCheck.isInitialized) {
      return true;
    }
    return false;
  } catch (error) {
    throw new Error;
  }
}

async createDynamicUrl(urlOptions: IOptionalParams): Promise<string> {
  try {
    const { alias, myDid, outOfBandId, state, theirDid, theirLabel, connectionId, threadId } = urlOptions;
    // Create the dynamic URL for Search Criteria
    const criteriaParams = [];
    
    if (alias) {
      criteriaParams.push(`alias=${alias}`);
    }
    if (myDid) {
      criteriaParams.push(`myDid=${myDid}`);
    }
    if (outOfBandId) {
      criteriaParams.push(`outOfBandId=${outOfBandId}`);
    }
    if (state) {
      criteriaParams.push(`state=${state}`);
    }
    if (theirDid) {
      criteriaParams.push(`theirDid=${theirDid}`);
    }
    if (theirLabel) {
      criteriaParams.push(`theirLabel=${theirLabel}`);
    }
    if (threadId) {
      criteriaParams.push(`threadId=${threadId}`);
    }
    if (connectionId) {
      criteriaParams.push(`connectionId=${connectionId}`);
    }

    if (0 < criteriaParams.length) {
      const url: string = `?${criteriaParams.join('&')}`;
      return url;
    }
    
    return '';
  } catch (error) {
    throw new Error(`Failed to create dynamic URL: ${error.message}`);
  }
}

async sendBasicMessageAgentUrl(
  label: string,
  orgAgentType: string,
  agentEndPoint: string,
  tenantId?: string,
  connectionId?: string
): Promise<string> {
  try {
    let url;
    switch (label) {
      case 'send-basic-message': {
        url =
          orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_SEND_BASIC_MESSAGE}`.replace('#', connectionId)
            : orgAgentType === OrgAgentType.SHARED
            ? `${agentEndPoint}${CommonConstants.URL_SHARED_SEND_BASIC_MESSAGE}`
                .replace('#', connectionId)
                .replace('@', tenantId)
            : null;
        break;
      }

      default: {
        break;
      }
    }

    if (!url) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentUrlNotFound);
    }
    return url;
  } catch (error) {
    this.logger.error(`Error in getting basic-message Url: ${JSON.stringify(error)}`);
    throw error;
  }
}

}
