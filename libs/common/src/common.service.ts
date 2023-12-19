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
  Logger
} from '@nestjs/common';

import { CommonConstants } from './common.constant';
import { HttpService } from '@nestjs/axios/dist';
import { ResponseService } from '@credebl/response';

@Injectable()
export class CommonService {
  private readonly logger = new Logger('CommonService');
  result: ResponseService = new ResponseService();

  constructor(private readonly httpService: HttpService) { }

  async httpPost(url: string, payload?: any, apiKey?: any) {
    try {
      this.logger.debug(
        `httpPost service: URL : ${url} \nAPI KEY : ${JSON.stringify(
          apiKey
        )} \nPAYLOAD : ${JSON.stringify(payload)}`
      );
      return await this.httpService
        .post(url, payload, apiKey)
        .toPromise()
        .then((response: any) => {
          this.logger.log(`SUCCESS in POST : ${JSON.stringify(response.data)}`);
          this.logger.error(response.data);
          return response.data;
        });
    } catch (error) {
      this.logger.error(`ERROR in POST : ${error}`);
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

  async httpGet(url: string, config?: any) {
    try {
      this.logger.debug(`httpGet service URL: ${url}`);
      return await this.httpService
        .get(url, config)
        .toPromise()
        .then((data) =>
          // this.logger.log(`Success Data: ${JSON.stringify(data.data)}`);
          data.data
        );
    } catch (error) {
      this.logger.error(`ERROR in GET : ${JSON.stringify(error.response.data)}`);
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
      this.logger.debug(
        `httpPatch service: URL : ${url} \nAPI KEY : ${JSON.stringify(
          apiKey
        )} \nPAYLOAD : ${JSON.stringify(payload)}`
      );
      return await this.httpService
        .patch(url, payload, apiKey)
        .toPromise()
        .then((response: any) => {
          this.logger.log(`SUCCESS in POST : ${JSON.stringify(response.data)}`);
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

  async httpDelete(url: string, config?: unknown): Promise<object> {
    try {
      this.logger.debug(`httpDelete service URL: ${url}`);
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
      this.logger.debug(
        `httpPut service: URL : ${url} \nCONFIG : ${JSON.stringify(
          config
        )} \nPAYLOAD : ${JSON.stringify(payload)}`
      );
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

}
