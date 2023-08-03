import {
  Controller,
  Logger
} from '@nestjs/common';
import { AuthzService } from './authz.service';
// import { CommonService } from "@credebl/common";
import { CommonService } from '../../../../libs/common/src/common.service';


@Controller('authz')
export class AuthzController {
  private logger = new Logger('AuthzController');

  constructor(private readonly authzService: AuthzService,
    private readonly commonService: CommonService) { }

}
