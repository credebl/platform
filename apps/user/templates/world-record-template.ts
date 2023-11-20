export class WorldRecordTemplate {
  public getWorldReccordTemplate(): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="styles.css">
            <title>World Record</title>
        </head>
        <body>
            <div class="winner-container">
                <div class="trophy-icon">
                    🏆
                </div>
                <h1 class="winner-message">Congratulations!</h1>
                <p class="winner-details">You're the Winner of our contest.</p>
            </div>
        </body>
        </html>`;
  }
}
