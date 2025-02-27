-- Complete Reset and Configuration Script for Poll System with Multi-Question Support
-- This script will:
-- 1. Delete all existing tables and functions
-- 2. Create new schema with enhanced poll system supporting multiple questions per poll
-- 3. Set up proper user synchronization

-- Start transaction
BEGIN;

-- Disable triggers temporarily to avoid foreign key constraint issues
SET session_replication_role = 'replica';

--------------------------------------------------
-- PART 1: CLEAN UP EXISTING DATABASE OBJECTS
--------------------------------------------------

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all tables in the public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in the public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all sequences in the public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name 
              FROM information_schema.sequences 
              WHERE sequence_schema = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all functions in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ns.nspname AS schema, p.proname AS name, 
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.name) || '(' || r.args || ') CASCADE';
    END LOOP;
END $$;

--------------------------------------------------
-- PART 2: CREATE NEW SCHEMA WITH POLL SYSTEM
--------------------------------------------------

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
-- Explicitly set search_path to include public schema
SET search_path TO public, pg_catalog;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create necessary extensions (if not already created)
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Create handle_new_user_login function first (needed for the trigger)
CREATE OR REPLACE FUNCTION "public"."handle_new_user_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
 INSERT INTO public.users (id,email,user_name,avatar_url)
    VALUES (
      new.id,
      new.raw_user_meta_data ->>'email',
      new.raw_user_meta_data ->>'user_name',
      new.raw_user_meta_data ->>'avatar_url'
    );
    RETURN NEW;
end;
$$;

-- Create tables
SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "user_name" "text",
    "avatar_url" "text"
);

CREATE TABLE IF NOT EXISTS "public"."poll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "end_date" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL
);

-- New table for poll questions (new feature)
CREATE TABLE IF NOT EXISTS "public"."poll_question" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "position" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."poll_option" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "option" "text" NOT NULL,
    "question_id" "uuid" NOT NULL, -- Modified to reference question_id instead of poll_id
    "count" numeric DEFAULT '0'::numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."poll_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "option" "text" NOT NULL,
    "poll_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL, -- Added question_id
    "user_id" "uuid" NOT NULL
);

-- Set table ownership
ALTER TABLE "public"."users" OWNER TO "postgres";
ALTER TABLE "public"."poll" OWNER TO "postgres";
ALTER TABLE "public"."poll_question" OWNER TO "postgres";
ALTER TABLE "public"."poll_option" OWNER TO "postgres";
ALTER TABLE "public"."poll_log" OWNER TO "postgres";

-- Add primary keys and constraints
ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."poll"
    ADD CONSTRAINT "poll_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."poll_question"
    ADD CONSTRAINT "poll_question_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."poll_option"
    ADD CONSTRAINT "poll_option_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."poll_log"
    ADD CONSTRAINT "poll_log_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."poll"
    ADD CONSTRAINT "public_poll_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."poll_question"
    ADD CONSTRAINT "public_poll_question_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."poll_option"
    ADD CONSTRAINT "public_poll_option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."poll_question"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."poll_log"
    ADD CONSTRAINT "public_poll_log_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."poll_log"
    ADD CONSTRAINT "public_poll_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."poll_question"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."poll_log"
    ADD CONSTRAINT "public_poll_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Create the trigger to automatically sync auth users to public.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_login();

-- Create functions needed for multi-question poll system
CREATE OR REPLACE FUNCTION "public"."create_poll_with_questions"(
    "title" "text", 
    "end_date" timestamp without time zone, 
    "description" "text",
    "questions" jsonb -- JSON array of questions with their options
) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    poll_id UUID;
    question_id UUID;
    question_data jsonb;
    question_text text;
    question_position integer;
    option_text text;
BEGIN
    -- Insert poll record
    INSERT INTO poll (created_by, title, end_date, description)
    VALUES (auth.uid(), title, end_date, description)
    RETURNING id INTO poll_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to create poll.';
    END IF;
    
    -- Process each question
    FOR i IN 0..jsonb_array_length(questions) - 1 LOOP
        question_data := questions->i;
        question_text := question_data->>'question_text';
        question_position := i + 1;
        
        -- Insert question
        INSERT INTO poll_question (poll_id, question_text, position)
        VALUES (poll_id, question_text, question_position)
        RETURNING id INTO question_id;
        
        -- Process options for this question
        FOR j IN 0..jsonb_array_length(question_data->'options') - 1 LOOP
            option_text := (question_data->'options')->>j;
            
            -- Insert option
            INSERT INTO poll_option (question_id, option)
            VALUES (question_id, option_text);
        END LOOP;
    END LOOP;
    
    RETURN poll_id;
