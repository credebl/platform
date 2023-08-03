export class OnBoardVerificationRequest {

  public getOnBoardRequest(orgName: string, email: string): string {
    const year: number = new Date().getFullYear();

    try {
      return `<!DOCTYPE html>
            <html lang="en">
              <head>
                <title>WELCOME TO CREDEBL</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </head>
            
              <body style="margin: 0px; padding: 0px; background-color: #f9f9f9">
                <div
                  style="
                    margin: auto;
                    width: 40%;
                    padding: 20px 30px;
                    background-color: #ffffff;
                    display: block;
                  "
                >
                  <div style="display: block; text-align: center">
                    <img
                      src="${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/CREDEBL_Logo.png"
                      alt="Credebl Logo"
                    />
                  </div>
                  <div style="display: block; text-align: center">
                    <img
                      src="${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/invite.png"
                      alt="Invite Image"
                      style="max-width: 100%"
                    />
                  </div>
                  <div
                    style="
                      font-family: Montserrat;
                      font-style: normal;
                      font-weight: 500;
                      font-size: 15px;
                      line-height: 24px;
                      color: #5e5873;
                    "
                  >
                    <p>Hello ${email},</p>
                    <p>The ${orgName} has been sent an onboard request</p>
                    <p>
                      In case you need any assistance to access your account, please contact
                      <a href="https://blockster.global" target="_blank">Blockster Labs</a>
                    </p>
                    <hr style="border-top: 1px solid #e8e8e8" />
                    <footer style="padding-top: 20px">
                      <div>
                        <a href="http://www.facebook.com/">
                          <img
                            src="https://assets.codepen.io/210284/facebook_1.png"
                            width="18"
                            height="18"
                            alt="f"
                            style="color: #cccccc; padding-right: 10px"
                        /></a>
                        <a href="http://www.twitter.com/"
                          ><img
                            src="https://assets.codepen.io/210284/twitter_1.png"
                            width="18"
                            height="18"
                            alt="t"
                            style="color: #cccccc"
                        /></a>
                      </div>
                      <p style="margin-top: 2px">
                        &reg; CREDEBL ${year}, Powered by Blockster Labs. All Rights Reserved.
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