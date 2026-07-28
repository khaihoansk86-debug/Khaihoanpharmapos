-- 067_revoke_anon_direct_table_writes.sql
-- First lockdown stage: the public frontend key may still read the catalog and
-- call the temporary login/bot RPCs, but it can no longer mutate tables
-- directly. Signed-in employees retain their authenticated table privileges.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON ALL TABLES IN SCHEMA public
    FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLES
    FROM anon;
