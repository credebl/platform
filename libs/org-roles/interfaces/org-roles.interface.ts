export interface IOrgRoles {
    id: string;
    name: string;
    description: string;
    createDateTime?: Date;
    createdBy?: string;
    lastChangedDateTime?: Date;
    lastChangedBy?: string;
}

export interface IUserOrganizationRole {
     id: string
     userId: string
     orgRoleId: string
     orgId: string
     idpRoleId: string
     orgRole: IOrgRoles
}