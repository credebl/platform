export class OrganizationInviteTemplate {

    public sendInviteEmailTemplate(
        email: string,
        orgName: string,
        orgRolesDetails: object[],
        firstName: string,
        isUserExist: boolean
    ): string {

        const validUrl = isUserExist ? `${process.env.FRONT_END_URL}/authentication/sign-in` : `${process.env.FRONT_END_URL}/authentication/sign-up`;

        const message = isUserExist 
                        ? `Please accept the invitation using the following link:`
            : `To get started, kindly register on ${process.env.PLATFORM_NAME} platform using this link:`;

        const secondMessage = isUserExist 
                        ? `After successful login into ${process.env.PLATFORM_NAME} click on "Accept Organization Invitation" link on your dashboard.`
            : `After successful registration, you can log in to the platform and click on “Accept Organization Invitation” on your dashboard.`;
        
            const Button = isUserExist ? `Accept Organization Invitation` : `Register on ${process.env.PLATFORM_NAME}`;
          
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
                  Hello ${email},
              </p>
              <p>
              ${firstName} has invited you to join “${orgName}” as a member.

              </p><ul>
              <li><strong>Organization:</strong> ${orgName}</li>
               <li><strong>Role:</strong> Member</li>
               </ul>
               <p>
                   ${message}
               </p>

              <div style="text-align: center;">
                  <a clicktracking=off href="${validUrl}"
                      style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                      
                     ${Button} 
                  </a>
                  <p>Verification Link: <a clicktracking=off href="${validUrl}">${validUrl}</a></p>
              </div>
              <p>${secondMessage}</p>
              <hr style="border-top:1px solid #e8e8e8" />
              <footer style="padding-top: 10px;">
                  <div style="font-style: italic; color: #777777">
                      For any assistance or questions while accessing your account, please do not hesitate to contact the support team at ${process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL}. Our team will ensure a seamless onboarding experience for you.

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