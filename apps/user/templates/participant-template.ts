import { Attribute } from "../interfaces/user.interface";

export class ParticipantTemplate {
  public getParticipantTemplate(attributes: Attribute[]): string {
    try {
      const nameAttribute = attributes.find(attr => 'full_name' in attr);
      const countryAttribute = attributes.find(attr => 'country' in attr);
      const positionAttribute = attributes.find(attr => 'position' in attr);
      const issuedByAttribute = attributes.find(attr => 'issued_by' in attr);
      const categoryAttribute = attributes.find(attr => 'category' in attr);
      const dateAttribute = attributes.find(attr => 'issued_date' in attr);

      const name = nameAttribute ? nameAttribute['full_name'] : '';
      const country = countryAttribute ? countryAttribute['country'] : '';
      const position = positionAttribute ? positionAttribute['position'] : '';
      const issuedBy = issuedByAttribute ? issuedByAttribute['issued_by'] : '';
      const category = categoryAttribute ? categoryAttribute['category'] : '';
      const date = dateAttribute ? dateAttribute['issued_date'] : '';

      return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Certificate of Achievement</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #000000;">

                <div style="text-align: center; padding: 30px; background-color: #000000; border-radius: 12px; box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); margin: 50px auto; color: #ffffff;">
                    <div style="font-size: 64px; margin-bottom: 20px; color: #ffd700;">🏆</div>
                    <h1 style="color: #ffffff; margin-bottom: 15px; font-size: 32px;">Certificate of Achievement</h1>

                    <h2 style="color: #ffffff; margin-bottom: 15px; font-size: 24px;">${name}</h2>
                    <p style="color: #ffffff; margin-bottom: 30px; font-size: 18px;">has demonstrated outstanding performance and successfully completed the requirements for</p>

                    <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 28px;">Participant</h3>
                    <p style="color: #ffffff; margin-bottom: 15px; font-size: 18px;">Position: ${position}</p>
                    <p style="color: #ffffff; margin-bottom: 30px; font-size: 18px;">Issued by: ${issuedBy}</p>

                    <div style="border-top: 2px solid #ffffff; margin: 30px 0;"></div>

                    <p style="color: #ffffff; margin-top: 30px; font-size: 20px;">Country: ${country}</p>
                    <p style="color: #ffffff; font-size: 20px;">Category: ${category}</p>

                    <p style="color: #ffffff; margin-top: 30px; font-size: 20px;">Issued Date: ${date}</p>

                    <p style="color: #ffffff; margin-top: 30px; font-size: 24px;">Congratulations!</p>
                </div>

            </body>
            </html>`;
    } catch (error) {}
  }
}
