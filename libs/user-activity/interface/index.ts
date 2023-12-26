export interface IUsersActivity {
    id: string,
    orgId: string,
    userId: string,
    details: string,
    action: string,
    lastChangedDateTime: Date,
    createDateTime: Date,
}