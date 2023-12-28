export interface ISignInUser {
        access_token: string;
        token_type?: string;
        expires_in?: number;
        expires_at?: number;
        refresh_token?: string;
      }
      export interface IVerifyUserEmail{
        email: string;
        verificationCode: string;
      }
      export interface ISendVerificationEmail {
        email: string;
        username?: string;
      }
      
      export  interface IUserInvitations {
        totalPages:number;
        userInvitationsData:IUserInvitationsData[];
      }
      export  interface IUserInvitationsData {
        orgRoles: IOrgRole[];
        status: string;
        id: string;
        orgId: string;
        organisation: IOrganisation;
        userId: string;
      }
      export interface IOrgRole {
        id: string;
        name: string;
        description: string;
      }
      
      export interface IOrganisation {
        id: string;
        name: string;
        logoUrl: string;
      }      