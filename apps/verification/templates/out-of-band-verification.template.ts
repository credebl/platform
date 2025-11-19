export class OutOfBandVerification {

    public outOfBandVerification(email: string, orgName: string, deepLinkURL: string): string {
        try {
            return `<!DOCTYPE html>
      <html lang="en">
      
      <head>
          <title></title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style type="text/css">
            /* Mobile Styles */
            @media only screen and (max-width: 600px) {
                .desktop-button {
                    display: none !important;
                }
            }
    
            /* Desktop Styles */
            @media only screen and (min-width: 601px) {
                .mobile-button {
                    display: none !important;
                }
            }
        </style>
      </head>
      
      <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
          <div style="margin: auto; max-width: 450px; padding: 20px 30px; background-color: #FFFFFF; display:block;">
              <div style="display: block; text-align:center; background-color: white; padding-bottom: 20px;">
              <img src="${process.env.BRAND_LOGO}" alt="${process.env.PLATFORM_NAME} logo" style="max-width:100px" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
              </div>
              <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
          font-size: 15px; line-height: 24px;color: #00000;">
                  <p style="margin-top:0px">
                      Hello ${email},
                  </p>
                  <p>
                  <b>${orgName}</b>  has requested verification of your digital credential. To share requested credential kindly follow below steps:
                      <ul>
                          <li>Download the <b>${process.env.MOBILE_APP_NAME}</b> from  
                            <a href="${process.env.PLAY_STORE_DOWNLOAD_LINK}" target="_blank">Android Play Store</a> or
<a href="${process.env.IOS_DOWNLOAD_LINK}" target="_blank">iOS App Store.</a> (Skip, if already downloaded)
</li>
                          <li>Complete the onboarding process in ${process.env.MOBILE_APP}.</li>
                          <li>Open the “Share Credential” link below in this email <i>(This will open the link in the ${process.env.MOBILE_APP} App)</i></li>
                          <li>Tap the <b>"Share"</b>  button in ${process.env.MOBILE_APP} to share you credential data.</li>
                      </ul>
                      <div style="text-align: center; padding-bottom: 20px;">
                      <a clicktracking=off href="${deepLinkURL}"
                          class="mobile-button"
                          style="padding: 10px 20px 10px 20px;color: #fff;background: #124143;border-radius: 5px;text-decoration: none;">
                          Share Credential
                      </a>
                  </div>
                  
                   </p>
                   <p>
                     <b>Note:</b> Alternatively, you will find a <b>QR Code image attached</b> to this email. You can open the QR code on another device and scan the QR code using the ${process.env.MOBILE_APP} App on your mobile device. 
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

        } catch (error) {
        }
    }
}