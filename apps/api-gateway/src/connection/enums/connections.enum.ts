export enum Connections {
    start = 'start',
    invitationSent = 'invitation-sent',
    invitationReceived = 'invitation-received',
    requestSent = 'request-sent',
    declined = 'decliend',
    requestReceived = 'request-received',
    responseSent = 'response-sent',
    responseReceived = 'response-received',
    complete = 'complete',
    abandoned = 'abandoned'
}

export declare enum HandshakeProtocol {
    Connections = "https://didcomm.org/connections/1.0",
    DidExchange = "https://didcomm.org/didexchange/1.0"
}