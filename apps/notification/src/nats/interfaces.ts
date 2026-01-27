export interface INatsEventMessage {
  event: string;
  sessionId: string;
  timestamp: string;
  senderCode: string;
}

export interface INatsUserRequestData {
  did: string;
  sessions: {
    sessionId: string;
    orgCode: string;
  }[];
}
