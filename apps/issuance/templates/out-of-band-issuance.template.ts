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
              <div style="display: block; text-align:center;" >
              <img src="${process.env.BRAND_LOGO}" alt="${process.env.PLATFORM_NAME} logo" style="max-width:100px; background: white; padding: 5px;border-radius: 5px;" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
              </div>
              <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
              font-size: 15px; line-height: 24px;color: #00000;">
                  <p style="margin-top:0px">
                      Hello ${email},
                  </p>
                  <p>
                  <b>${orgName}</b> has initiated issuance of your digital credential to you.
                  
                  To acknowledge and access your credential, kindly proceed with following steps:
                      <ul>
                          <li>Download the <b>${process.env.MOBILE_APP_NAME}</b> from  
                            <a href="${process.env.PLAY_STORE_DOWNLOAD_LINK}" target="_blank">Android Play Store</a> or
<a href="${process.env.IOS_DOWNLOAD_LINK}" target="_blank">iOS App Store.</a> (Skip, if already downloaded)
</li>
                          <li>Complete the onboarding process in ${process.env.MOBILE_APP}.</li>
                          <li>Open the “Accept Credential” link below in this email <i>(This will open the link in the ${process.env.MOBILE_APP} App)</i></li>
                          <li><b>Accept</b> the Credential in ${process.env.MOBILE_APP}.</li>
                          <li>Check <b>"Credentials"</b> tab in ${process.env.MOBILE_APP} to view the issued credential.</li>
                      </ul>
                      <div style="text-align: center; padding-bottom: 20px;">
                      <a clicktracking=off href="${agentEndPoint}"
                          style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                          Accept Credential
                      </a>
                  </div>
                  
                   </p>
                   <p>
                     <b>Note:</b> If the above steps do not work for you, please open the <b>attached QR Code image</b> in this email on another device, and scan the QR code using the ${process.env.MOBILE_APP_NAME} on your mobile device. 
                    <u> The QR Code is single-use.</u>
                   </p>
                  
                   
                  <hr style="border-top:1px solid #e8e8e8" />
                  <footer style="padding-top: 20px;">
                     
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
    } catch (error) {}
  }
}
