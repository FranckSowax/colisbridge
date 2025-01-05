

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."destination_country_enum" AS ENUM (
    'Gabon',
    'Togo',
    'Côte d''Ivoire',
    'France',
    'Dubaï'
);


ALTER TYPE "public"."destination_country_enum" OWNER TO "postgres";


CREATE TYPE "public"."parcel_status" AS ENUM (
    'pending',
    'recu',
    'expedie',
    'receptionne',
    'termine'
);


ALTER TYPE "public"."parcel_status" OWNER TO "postgres";


CREATE TYPE "public"."parcel_status_enum" AS ENUM (
    'pending',
    'received',
    'shipped',
    'in_transit',
    'delivered'
);


ALTER TYPE "public"."parcel_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."shipping_type_enum" AS ENUM (
    'standard',
    'express',
    'maritime'
);


ALTER TYPE "public"."shipping_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'agent',
    'client'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_parcel_price"("p_country" "text", "p_shipping_type" "text", "p_weight" numeric, "p_cbm" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_price_rule record;
    v_total_price numeric;
    v_currency text;
BEGIN
    -- Récupération de la règle de prix appropriée
    SELECT *
    INTO v_price_rule
    FROM pricing_rules
    WHERE country_code = lower(p_country)
    AND shipping_type = lower(p_shipping_type)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Aucune règle de prix trouvée pour ce pays et ce type d''envoi'
        );
    END IF;

    -- Calcul du prix en fonction du type d'unité
    IF v_price_rule.unit_type = 'kg' AND p_weight IS NOT NULL THEN
        v_total_price := v_price_rule.price_per_unit * p_weight;
    ELSIF v_price_rule.unit_type = 'cbm' AND p_cbm IS NOT NULL THEN
        v_total_price := v_price_rule.price_per_unit * p_cbm;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Données de mesure invalides pour le type d''unité'
        );
    END IF;

    -- Retourne le résultat
    RETURN jsonb_build_object(
        'success', true,
        'total_price', v_total_price,
        'currency', v_price_rule.currency,
        'unit_price', v_price_rule.price_per_unit,
        'unit_type', v_price_rule.unit_type
    );
END;
$$;