END;
$$;

-- For backward compatibility, update the original create_poll function to use the new schema
CREATE OR REPLACE FUNCTION "public"."create_poll"("title" "text", "end_date" timestamp without time zone, "options" "text"[], "description" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    poll_id UUID;
    question_id UUID;
    option_count INT;
    i INT;
BEGIN
    -- Counting the number of options
    option_count := array_length(options, 1);

    -- Checking if the number of options is less than 2
    IF option_count < 2 THEN
        RAISE EXCEPTION 'Number of options must be at least 2';
    END IF;

    -- Inserting poll record
    INSERT INTO poll (created_by, title, end_date, description)
    VALUES (auth.uid(), title, end_date, description)
    RETURNING id INTO poll_id;

    IF FOUND THEN
        -- Create a single question for the poll (for backward compatibility)
        INSERT INTO poll_question (poll_id, question_text, position)
        VALUES (poll_id, title, 1)
        RETURNING id INTO question_id;
        
        -- Insert options into poll_option table linked to the question
        FOR i IN 1..option_count LOOP
            INSERT INTO poll_option (question_id, option)
            VALUES (question_id, options[i]);
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Failed to create poll.';
    END IF;

    RETURN poll_id;
END;
$$;

-- Function to vote on a specific question's option
CREATE OR REPLACE FUNCTION "public"."vote_on_question"(
    "question_id" "uuid", 
    "option_text" "text"
) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    poll_id UUID;
    poll_end_date TIMESTAMP;
    new_count INT;
BEGIN
    -- Get poll_id and check if the poll is expired
    SELECT p.id, p.end_date INTO poll_id, poll_end_date
    FROM poll p
    JOIN poll_question pq ON p.id = pq.poll_id
    WHERE pq.id = question_id;
    
    -- Check if the poll is expired
    IF poll_end_date < NOW() THEN
        RAISE EXCEPTION 'Poll is expired and cannot be updated.';
    END IF;
    
    -- Check if the user has already voted on this question
    IF EXISTS (
        SELECT 1 FROM poll_log 
        WHERE question_id = vote_on_question.question_id AND user_id = auth.uid()
    ) THEN 
        RAISE EXCEPTION 'You have already voted on this question.';
    END IF;
    
    -- Update option count
    UPDATE poll_option
    SET count = count + 1
    WHERE question_id = vote_on_question.question_id AND option = option_text
    RETURNING 1 INTO new_count;
    
    -- Insert into poll_log
    IF (new_count > 0) THEN
        INSERT INTO poll_log (poll_id, question_id, option, user_id) 
        VALUES (poll_id, question_id, option_text, auth.uid());
    ELSE
        RAISE EXCEPTION 'Failed to update poll.';
    END IF;
END;
$$;

-- Update the original update_poll function to work with the new schema
CREATE OR REPLACE FUNCTION "public"."update_poll"("update_id" "uuid", "option_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    poll_end_date TIMESTAMP;
    question_id UUID;
    new_count INT;
BEGIN
    -- Get the end_date of the poll and the first question_id
    SELECT p.end_date, q.id INTO poll_end_date, question_id 
    FROM poll p
    JOIN poll_question q ON p.id = q.poll_id
    WHERE p.id = update_id
    ORDER BY q.position
    LIMIT 1;

    -- Check if the poll is expired
    IF poll_end_date < NOW() THEN
        RAISE EXCEPTION 'Poll is expired and cannot be updated.';
    END IF;

    -- Check if the poll has already been updated by checking the poll_log table
    IF EXISTS (
        SELECT 1 FROM poll_log 
        WHERE poll_id = update_id AND user_id = auth.uid() AND question_id = question_id
    ) THEN 
        RAISE EXCEPTION 'Poll has already been updated.';
    END IF;

    -- Update poll_option
    UPDATE poll_option
    SET count = count + 1
    WHERE question_id = question_id AND option = option_name
    RETURNING 1 INTO new_count;

    -- Insert into poll_log table if the update was successful
    IF (new_count > 0) THEN
        INSERT INTO poll_log (option, poll_id, question_id, user_id) 
        VALUES (option_name, update_id, question_id, auth.uid());
    ELSE
        RAISE EXCEPTION 'Failed to update poll.';
    END IF;
END;
$$;

-- Set function ownership
ALTER FUNCTION "public"."handle_new_user_login"() OWNER TO "postgres";
ALTER FUNCTION "public"."create_poll"("title" "text", "end_date" timestamp without time zone, "options" "text"[], "description" "text") OWNER TO "postgres";
ALTER FUNCTION "public"."create_poll_with_questions"("title" "text", "end_date" timestamp without time zone, "description" "text", "questions" jsonb) OWNER TO "postgres";
ALTER FUNCTION "public"."update_poll"("update_id" "uuid", "option_name" "text") OWNER TO "postgres";
ALTER FUNCTION "public"."vote_on_question"("question_id" "uuid", "option_name" "text") OWNER TO "postgres";

-- Create RLS policies
ALTER TABLE "public"."poll" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_option" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."poll_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Policies for poll table
CREATE POLICY "Enable read access for all users" ON "public"."poll" FOR SELECT USING (true);
CREATE POLICY "Enable insert for users who created" ON "public"."poll" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));
CREATE POLICY "Enable Update for users who created" ON "public"."poll" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));
CREATE POLICY "Enable Delete for users who created" ON "public"."poll" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));

