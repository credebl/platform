import { escapeHtml } from '@credebl/common/common.utils';

export class InviteMemberToEcosystem {
  public sendInviteEmailTemplate(email: string, ecosystemName: string): string {
    const requiredEnvVars = ['BRAND_LOGO', 'PLATFORM_NAME', 'PUBLIC_PLATFORM_SUPPORT_EMAIL', 'POWERED_BY'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (0 < missingVars.length) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const safeEmail = escapeHtml(email);
    const safeEcosystemName = escapeHtml(ecosystemName);
    const brandLogo = escapeHtml(process.env.BRAND_LOGO);
    const platformName = escapeHtml(process.env.PLATFORM_NAME);
    const supportEmail = escapeHtml(process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL);
    const poweredBy = escapeHtml(process.env.POWERED_BY);
    return `<!DOCTYPE html>
              <html lang="en">
              <head>  
                <title></title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
              </head>

              <body style="margin: 0px; padding:0px; background-color:#F9F9F9;">
                <div style="margin: auto; max-width: 450px; padding: 20px 30px; background-color: #FFFFFF; display:block;">

                <div style="display: block; text-align:center; background-color: white; padding-bottom: 20px; padding-top: 20px;">
                            <img src="${brandLogo}" alt="${platformName} logo" style="max-width:100px; background: white; padding: 5px;border-radius: 5px;" width="100%" height="fit-content" class="CToWUd" data-bit="iit">
                        </div>

                  <div style="font-family: Montserrat; font-style: normal; font-weight: 500;
                    font-size: 15px; line-height: 24px; color: #000000;">

                    <p style="margin-top:0px;">
                      Hello ${safeEmail},
                    </p>

                    <p>You have been invited to join the <strong>${safeEcosystemName}</strong> ecosystem on <strong>${platformName}</strong> platform. Kindly log in to Studio and respond to the invitation.</p>
                    </div>

                    <hr style="border-top:1px solid #e8e8e8" />

                    <footer style="padding-top: 10px;">
                      <div style="font-style: italic; color: #777777">
                        For any assistance or questions while accessing your account, please do not hesitate to contact the support team at
                        ${supportEmail}. Our team will ensure a seamless onboarding experience for you.
                      </div>

                      <p style="margin-top: 6px;">
                        © ${poweredBy}
                      </p>
                    </footer>

                  </div>
                </div>
              </body>
              </html>`;
  }
}