ALTER FUNCTION "public"."calculate_parcel_price"("p_country" "text", "p_shipping_type" "text", "p_weight" numeric, "p_cbm" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dispute_on_parcel_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si le nouveau statut est 'litige' et l'ancien statut ne l'était pas
    IF NEW.status = 'litige' AND (OLD.status IS NULL OR OLD.status != 'litige') THEN
        -- Créer un nouveau litige
        INSERT INTO disputes (
            parcel_id,
            recipient_id,
            created_by,
            status,
            reason,
            description,
            priority,
            resolution_deadline
        ) VALUES (
            NEW.id,                                    -- parcel_id
            NEW.recipient_id,                          -- recipient_id
            NEW.created_by,                            -- created_by
            'pending',                                 -- status initial du litige
            'Litige signalé sur le colis',            -- reason par défaut
            'Litige créé automatiquement suite au changement de statut du colis', -- description
            'normal',                                  -- priority par défaut
            TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days' -- deadline par défaut (7 jours)
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_dispute_on_parcel_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.employees (auth_user_id, first_name, last_name)
    VALUES (NEW.id, '', '');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_parcel_dispute"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'litige' AND (OLD.status IS NULL OR OLD.status != 'litige') THEN
        INSERT INTO public.disputes (
            parcel_id,
            description,
            created_by,
            status,
            priority
        )
        VALUES (
            NEW.id,
            'Litige créé automatiquement suite au changement de statut du colis',
            NEW.created_by,
            'pending',
            'medium'
        )
        ON CONFLICT (parcel_id) 
        DO UPDATE SET
            updated_at = NOW(),
            status = 'pending'
        WHERE disputes.parcel_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_parcel_dispute"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_dashboard_metrics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."refresh_dashboard_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.created_by := auth.uid();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_recipient_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_recipient_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_recipient_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_recipient_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_dispute_recipient"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mise à jour du recipient depuis la table parcels
    NEW.recipient = (
        SELECT recipient_name
        FROM parcels
        WHERE id = NEW.parcel_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_dispute_recipient"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_parcel_photos"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mettre à jour les URLs des photos pour les colis qui n'en ont pas encore
    UPDATE public.parcels
    SET photo_urls = ARRAY[
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_1.jpg')::text,
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_2.jpg')::text,
        ('https://ayxltzvmpqxtyfvfotxd.supabase.co/storage/v1/object/public/parcel-photos/' || tracking_number || '_3.jpg')::text
    ]::text[]
    WHERE photo_urls IS NULL OR photo_urls = ARRAY[]::text[] OR photo_urls = '{}'::text[];

    -- Afficher les colis mis à jour
    RAISE NOTICE 'Photos synchronisées pour les colis';
END;
$$;


ALTER FUNCTION "public"."sync_parcel_photos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_disputes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_disputes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_parcel_recipient_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update recipient_name from recipients table
    SELECT name INTO NEW.recipient_name
    FROM recipients
    WHERE id = NEW.recipient_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_parcel_recipient_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_parcel_total_price"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    price_calc jsonb;
BEGIN
    -- Calcul du prix en fonction du type d'envoi
    price_calc := calculate_parcel_price(
        NEW.destination_country,
        NEW.shipping_type,
        NEW.weight,
        NEW.cbm
    );

    IF (price_calc->>'success')::boolean THEN
        NEW.total_price := (price_calc->>'total_price')::numeric;
        NEW.currency := price_calc->>'currency';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_parcel_total_price"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_statistics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    month_key TEXT;
    country_key TEXT;
BEGIN
    -- Get the month key in the format 'YYYY-MM'
    month_key := to_char(NEW.created_at, 'YYYY-MM');
    country_key := NEW.destination_country;

    -- If this is a status change to 'Terminé'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'Terminé' AND OLD.status != 'Terminé') THEN
        -- Update or create statistics record for the user
        INSERT INTO public.statistics (user_id, total_revenue, completed_revenue, total_parcels)
        VALUES (NEW.created_by, NEW.price, CASE WHEN NEW.status = 'Terminé' THEN NEW.price ELSE 0 END, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            total_revenue = statistics.total_revenue + NEW.price,
            completed_revenue = statistics.completed_revenue + NEW.price,
            total_parcels = statistics.total_parcels + 1,
            month_revenue = jsonb_set(
                COALESCE(statistics.month_revenue, '{}'::jsonb),
                array[month_key],
                COALESCE(statistics.month_revenue->month_key, '0')::jsonb + NEW.price::text::jsonb
            ),
            country_stats = jsonb_set(
                COALESCE(statistics.country_stats, '{}'::jsonb),
                array[country_key],
                jsonb_build_object(
                    'parcels', COALESCE((statistics.country_stats->country_key->>'parcels')::int, 0) + 1,
                    'revenue', COALESCE((statistics.country_stats->country_key->>'revenue')::decimal, 0) + NEW.price,
                    'completed_revenue', COALESCE((statistics.country_stats->country_key->>'completed_revenue')::decimal, 0) + NEW.price
                )
            ),
            updated_at = timezone('utc'::text, now());
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "address_line3" "text",
    "city" "text",
    "country" "text",
    "email" "text",
    "phone" "text",
    "logo_url" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."destination_countries" (
    "id" integer NOT NULL,
    "country_code" "text" NOT NULL,
    "country_name" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "currency_symbol" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."destination_countries" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."destination_countries_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."destination_countries_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."destination_countries_id_seq" OWNED BY "public"."destination_countries"."id";



CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "created_by" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "priority" character varying(20) NOT NULL,
    "status" character varying(20) NOT NULL,
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "disputes_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "disputes_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying])::"text"[])))
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "first_name" character varying(255),
    "last_name" character varying(255),
    "role_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(50) NOT NULL,
    "read" boolean DEFAULT false,
    "reference_id" "uuid",
    "reference_type" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "uuid" NOT NULL,
    "photo_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."parcel_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parcel_id" "uuid",
    "changed_by" "uuid",
    "location" "text",
    "notes" "text",
    "notification_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parcel_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tracking_number" character varying(50) NOT NULL,
    "recipient_id" "uuid",
    "weight" numeric(10,2),
    "volume" numeric(10,2),
    "shipping_type" character varying(50) NOT NULL,
    "shipping_status" character varying(50) DEFAULT 'reçu'::character varying,
    "destination" character varying(255),
    "shipping_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "created_by" "uuid" NOT NULL,
    "cbm" numeric(10,2),
    "destination_country" "text",
    "instructions" "text",
    "photo_urls" "text"[] DEFAULT '{}'::"text"[],
    "country" "text" DEFAULT 'france'::"text" NOT NULL,
    "special_instructions" "text",
    "price" numeric(10,2),
    "invoice_number" "text",
    "invoice_date" timestamp with time zone,
    "invoice_status" "text" DEFAULT 'pending'::"text",
    "recipient_name" "text",
    "reception_date" timestamp with time zone,
    "notes" "text",
    "volume_cbm" numeric,
    "total_price" numeric,
    "currency" "text",
    CONSTRAINT "check_cbm_positive" CHECK (("cbm" >= (0)::numeric)),
    CONSTRAINT "check_valid_destination" CHECK ((("destination")::"text" = ANY ((ARRAY['France'::character varying, 'Gabon'::character varying, 'Togo'::character varying, 'Côte d''Ivoire'::character varying, 'Dubai'::character varying])::"text"[]))),
    CONSTRAINT "check_valid_destination_country" CHECK (("lower"("destination_country") = ANY (ARRAY['france'::"text", 'gabon'::"text", 'togo'::"text", 'cote d''ivoire'::"text", 'dubai'::"text"]))),
    CONSTRAINT "parcels_status_check" CHECK (("status" = ANY (ARRAY['recu'::"text", 'expedie'::"text", 'receptionne'::"text", 'termine'::"text", 'litige'::"text", 'pending'::"text", 'in_transit'::"text", 'delivered'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_country" CHECK (("country" = ANY (ARRAY['france'::"text", 'gabon'::"text", 'togo'::"text", 'cote_ivoire'::"text", 'dubai'::"text"]))),
    CONSTRAINT "valid_shipping_type" CHECK ((("shipping_type")::"text" = ANY ((ARRAY['standard'::character varying, 'express'::character varying, 'maritime'::character varying])::"text"[]))),
    CONSTRAINT "valid_weight" CHECK ((((("shipping_type")::"text" = ANY ((ARRAY['standard'::character varying, 'express'::character varying])::"text"[])) AND ("weight" IS NOT NULL)) OR ((("shipping_type")::"text" = 'maritime'::"text") AND ("cbm" IS NOT NULL)) OR (("shipping_type")::"text" <> ALL ((ARRAY['standard'::character varying, 'express'::character varying, 'maritime'::character varying])::"text"[]))))
);


ALTER TABLE "public"."parcels" OWNER TO "postgres";


COMMENT ON COLUMN "public"."parcels"."recipient_id" IS 'ID du destinataire du colis';



COMMENT ON COLUMN "public"."parcels"."status" IS 'État du colis: recu, expedie, receptionne, termine, litige, pending, in_transit, delivered, cancelled';



COMMENT ON COLUMN "public"."parcels"."instructions" IS 'Instructions spéciales pour la livraison du colis';



COMMENT ON COLUMN "public"."parcels"."photo_urls" IS 'URLs des photos du colis';



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "module" character varying(50) NOT NULL,
    "action" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "shipping_type" "text" NOT NULL,
    "price_per_unit" numeric NOT NULL,
    "unit_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "shipping_type_check" CHECK (("shipping_type" = ANY (ARRAY['standard'::"text", 'express'::"text", 'maritime'::"text"]))),
    CONSTRAINT "unit_type_check" CHECK (("unit_type" = ANY (ARRAY['kg'::"text", 'cbm'::"text"])))
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "agency_role" "text",
    "agency_location" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "language" character varying(2) DEFAULT 'fr'::character varying,
    CONSTRAINT "valid_language" CHECK ((("language")::"text" = ANY ((ARRAY['fr'::character varying, 'en'::character varying, 'zh'::character varying])::"text"[])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(50),
    "email" character varying(255),
    "address_line1" character varying(255),
    "address_line2" character varying(255),
    "city" character varying(255),
    "postal_code" character varying(20),
    "country" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "address" "text"
);


ALTER TABLE "public"."recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "country" character varying(50) NOT NULL,
    "currency" character varying(3) NOT NULL,
    "standard_price_per_kg" numeric(10,2) NOT NULL,
    "express_price_per_kg" numeric(10,2) NOT NULL,
    "maritime_price_per_cbm" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_rates" (
    "id" integer NOT NULL,
    "country_id" integer,
    "shipping_type" "text" NOT NULL,
    "price_per_kg" numeric(10,2) NOT NULL,
    "price_per_cbm" numeric(10,2) NOT NULL,
    "min_weight" numeric(10,2) DEFAULT 0.5,
    "estimated_days" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "shipping_rates_shipping_type_check" CHECK (("shipping_type" = ANY (ARRAY['standard'::"text", 'express'::"text", 'maritime'::"text"])))
);


ALTER TABLE "public"."shipping_rates" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."shipping_rates_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."shipping_rates_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."shipping_rates_id_seq" OWNED BY "public"."shipping_rates"."id";



CREATE TABLE IF NOT EXISTS "public"."statistics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "total_revenue" numeric(15,2) DEFAULT 0,
    "completed_revenue" numeric(15,2) DEFAULT 0,
    "total_parcels" integer DEFAULT 0,
    "month_revenue" "jsonb" DEFAULT '{}'::"jsonb",
    "country_stats" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."statistics" OWNER TO "postgres";


ALTER TABLE ONLY "public"."destination_countries" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."destination_countries_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."shipping_rates" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."shipping_rates_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."destination_countries"
    ADD CONSTRAINT "destination_countries_country_code_key" UNIQUE ("country_code");



ALTER TABLE ONLY "public"."destination_countries"
    ADD CONSTRAINT "destination_countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcel_status_history"
    ADD CONSTRAINT "parcel_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_tracking_number_key" UNIQUE ("tracking_number");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_module_action_key" UNIQUE ("module", "action");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipients"
    ADD CONSTRAINT "recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_country_id_shipping_type_key" UNIQUE ("country_id", "shipping_type");



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statistics"
    ADD CONSTRAINT "statistics_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_disputes_created_by" ON "public"."disputes" USING "btree" ("created_by");



CREATE INDEX "idx_disputes_parcel_id" ON "public"."disputes" USING "btree" ("parcel_id");



CREATE INDEX "idx_disputes_priority" ON "public"."disputes" USING "btree" ("priority");



CREATE INDEX "idx_disputes_status" ON "public"."disputes" USING "btree" ("status");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_reference" ON "public"."notifications" USING "btree" ("reference_id", "reference_type");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_parcel_status_history_parcel_id" ON "public"."parcel_status_history" USING "btree" ("parcel_id");



CREATE INDEX "idx_parcels_cbm" ON "public"."parcels" USING "btree" ("cbm");



CREATE INDEX "idx_parcels_created_at" ON "public"."parcels" USING "btree" ("created_at");



CREATE INDEX "idx_parcels_created_by" ON "public"."parcels" USING "btree" ("created_by");



CREATE INDEX "idx_parcels_created_by_status" ON "public"."parcels" USING "btree" ("created_by", "status");



CREATE INDEX "idx_parcels_photo_urls" ON "public"."parcels" USING "gin" ("photo_urls");



CREATE INDEX "idx_parcels_recipient_id" ON "public"."parcels" USING "btree" ("recipient_id");



CREATE INDEX "idx_parcels_status" ON "public"."parcels" USING "btree" ("status");



CREATE INDEX "idx_parcels_tracking_number" ON "public"."parcels" USING "btree" ("tracking_number");



CREATE INDEX "idx_recipients_address" ON "public"."recipients" USING "btree" ("address");



CREATE INDEX "idx_recipients_created_at" ON "public"."recipients" USING "btree" ("created_at");



CREATE INDEX "idx_recipients_created_by" ON "public"."recipients" USING "btree" ("created_by");



CREATE INDEX "idx_recipients_phone" ON "public"."recipients" USING "btree" ("phone");



CREATE INDEX "idx_statistics_updated_at" ON "public"."statistics" USING "btree" ("updated_at");



CREATE INDEX "idx_statistics_user_id" ON "public"."statistics" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "calculate_price_before_insert" BEFORE INSERT OR UPDATE OF "destination_country", "shipping_type", "weight", "volume_cbm" ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."update_parcel_total_price"();



CREATE OR REPLACE TRIGGER "create_dispute_trigger" AFTER UPDATE OF "status" ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."create_dispute_on_parcel_status_change"();



COMMENT ON TRIGGER "create_dispute_trigger" ON "public"."parcels" IS 'Crée automatiquement un litige lorsque le statut d''un colis est changé en ''litige''';



CREATE OR REPLACE TRIGGER "set_recipient_created_by_trigger" BEFORE INSERT ON "public"."recipients" FOR EACH ROW EXECUTE FUNCTION "public"."set_recipient_created_by"();



CREATE OR REPLACE TRIGGER "set_recipient_updated_at_trigger" BEFORE UPDATE ON "public"."recipients" FOR EACH ROW EXECUTE FUNCTION "public"."set_recipient_updated_at"();



CREATE OR REPLACE TRIGGER "update_company_settings_updated_at" BEFORE UPDATE ON "public"."company_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_disputes_updated_at" BEFORE UPDATE ON "public"."disputes" FOR EACH ROW EXECUTE FUNCTION "public"."update_disputes_updated_at"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "update_parcel_price" BEFORE INSERT OR UPDATE ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."update_parcel_total_price"();



CREATE OR REPLACE TRIGGER "update_settings_updated_at" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_statistics_trigger" AFTER UPDATE ON "public"."parcels" FOR EACH ROW EXECUTE FUNCTION "public"."update_statistics"();



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "fk_created_by" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcel_status_history"
    ADD CONSTRAINT "parcel_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipients"
    ADD CONSTRAINT "recipients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."destination_countries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."statistics"
    ADD CONSTRAINT "statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admins to create employees" ON "public"."employees" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."agency_role" = 'admin'::"text")))));



