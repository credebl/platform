import { escapeHtml } from '@credebl/common/common.utils';

export class CreateEcosystemInviteTemplate {
  public sendInviteEmailTemplate(isUserExist: boolean): string {
    const requiredEnvVars = [
      'FRONT_END_URL',
      'PLATFORM_NAME',
      'BRAND_LOGO',
      'PUBLIC_PLATFORM_SUPPORT_EMAIL',
      'POWERED_BY'
    ];

    const brandLogo = escapeHtml(process.env.BRAND_LOGO);
    const platformName = escapeHtml(process.env.PLATFORM_NAME);
    const supportEmail = escapeHtml(process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL);
    const poweredBy = escapeHtml(process.env.POWERED_BY);
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (0 < missingVars.length) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const frontEndUrl = escapeHtml(process.env.FRONT_END_URL);
    const validUrl = isUserExist ? `${frontEndUrl}/sign-in` : `${frontEndUrl}/sign-up`;

    const message = isUserExist ? `` : `To get started, kindly register on ${platformName} platform using this link:`;

    const secondaryMessage = isUserExist ? `Please log in to the platform to start creating your ecosystem.` : ``;

    const buttonText = isUserExist ? `Create Ecosystem` : `Register on ${platformName}`;

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
        Hello,
      </p>

      <p>
        You have been granted access by the platform admin to create a new ecosystem on <strong>${platformName}</strong>. ${secondaryMessage}
        
      </p>

      <p>${message}</p>

      <div style="text-align: center;">
        <a clicktracking="off"
           href="${validUrl}"
           style="padding: 10px 20px;
                  color: #fff;
                  background: #1F4EAD;
                  border-radius: 5px;
                  text-decoration: none;">
          ${buttonText}
        </a>
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
