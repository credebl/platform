import { IUserBasicDetails } from '@credebl/common/interfaces/user.interface';

export class DeleteEcosystemMemberTemplate {

    public sendDeleteMemberEmailTemplate(
        userInfo: IUserBasicDetails,
        orgName: string,
        ecosystemName: string
    ): string {
          
    const {firstName, lastName} = userInfo;
    return `<!DOCTYPE html>
        <html lang="en">
        
        <head>  
            <title></title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        
        <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
            <div style="margin: auto; max-width: 450px; padding: 20px 30px; background-color: #FFFFFF; display:block;">
          <div style="display: block; text-align:center; background-color: white; padding-bottom: 20px; padding-top: 20px;">
              <img src="${process.env.BRAND_LOGO}" alt="${process.env.PLATFORM_NAME} logo" style="max-width:100px; background: white; padding: 5px;border-radius: 5px;" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
          </div>
          
        <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
          font-size: 15px; line-height: 24px;color: #00000;">
              <p style="margin-top:0px">
                  Hello ${firstName} ${lastName},
              </p>
              <p>
              We would like to inform you that the organization “${orgName}”, has removed their participation as a member from the "${ecosystemName}" on CREDEBL.

              <hr style="border-top:1px solid #e8e8e8" />
              <footer style="padding-top: 10px;">
                  <div style="font-style: italic; color: #777777">
                      For any assistance or questions while accessing your account, please do not hesitate to contact the support team at ${process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL}.
                  </div>
                  <p style="margin-top: 6px;">
                     © ${process.env.POWERED_BY}
                  </p>
              </footer>
          </div>
      </div>
        </body>
        
        </html>`;

    }


}