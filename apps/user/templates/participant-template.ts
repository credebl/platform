export class ParticipantTemplate {

    public getParticipantTemplate(): string {
  
      try {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="styles.css">
            <title>Participant Template</title>
        </head>
        <body>
            <div class="participant-container">
                <h1 class="participant-name">John Doe</h1>
                <p class="participant-info">Participant ID: 12345</p>
                <p class="participant-info">Email: john@example.com</p>
                <button class="participant-button">View Profile</button>
            </div>
        </body>
        </html>`;
       
      } catch (error) {
      }
    }
  }