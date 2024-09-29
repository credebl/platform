export class OutOfBandIssuance {
    public outOfBandIssuance(
      email: string,
      orgName: string,
      deepLinkURL: string,
      platformName?: string,
      organizationLogoUrl?: string
    ): string {
      
      const logoUrl = organizationLogoUrl || process.env.BRAND_LOGO;
      const platform = platformName || process.env.PLATFORM_NAME;
      const poweredBy = platformName || process.env.POWERED_BY;
  
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
                <div style="display: block; text-align:center;" >
                <img src="${logoUrl}" alt="${platform} logo" style="max-width:100px; background: white; padding: 5px;border-radius: 5px;" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
                </div>
                <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
                font-size: 15px; line-height: 24px;color: #00000;">
                    <p style="margin-top:0px">
                        Hello ${email},
                    </p>
                    <p>
                    We’re pleased to inform you that the <b>${orgName}</b> has issued your SevisPass digital credentials. To access them, please follow these steps:
                        <ul>
                            <li>Click the "Accept Credential" link below. This will open the link in the ${process.env.MOBILE_APP} app.</li>
                            <li><b>Accept</b> the Credential in ${process.env.MOBILE_APP}.</li>
                            <li>Navigate to the "Credentials" tab in ${process.env.MOBILE_APP} to view your issued credential.</li>
                        </ul>
                        <div style="text-align: center; padding-bottom: 20px;">
                        <a clicktracking=off href="${deepLinkURL}"
                            class="mobile-button"
                            style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                            Accept Credential
                        </a>
                        <a clicktracking=off href="${process.env.MOBILE_APP_DOWNLOAD_URL}"
                            class="desktop-button"
                            style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                            Download App
                        </a>
                    </div>
                    
                     </p>
                     <p>
                     <b>Important:</b> If you encounter any issues, you can open the attached QR code on another device and scan it using the ${process.env.MOBILE_APP} app. Please note that the <u>QR code is single-use.</u>
                     </p>
                    
                    <hr style="border-top:1px solid #e8e8e8" />
                    <footer style="padding-top: 20px;">
                       
                        <div style="font-style: italic; color: #777777">
                        If you have any questions or need assistance, please don’t hesitate to contact our support team at ${process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL}. We’re here to help ensure a smooth onboarding experience for you.
  
                        Sincerely,
                        Department of Information and Communications Technology
                    </div>
                    <p style="margin-top: 6px;">
                       © ${poweredBy}
                    </p>
                    </footer>
                </div>
            </div>
        </body>
        </html>`;
      } catch (error) {}
    }
  }
  