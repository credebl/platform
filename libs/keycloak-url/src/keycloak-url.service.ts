import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KeycloakUrlService {
    private readonly logger = new Logger('KeycloakUrlService');


    async createUserURL(
        realm: string
      ):Promise<string> {

        return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users`;
    }

    async getUserByUsernameURL(
      realm: string,
      username: string
    ):Promise<string> {

      return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users?username=${username}`;
  }

    async GetUserInfoURL(
        realm: string,
        userid: string
      ):Promise<string> {

        return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users/${userid}`;
    }

    async GetSATURL(
        realm: string
      ):Promise<string> {

        return `${process.env.KEYCLOAK_DOMAIN}realms/${realm}/protocol/openid-connect/token`;
    }
    
    async ResetPasswordURL(
      realm: string,
      userid: string
    ):Promise<string> {

      return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users/${userid}/reset-password`;
  }


  async CreateRealmURL():Promise<string> {
    return `${process.env.KEYCLOAK_DOMAIN}admin/realms`;
  }

  async createClientURL(
    realm: string
  ):Promise<string> {

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients`;
  }

  async GetClientURL(
    realm: string,
    clientid: string
  ):Promise<string> {

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients?clientId=${clientid}`;
  } 

  async GetClientSecretURL(
    realm: string,
    clientid: string
  ):Promise<string> {

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients/${clientid}/client-secret`;
  }

}
