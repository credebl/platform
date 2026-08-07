-- Prevent two service replicas from persisting the same status-list slot.
CREATE UNIQUE INDEX "issued_oid4vc_credentials_listId_index_key"
ON "issued_oid4vc_credentials"("listId", "index");

-- There must be at most one active list for a tenant/issuer pair. Prisma does
-- not currently model partial indexes, so this invariant lives in SQL.
CREATE UNIQUE INDEX "status_list_allocation_one_active_per_issuer_key"
ON "status_list_allocation"("orgId", "issuerDid")
WHERE "isActive" = true;
