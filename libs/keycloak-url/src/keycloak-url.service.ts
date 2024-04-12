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

  async GetClientRoleURL(
    realm: string,
    clientid: string,
    roleName = ''
  ):Promise<string> {

    if ('' === roleName) {
      return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients/${clientid}/roles`;
    }

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients/${clientid}/roles/${roleName}`;

  }

  async GetRealmRoleURL(
    realm: string,
    roleName = ''
  ):Promise<string> {

    if ('' === roleName) {
      return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/roles`;
    }

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/roles/${roleName}`;

  }

  async GetClientUserRoleURL(
    realm: string,
    userId: string,
    clientId?: string
  ):Promise<string> {

    if (clientId) {
      return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`;
    }

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/users/${userId}/role-mappings/realm`;

  }
  

  async GetClientIdpURL(
    realm: string,
    idp: string
  ):Promise<string> {

    return `${process.env.KEYCLOAK_DOMAIN}admin/realms/${realm}/clients/${idp}`;
  }

}
