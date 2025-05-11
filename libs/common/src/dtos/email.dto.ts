export class EmailDto {
    emailFrom: string;
    emailTo: string;
    emailSubject: string;
    emailText: string;
    emailHtml: string;
    emailAttachments?: AttachmentJSON[];
}

interface AttachmentJSON {
    content: string;
    filename: string;
    contentType: string;
    type?: string;
    disposition?: string;
    content_id?: string;
  }