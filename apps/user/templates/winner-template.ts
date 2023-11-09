export class WinnerTemplate {
    public getWinnerTemplate(attributes: object): string {
        try {
            return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Winner Template</title>
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="text-align: center; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); margin: 50px auto;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                    <h1 style="color: #28a745;">Congratulations, ${attributes}!</h1>
                    <p style="color: #333;">You're the ${attributes} of our contest.</p>
                </div>
            </body>
            </html>`;
        } catch (error) {
        }
    }
}
