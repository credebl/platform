BEGIN;

-- Keep duplicate validation and index creation in the same write-exclusion window.
-- ACCESS SHARE would permit concurrent inserts, so it is not sufficient here.
LOCK TABLE "issued_oid4vc_credentials" IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE "status_list_allocation" IN SHARE ROW EXCLUSIVE MODE;

-- Fail before enforcing new invariants if legacy rows would violate them. We cannot
-- safely choose a credential allocation to delete because that changes revocation semantics.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "issued_oid4vc_credentials"
    GROUP BY "listId", "index"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create status-list slot uniqueness constraint: duplicate credential allocations exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "status_list_allocation"
    WHERE "isActive" = true
    GROUP BY "orgId", "issuerDid"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create active status-list constraint: multiple active lists exist for a tenant and issuer';
  END IF;
END $$;

-- Prevent two service replicas from persisting the same status-list slot.
CREATE UNIQUE INDEX "issued_oid4vc_credentials_listId_index_key"
ON "issued_oid4vc_credentials"("listId", "index");

-- There must be at most one active list for a tenant/issuer pair. Prisma does
-- not currently model partial indexes, so this invariant lives in SQL.
CREATE UNIQUE INDEX "status_list_allocation_one_active_per_issuer_key"
ON "status_list_allocation"("orgId", "issuerDid")
WHERE "isActive" = true;

COMMIT;
