export class OutOfBandIssuance {
  public outOfBandIssuance(email: string, orgName: string, agentEndPoint: string): string {
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
              <img src="${process.env.FRONT_END_URL}/images/CREDEBL_LOGO.png" alt="CREDEBL logo" style="max-width:100px" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
              </div>
              <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
              font-size: 15px; line-height: 24px;color: #5E5873;">
                  <p style="margin-top:0px">
                      Hello user,
                  </p>
                  <p>
                  The organization <b>${orgName}</b> has initiated issuance of your digital credential.
                  
                  To acknowledge and access your credential, kindly proceed with following steps:
                      <ul>
                          <li>Download the <b>ADEYA SSI</b>  
                            <a href="https://play.google.com/store/apps/details?id=id.credebl.adeya&pli=1" target="_blank">Android Play Store</a> /
<a href="https://apps.apple.com/in/app/adeya-ssi-wallet/id6463845498" target="_blank">iOS App Store</a>.</li>
                          <li>Complete the onboarding process.</li>
                          <li>Open the link provided in the ADEYA SSI App.</li>
                          <li>Accept the Credential.</li>
                          <li>Check <b>"Credentials"</b> tab in the ADEYA SSI App to view the issued Credential.</li>
                      </ul>
                      <div style="text-align: center; padding-bottom: 20px;">
                      <a clicktracking=off href="${agentEndPoint}"
                          style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                          Accept Credential
                      </a>
                  </div>
                  
                   </p>
                   <p>
                     <b>Note:</b> If the above steps do not work for you, please open the <b>attached QR Code image</b> on another device, and scan the QR code using the ADEYA SSI App from your mobile device.
                     The QR Code is single-use.
                   </p>
                   
                   <hr/>
                   <p>
                    If you need help, don't hesitate to reach out to our dedicated support team at <i>support@blockster.global</i>.   
                   </p>

                  <hr style="border-top:1px solid #e8e8e8" />
                  <footer style="padding-top: 20px;">
                     
                      <p style="margin-top: 2px;">
                          CREDEBL - by Blockster Labs Pvt. Ltd.
                      </p>
                  </footer>
              </div>
          </div>
      </body>
      </html>`;
    } catch (error) {}
  }
}
