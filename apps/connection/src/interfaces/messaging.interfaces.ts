export interface IValidResponses {
  text: string;
}

export interface IQuestionPayload {
  detail: string;
  validResponses: IValidResponses[];
  question: string;
  orgId?: string;
  connectionId?: string;
  tenantId?: string;
}

export interface IBasicMessage {
  content: string;
  orgId?: string;
  connectionId?: string;
  tenantId?: string;
}
