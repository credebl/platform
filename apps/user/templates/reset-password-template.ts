import * as url from 'url';
export class URLUserResetPasswordTemplate {
  public getUserResetPasswordTemplate(email: string, verificationCode: string): string {
    const endpoint = `${process.env.FRONT_END_URL}`;

    const apiUrl = url.parse(
      `${endpoint}/reset-password?verificationCode=${verificationCode}&email=${encodeURIComponent(email)}`
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
          
          <div style="margin: auto; max-width: 450px; padding: 20px 30px; background-color: #FFFFFF; display:block;">
          <div style="display: block; text-align:center;">
                  <img src="${process.env.BRAND_LOGO}" alt="${process.env.PLATFORM_NAME} logo" style="max-width:100px; background: white; padding: 5px;border-radius: 5px;" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
              </div>
              
            <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
              font-size: 15px; line-height: 24px;color: #00000;">
                  <p style="margin-top:0px">
                      Hello ${email},
                  </p>
                  <p>
                  A password reset request has been received for your ${process.env.PLATFORM_NAME} platform account. To reset your password, please click on the following link:
                  </p>               

                  <div style="text-align: center; padding-bottom: 20px;">
                      <a clicktracking=off href="${validUrl}"
                          style="padding: 10px 20px 10px 20px;color: #fff;background: #1F4EAD;border-radius: 5px;text-decoration: none;">
                          RESET
                      </a>
                      <p>Password Reset Link: <a clicktracking=off href="${validUrl}">${validUrl}</a></p>
                  </div>
                  
                  <hr style="border-top:1px solid #e8e8e8" />
                  <footer style="padding-top: 10px;">
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
