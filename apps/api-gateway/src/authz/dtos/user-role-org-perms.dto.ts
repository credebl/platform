
export class UserRoleOrgPermsDto {
   id :string;
   role : userRoleDto;            
   Organization: userOrgDto;
}

export class userRoleDto {
    id: string;
    name : string;
    permissions :string[];

}

export class userOrgDto {
   id: number;
   orgName :string;
}

