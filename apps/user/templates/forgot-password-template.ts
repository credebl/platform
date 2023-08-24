import * as url from 'url';

export class UserForgotPasswordTemplate {

    public getUserForgotPasswordTemplate(email: string, verificationCode: string): string {
        const endpoint = `${process.env.FRONT_END_URL}`;
        const year: number = new Date().getFullYear();

        const apiUrl = url.parse(`${endpoint}/reset-forgot-password?verificationCode=${verificationCode}&email=${encodeURIComponent(email)}`);
      
        const validUrl = apiUrl.href.replace('/:', ':');
        try {
            return `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <title></title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            
            <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
                <div style="margin: auto; width: 40%; padding: 20px 30px; background-color: #FFFFFF; display:block;">
                    <div style="display: block; text-align:center;">
                        <img src="${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/CREDEBL_Logo.png" alt="Credebl Logo">
                    </div>
                    <div style="display: block; text-align:center;">
                        <img src="${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/verification-image.png" alt="verification Image" style="max-width:100%;">
                        </div>
                    <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
                    font-size: 15px; line-height: 24px;color: #5E5873;">
                        <p style="margin-top:0px">
                            Hello ${email} ,
                        </p>
                        <p>
                        You have received a link to reset your password.
                        Please use the link below or click on the “Reset” button to set your new password.
                         </p>
                        <p>Your account details as follows,</p>
                        <ul style="color:#005EFF; padding-left:10px; font-family: Montserrat;font-style: normal;
                        font-weight: normal;font-size: 14px;line-height: 21px;">
                            <li>Username/Email: ${email}</li>
                            <li>Password Set Link: <a clicktracking=off href="${validUrl}">${validUrl}</a></li>
                        </ul>
                        <div style="text-align: center; padding-bottom: 20px;">
                            <a clicktracking=off href="${validUrl}"
                                style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                                RESET
                            </a>
                        </div>
                        <p>In case you need any assistance to access your account, please contact <a href="https://blockster.global"
                                target="_blank">Blockster Labs</a>
                        </p>
                        <hr style="border-top:1px solid #e8e8e8" />
                        <footer style="padding-top: 20px;">
                            <div>
                                <a href="http://www.facebook.com/">
                                    <img src="https://assets.codepen.io/210284/facebook_1.png" width="18" height="18" alt="f"
                                        style="color:#cccccc; padding-right: 10px;"></a>
                                <a href="http://www.twitter.com/"><img src="https://assets.codepen.io/210284/twitter_1.png"
                                        width="18" height="18" alt="t" style="color:#cccccc;"></a>
                            </div>
                            <p style="margin-top: 2px;">
                                &reg; CREDEBL ${year}, Powered by Blockster Labs. All Rights Reserved.
                            </p>
                        </footer>
                    </div>
                </div>
            </body>
            </html>`;

        } catch (error) {
        }
    }
}

