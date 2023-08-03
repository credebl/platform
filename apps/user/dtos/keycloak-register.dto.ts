export class KeycloakUserRegistrationDto {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    enabled: boolean;
    totp: boolean;
    emailVerified: boolean;
    notBefore: number;
    credentials: Credentials[];
    access: Access;
    realmRoles: string[];
    attributes: object;

}

export class Credentials {
    type: string;
    value: string;
    temporary: boolean;
}

export class Access {
    manageGroupMembership: boolean;
    view: boolean;
    mapRoles: boolean;
    impersonate: boolean;
    manage: boolean;
}