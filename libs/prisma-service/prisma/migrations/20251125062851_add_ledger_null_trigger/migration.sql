-- Create the function
CREATE OR REPLACE FUNCTION alert_ledger_null()
RETURNS trigger AS $$
BEGIN
    IF NEW."ledgerId" IS NULL THEN
        PERFORM pg_notify('ledger_null', json_build_object(
            'agentId', NEW.id,
            'orgId', NEW."orgId",
            'timestamp', now()
        )::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER ledger_null_trigger
AFTER UPDATE ON org_agents
FOR EACH ROW
WHEN (NEW."ledgerId" IS NULL AND OLD."ledgerId" IS NOT NULL)
EXECUTE FUNCTION alert_ledger_null();