-- Policies for poll_question table
CREATE POLICY "Enable read access for all users" ON "public"."poll_question" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."poll_question" FOR INSERT TO "authenticated" WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."poll" WHERE id = poll_id AND created_by = auth.uid())
);
CREATE POLICY "Enable update for poll creators" ON "public"."poll_question" FOR UPDATE TO "authenticated" USING (
    EXISTS (SELECT 1 FROM "public"."poll" WHERE id = poll_id AND created_by = auth.uid())
);
CREATE POLICY "Enable delete for poll creators" ON "public"."poll_question" FOR DELETE TO "authenticated" USING (
    EXISTS (SELECT 1 FROM "public"."poll" WHERE id = poll_id AND created_by = auth.uid())
);

-- Policies for poll_option table
CREATE POLICY "Enable read access for all users" ON "public"."poll_option" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."poll_option" FOR INSERT TO "authenticated" WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM "public"."poll_question" pq 
        JOIN "public"."poll" p ON pq.poll_id = p.id 
        WHERE pq.id = question_id AND p.created_by = auth.uid()
    )
);
CREATE POLICY "Enable Update for authenticated users" ON "public"."poll_option" FOR UPDATE TO "authenticated" USING (true);
CREATE POLICY "Enable delete for poll creators" ON "public"."poll_option" FOR DELETE TO "authenticated" USING (
    EXISTS (
        SELECT 1 
        FROM "public"."poll_question" pq 
        JOIN "public"."poll" p ON pq.poll_id = p.id 
        WHERE pq.id = question_id AND p.created_by = auth.uid()
    )
);

-- Policies for poll_log table
CREATE POLICY "Enable Insert for users who based on user_id" ON "public"."poll_log" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable Select for users who based on user_id" ON "public"."poll_log" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable Update for users who based on user_id" ON "public"."poll_log" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Enable Delete for users who based on user_id" ON "public"."poll_log" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Policies for users table
CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));
CREATE POLICY "Enable update for authenticated users only" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));
CREATE POLICY "Enable delete for authenticated users only" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));

-- Realtime publication setup
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."poll_option";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."poll_question";

-- Grant privileges
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

-- Grant privileges on functions
GRANT ALL ON FUNCTION "public"."handle_new_user_login"() TO "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."create_poll"("title" "text", "end_date" timestamp without time zone, "options" "text"[], "description" "text") TO "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."create_poll_with_questions"("title" "text", "end_date" timestamp without time zone, "description" "text", "questions" jsonb) TO "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."update_poll"("update_id" "uuid", "option_name" "text") TO "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."vote_on_question"("question_id" "uuid", "option_name" "text") TO "anon", "authenticated", "service_role";

-- Grant privileges on tables
GRANT ALL ON TABLE "public"."users" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."poll" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."poll_question" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."poll_option" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."poll_log" TO "anon", "authenticated", "service_role";

-- Default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

--------------------------------------------------
-- PART 3: SYNC EXISTING USERS
--------------------------------------------------

-- Function to sync existing auth users to public.users table
CREATE OR REPLACE FUNCTION sync_existing_auth_users() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id, raw_user_meta_data FROM auth.users)
    LOOP
        -- Skip if the user already exists in public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = r.id) THEN
            INSERT INTO public.users (id, email, user_name, avatar_url)
            VALUES (
                r.id,
                r.raw_user_meta_data->>'email',
                r.raw_user_meta_data->>'user_name',
                r.raw_user_meta_data->>'avatar_url'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync function
SELECT sync_existing_auth_users();

-- Drop the temporary function
DROP FUNCTION sync_existing_auth_users();

-- Reset settings
RESET ALL;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Schema setup complete.';
    RAISE NOTICE 'Checking for triggers on auth.users:';
END$$;

SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
SELECT COUNT(*) FROM public.users;
