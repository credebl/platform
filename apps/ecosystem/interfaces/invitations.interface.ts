

export interface FetchInvitationsPayload { 
    ecosystemId: string;
    userId: string,
    pageNumber: number;
    pageSize: number;
    search: string 
}