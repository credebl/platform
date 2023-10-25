export class OrganizationInviteTemplate {

    public sendInviteEmailTemplate(
        email: string,
        orgName: string,
        orgRolesDetails: object[],
        isUserExist = false
    ): string {

        const validUrl = isUserExist ? `${process.env.FRONT_END_URL}/authentication/sign-in` : `${process.env.FRONT_END_URL}/authentication/sign-up`;

        const message = isUserExist 
                        ? `You have already registered on platform, you can access the application depending on your role right away.
                         Please log in and accept the oranizations “INVITATION” and join the organization for specific roles`
            : `You have to register on the platform and then you can access the application. Accept the oranizations “INVITATION” and join the organization for specific roles`;

        const year: number = new Date().getFullYear();

        return `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <title></title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            
            <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
                <div style="margin: auto; width: 40%; padding: 20px 30px; background-color: #FFFFFF; display:block; word-break: break-word;">

                    <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
                    font-size: 15px; line-height: 24px;color: #5E5873;">
                        <p style="margin-top:0px">
                            Hello ${email},
                        </p>
                        <p>
                        Congratulations!
                        Your have been successfully invited to join.
                          <ul style="color:#005EFF; padding-left:10px; font-family: Montserrat;font-style: normal;
                        font-weight: normal;font-size: 14px;line-height: 21px;">
                            <li>Organization:  ${orgName}</li>
                            <li>Organization's Role: ${orgRolesDetails.map(roleObje => roleObje['name'])}</li>
                        </ul>
                        ${message}
                        <ul style="color:#005EFF; padding-left:10px; font-family: Montserrat;font-style: normal;
                        font-weight: normal;font-size: 14px;line-height: 21px;">
                            <li>Platform Link: <a href="${validUrl}">${validUrl}</a></li>
                        </ul>
                        <div style="text-align: center; padding-bottom: 20px;">
                            <a href="${validUrl}"
                                style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                                INVITATION
                            </a>
                        </div>
                        <p>In case you need any assistance to access your account, please contact <a href=${process.env.PLATFORM_WEB_URL}
                                target="_blank">${process.env.PLATFORM_NAME} Platform</a>
                        </p>
                        <hr style="border-top:1px solid #e8e8e8" />
                        <footer style="padding-top: 20px;">
                            <p style="margin-top: 2px;">
                                &reg; ${process.env.PLATFORM_NAME} ${year}, Powered by ${process.env.POWERED_BY}. All Rights Reserved.
                            </p>
                        </footer>
                    </div>
                </div>
            </body>
            
            </html>`;

    }


}