import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
// import { tap } from 'rxjs/operators';
import { EcosystemService } from '../ecosystem.service';
import { EcosystemConfigSettings } from '@credebl/enum/enum';
import { HttpService } from '@nestjs/axios';
import { CommonService } from '@credebl/common';
// import IResponseType from '@credebl/common/interfaces/response.interface';

@Injectable()
export class RequestInterceptor implements NestInterceptor {

    constructor(
        private readonly ecosystemService: EcosystemService, // Inject the service
        private readonly httpService: HttpService,
        private readonly commonService: CommonService
        ) { }     
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      
      // Request requires org check, proceed with it
      const req = context.switchToHttp().getRequest();

      const ecosystemConfigRes = await this.ecosystemService.fetchEcosystemSettings();
      const ecosystemConfigList = ecosystemConfigRes.response;

      const participateInEcosystem = Array.isArray(ecosystemConfigList) && ecosystemConfigList.find((config) => config.key === EcosystemConfigSettings.PARTICIPATE_IN_ECOSYSTEM);

      if ('true' === participateInEcosystem.value) {
        // console.log(`Redirect To ecosystem`);

        const url = `${process.env.ECOSYSTEM_DOMAIN}/auth/signin`;
        const payload = {};

        try {
          await this.httpService
          .post(url, payload)
          .toPromise()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((response: any) => response.data);
        //   .catch((error: any) => console.log(`Login Error::`, error));

            // console.log(`Access Token::`, loginResponse.data.access_token);
            
          } catch (error) {
            // Handle errors or rethrow for upper-level handling
            throw new Error('Failed to call third-party API');
          }

        //   console.log('Request URL...', req.url);
        //   console.log('Request Type...', req.method);
        //   console.log('ecosystemConfig...', participateInEcosystem);
        //   console.log('Request Body...', req.body);
    
          req['redirected'] = participateInEcosystem.value;
        
      }

  
    // const now = Date.now();
    return next
      .handle()
      .pipe(
        map((res) => {
            // console.log(`RES::`, res.data);
            return res;
          })
      );
  }
}