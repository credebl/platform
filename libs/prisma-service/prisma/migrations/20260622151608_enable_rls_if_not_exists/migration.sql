-- Dynamic block to enable RLS on all public tables where it's not already enabled
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT c.relname AS table_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'                          -- Regular tables only
          AND c.relrowsecurity = false                -- RLS is not currently enabled
          AND c.relname NOT LIKE '_prisma%'            -- Exclude Prisma metadata tables
    LOOP
        RAISE NOTICE 'Enabling RLS on table: %', tbl.table_name;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.table_name);
    END LOOP;
END
$$;
