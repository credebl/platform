export class UserRoleOrgPermsDto {
   id :number;
   role : userRoleDto;            
   Organization: userOrgDto;
}

export class userRoleDto {
    id: number;
    name : string;
    permissions :string[];

}

export class userOrgDto {
   id: number;
   orgName :string;
}

