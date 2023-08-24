export class OutOfBandIssuance {

    public outOfBandIssuance(email: string, outOfBandIssuanceQrCode: string): string {
        const year: number = new Date().getFullYear();
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
                        Your user account ${email} has been successfully created on ${process.env.PLATFORM_NAME}. In order to enable access for your account,
                         we need to verify your email address. Please use the link below or click on the “Verify” button to enable access to your account.
                         </p>
                        <p>Your issuance details,</p>
                        <ul style="color:#005EFF; padding-left:10px; font-family: Montserrat;font-style: normal;
                        font-weight: normal;font-size: 14px;line-height: 21px;">
                            <li>Username/Email: ${email}</li>
                          </p>
                        </ul>
                        <p style="display: block; text-align: center">
                            <img src="${outOfBandIssuanceQrCode}" alt="QR Code">
                        </p>
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