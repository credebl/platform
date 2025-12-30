import { escapeHtml } from '@credebl/common/common.utils';

export class CreateEcosystemInviteTemplate {
  public sendInviteEmailTemplate(email: string, inviterName: string, isUserExist: boolean): string {
    const validUrl = isUserExist ? `${process.env.FRONT_END_URL}/sign-in` : `${process.env.FRONT_END_URL}/sign-up`;

    const message = isUserExist
      ? `Please accept the ecosystem invitation using the link below:`
      : `To get started, please register on ${process.env.PLATFORM_NAME} using the link below:`;

    const secondMessage = isUserExist
      ? `After logging in, click on “Accept Ecosystem Invitation” from your dashboard to proceed.`
      : `After successful registration, log in and click on “Accept Ecosystem Invitation” from your dashboard.`;

    const buttonText = isUserExist ? `Accept Ecosystem Invitation` : `Register on ${process.env.PLATFORM_NAME}`;

    const safeEmail = escapeHtml(email);
    const safeInviterName = escapeHtml(inviterName);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <title></title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>

<body style="margin:0;padding:0;background-color:#F9F9F9;">
  <div style="margin:auto;max-width:450px;padding:20px 30px;background-color:#FFFFFF;display:block;">

    <div style="text-align:center;padding:20px 0;">
      <img src="${process.env.BRAND_LOGO}"
           alt="${process.env.PLATFORM_NAME} logo"
           style="max-width:100px;padding:5px;border-radius:5px;" />
    </div>

    <div style="font-family:Montserrat, Arial, sans-serif;
                font-size:15px;
                line-height:24px;
                color:#000;">
      
      <p>Hello ${safeEmail},</p>

      <p>
        ${safeInviterName} has invited you to <strong>create a new ecosystem</strong>
        on <strong>${process.env.PLATFORM_NAME}</strong>.
      </p>

      <ul>
        <li><strong>Access Type:</strong> Ecosystem Creation</li>
        <li><strong>Platform:</strong> ${process.env.PLATFORM_NAME}</li>
      </ul>

      <p>${message}</p>

      <div style="text-align:center;margin:20px 0;">
        <a clicktracking="off"
           href="${validUrl}"
           style="padding:10px 20px;
                  color:#FFFFFF;
                  background:#1F4EAD;
                  border-radius:5px;
                  text-decoration:none;
                  display:inline-block;">
          ${buttonText}
        </a>

        <p style="margin-top:10px;font-size:13px;">
          Verification Link:
          <a clicktracking="off" href="${validUrl}">${validUrl}</a>
        </p>
      </div>

      <p>${secondMessage}</p>

      <hr style="border-top:1px solid #e8e8e8;margin:24px 0;" />

      <footer style="font-style:italic;color:#777;font-size:13px;">
        <p>
          For any assistance, please contact us at
          <a href="mailto:${process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL}">
            ${process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL}
          </a>.
        </p>
        <p>© ${process.env.POWERED_BY}</p>
      </footer>

    </div>
  </div>
</body>
</html>`;
  }
}
