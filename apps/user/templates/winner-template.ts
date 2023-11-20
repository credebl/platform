import { Attribute } from '../interfaces/user.interface';

export class WinnerTemplate {
  findAttributeByName(attributes: Attribute[], name: string): Attribute {
    return attributes.find((attr) => name in attr);
  }

  async getWinnerTemplate(attributes: Attribute[]): Promise<string> {
    try {
      const [name, country, position, issuedBy, category, date] = await Promise.all(attributes).then((attributes) => {
        const name = this.findAttributeByName(attributes, 'full_name')?.full_name ?? '';
        const country = this.findAttributeByName(attributes, 'country')?.country ?? '';
        const position = this.findAttributeByName(attributes, 'position')?.position ?? '';
        const issuedBy = this.findAttributeByName(attributes, 'issued_by')?.issued_by ?? '';
        const category = this.findAttributeByName(attributes, 'category')?.category ?? '';
        const date = this.findAttributeByName(attributes, 'issued_date')?.issued_date ?? '';
        return [name, country, position, issuedBy, category, date];
      });
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate of Achievement</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #000000;
              }
      
              .certificate-container {
                  text-align: center;
                  padding: 30px;
                  background-color: #000000;
                  border-radius: 12px;
                  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                  margin: 50px auto;
                  color: #ffffff;
              }
      
              .certificate-container h1 {
                  color: #ffffff;
                  margin-bottom: 15px;
                  font-size: 32px;
              }
      
              .certificate-container h2 {
                  color: #ffffff;
                  margin-bottom: 15px;
                  font-size: 24px;
              }
      
              .certificate-container h3 {
                  color: #ffffff;
                  margin-bottom: 15px;
                  font-size: 28px;
              }
      
              .certificate-container p {
                  color: #ffffff;
                  margin-bottom: 15px;
                  font-size: 18px;
              }
      
              .certificate-container p:last-child {
                  margin-top: 15px;
              }
      
              .certificate-container div {
                  border-top: 2px solid #ffffff;
                  margin: 30px 0;
              }
          </style>
      </head>
      <body>
          <div class="certificate-container">
              <div style="font-size: 64px; margin-bottom: 20px; color: #ffd700;">🏆</div>
              <h1>Certificate of Achievement</h1>
      
              <h2>${name}</h2>
              <p>has demonstrated outstanding performance and successfully completed the requirements for</p>
      
              <h3>Winner</h3>
              <p>Position: ${position}</p>
              <p>Issued by: ${issuedBy}</p>
      
              <div></div>
      
              <p>Country: ${country}</p>
              <p>Category: ${category}</p>
      
              <p>Issued Date: ${date}</p>
      
              <p style="font-size: 24px;">Congratulations!</p>
          </div>
      </body>
      </html>`;
    } catch {}
  }
}
