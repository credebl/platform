import * as url from 'url';
export class URLUserEmailTemplate {
  public getUserURLTemplate(email: string, verificationCode: string): string {
    const endpoint = `${process.env.FRONT_END_URL}`;

    const apiUrl = url.parse(
      `${endpoint}/verify-email-success?verificationCode=${verificationCode}&email=${encodeURIComponent(email)}`
    );
    
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
          
          <div style="margin: auto; max-width: 450px; padding: 20px 30px; display:block;">
          <div style="display: block; text-align:center; background-color: white; padding-bottom: 20px; padding-top: 20px;">
                  <img src="${process.env.BRAND_LOGO}" alt="CREDEBL logo" style="max-width:100px" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
              </div>
              
            <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
              font-size: 15px; line-height: 24px;color: #00000;">
                  <p style="margin-top:0px">
                      Hello ${email},
                  </p>
                  <p>
                  We are excited to welcome you to the CREDEBL Platform. Your user account ${email} has been successfully created. 
                  </p><p>
                  To complete the verification process, please click on the "Verify" button or use the provided verification link below:
                   </p>

                  <div style="text-align: center; padding-bottom: 20px;">
                      <a clicktracking=off href="${validUrl}"
                          style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                          VERIFY
                      </a>
                      <p>Verification Link: <a clicktracking=off href="${validUrl}">${validUrl}</a></p>
                  </div>
                  
                  <hr style="border-top:1px solid #e8e8e8" />
                  <footer style="padding-top: 10px;">
                      <div style="font-style: italic; color: #777777">
                          For any assistance or questions while accessing your account, please do not hesitate to contact the support team at support@blockster.global. Our team will ensure a seamless onboarding experience for you.

                      </div>
                      <p style="margin-top: 6px;">
                         © Blockster Labs Pvt. Ltd.
                      </p>
                  </footer>
              </div>
          </div>
      </body>
      </html>`;

    } catch (error) {}
  }
}
