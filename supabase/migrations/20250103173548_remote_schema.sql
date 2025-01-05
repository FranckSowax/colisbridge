alter table "public"."disputes" drop constraint "disputes_priority_check";

alter table "public"."disputes" drop constraint "disputes_status_check";

alter table "public"."parcels" drop constraint "check_valid_destination";

alter table "public"."parcels" drop constraint "valid_shipping_type";

alter table "public"."parcels" drop constraint "valid_weight";

alter table "public"."profiles" drop constraint "valid_language";

alter table "public"."disputes" add constraint "disputes_priority_check" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))) not valid;

alter table "public"."disputes" validate constraint "disputes_priority_check";

alter table "public"."disputes" add constraint "disputes_status_check" CHECK (((status)::text = ANY ((ARRAY['Reçus'::character varying, 'Expédié'::character varying, 'Receptionné'::character varying, 'Terminé'::character varying, 'Litige'::character varying])::text[]))) not valid;

alter table "public"."disputes" validate constraint "disputes_status_check";

alter table "public"."parcels" add constraint "check_valid_destination" CHECK (((destination)::text = ANY ((ARRAY['France'::character varying, 'Gabon'::character varying, 'Togo'::character varying, 'Côte d''Ivoire'::character varying, 'Dubai'::character varying])::text[]))) not valid;

alter table "public"."parcels" validate constraint "check_valid_destination";

alter table "public"."parcels" add constraint "valid_shipping_type" CHECK (((shipping_type)::text = ANY ((ARRAY['standard'::character varying, 'express'::character varying, 'maritime'::character varying])::text[]))) not valid;

alter table "public"."parcels" validate constraint "valid_shipping_type";

alter table "public"."parcels" add constraint "valid_weight" CHECK (((((shipping_type)::text = ANY ((ARRAY['standard'::character varying, 'express'::character varying])::text[])) AND (weight IS NOT NULL)) OR (((shipping_type)::text = 'maritime'::text) AND (cbm IS NOT NULL)) OR ((shipping_type)::text <> ALL ((ARRAY['standard'::character varying, 'express'::character varying, 'maritime'::character varying])::text[])))) not valid;

alter table "public"."parcels" validate constraint "valid_weight";

alter table "public"."profiles" add constraint "valid_language" CHECK (((language)::text = ANY ((ARRAY['fr'::character varying, 'en'::character varying, 'zh'::character varying])::text[]))) not valid;

alter table "public"."profiles" validate constraint "valid_language";


