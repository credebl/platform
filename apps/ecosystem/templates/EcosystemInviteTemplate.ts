export class EcosystemInviteTemplate {

    public sendInviteEmailTemplate(
        email: string,
        ecosystemName: string
    ): string {

        const validUrl = `${process.env.FRONT_END_URL}/authentication/sign-in`;

        const message = `You have been invited to join the ecosystem so please log in and accept the ecosystem “INVITATION” and participate in the ecosystem`;
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
                            <li>Ecosystem:  ${ecosystemName}</li>
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
                        <p>In case you need any assistance to access your account, please contact <a href="https://credebl.in/"
                                target="_blank">CREDEBL Platform</a>
                        </p>
                        <hr style="border-top:1px solid #e8e8e8" />
                        <footer style="padding-top: 20px;">
                            <p style="margin-top: 2px;">
                                &reg; CREDEBL ${year}, Powered by Blockster Labs. All Rights Reserved.
                            </p>
                        </footer>
                    </div>
                </div>
            </body>
            
            </html>`;

    }


}