CREATE POLICY "Allow admins to delete employees" ON "public"."employees" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."agency_role" = 'admin'::"text")))));



CREATE POLICY "Allow admins to update employees" ON "public"."employees" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."agency_role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."agency_role" = 'admin'::"text")))));



CREATE POLICY "Allow admins to view employees" ON "public"."employees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."agency_role" = 'admin'::"text")))));



CREATE POLICY "Allow full access to authenticated users" ON "public"."employees" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow full access to authenticated users" ON "public"."permissions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow full access to authenticated users" ON "public"."role_permissions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow full access to authenticated users" ON "public"."roles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Destination countries are viewable by everyone" ON "public"."destination_countries" FOR SELECT USING (true);



CREATE POLICY "Only authenticated users can insert destination countries" ON "public"."destination_countries" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Only authenticated users can insert shipping rates" ON "public"."shipping_rates" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Only authenticated users can update destination countries" ON "public"."destination_countries" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Only authenticated users can update shipping rates" ON "public"."shipping_rates" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Shipping rates are viewable by everyone" ON "public"."shipping_rates" FOR SELECT USING (true);



CREATE POLICY "Users can create disputes" ON "public"."disputes" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own parcels" ON "public"."parcels" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own parcel photos" ON "public"."parcel_photos" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."parcels"
  WHERE (("parcels"."id" = "parcel_photos"."parcel_id") AND ("parcels"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own parcels" ON "public"."parcels" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own statistics" ON "public"."statistics" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own parcel photos" ON "public"."parcel_photos" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."parcels"
  WHERE (("parcels"."id" = "parcel_photos"."parcel_id") AND ("parcels"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own recipients" ON "public"."recipients" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own statistics" ON "public"."statistics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own disputes" ON "public"."disputes" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own parcels" ON "public"."parcels" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own recipients" ON "public"."recipients" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own statistics" ON "public"."statistics" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own disputes" ON "public"."disputes" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own parcel photos" ON "public"."parcel_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."parcels"
  WHERE (("parcels"."id" = "parcel_photos"."parcel_id") AND ("parcels"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their own parcels" ON "public"."parcels" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own recipients" ON "public"."recipients" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own statistics" ON "public"."statistics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete_parcels" ON "public"."parcels" FOR DELETE USING (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."destination_countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_parcels" ON "public"."parcels" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcel_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcel_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_parcels" ON "public"."parcels" FOR SELECT USING (("auth"."uid"() = "created_by"));



ALTER TABLE "public"."shipping_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."statistics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_parcels" ON "public"."parcels" FOR UPDATE USING (("auth"."uid"() = "created_by"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."calculate_parcel_price"("p_country" "text", "p_shipping_type" "text", "p_weight" numeric, "p_cbm" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_parcel_price"("p_country" "text", "p_shipping_type" "text", "p_weight" numeric, "p_cbm" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_parcel_price"("p_country" "text", "p_shipping_type" "text", "p_weight" numeric, "p_cbm" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dispute_on_parcel_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_dispute_on_parcel_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dispute_on_parcel_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_parcel_dispute"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_parcel_dispute"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_parcel_dispute"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_dashboard_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_recipient_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_recipient_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_recipient_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_recipient_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_recipient_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_recipient_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_dispute_recipient"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_dispute_recipient"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_dispute_recipient"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_parcel_photos"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_parcel_photos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_parcel_photos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parcel_recipient_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parcel_recipient_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parcel_recipient_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_parcel_total_price"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_parcel_total_price"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_parcel_total_price"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."destination_countries" TO "anon";
GRANT ALL ON TABLE "public"."destination_countries" TO "authenticated";
GRANT ALL ON TABLE "public"."destination_countries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."destination_countries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."destination_countries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."destination_countries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."parcel_photos" TO "anon";
GRANT ALL ON TABLE "public"."parcel_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."parcel_photos" TO "service_role";



GRANT ALL ON TABLE "public"."parcel_status_history" TO "anon";
GRANT ALL ON TABLE "public"."parcel_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."parcel_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."parcels" TO "anon";
GRANT ALL ON TABLE "public"."parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipients" TO "anon";
GRANT ALL ON TABLE "public"."recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipients" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_rates" TO "anon";
GRANT ALL ON TABLE "public"."shipping_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_rates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shipping_rates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shipping_rates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shipping_rates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."statistics" TO "anon";
GRANT ALL ON TABLE "public"."statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."statistics" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
