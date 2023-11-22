export class OutOfBandIssuance {

    public outOfBandIssuance(email: string, orgName: string, agentEndPoint:string): string {
        try {
            return `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <title></title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            
            <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
                <div style="margin: auto; max-width: 450px; padding: 20px 30px; background-color: #FFFFFF; display:block;">
                    <div style="display: block; text-align:center;">
                    <img src="https://credebl-dev-user-certificate.s3.ap-south-1.amazonaws.com/certificates/CREDEBL_LOGO.svg" alt="CREDEBL logo" style="max-width:100px" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
                    </div>
                    <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
                    font-size: 15px; line-height: 24px;color: #5E5873;">
                        <p style="margin-top:0px">
                            Hello user ,
                        </p>
                        <p>
                        The organization ${orgName} has requested your assistance in issuing your credentials. 
                        We are delighted to notify you that a credential document has been successfully issued to you. To acknowledge and access the document, kindly proceed with the instructions outlined below:
                            <ul>
                                <li>Download the ADEYA Wallet from the Play Store.</li>
                                <li>Create an Account.</li>
                                <li>Scan the QR code provided below.</li>
                                <li>Accept the Credential Document request.</li>
                                <li>Check your wallet to access the issued Credential Document.</li>
                            </ul>
                            <div style="text-align: center; padding-bottom: 20px;">
                            <a clicktracking=off href="${agentEndPoint}"
                                style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                                Accept Credential
                            </a>
                        </div>
                            Should you require any assistance or have questions, feel free to contact our dedicated support team.
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
                                Best Regards,The CREDEBL Team
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