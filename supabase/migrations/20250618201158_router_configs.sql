create table "public"."routers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null,
    "name" character varying
);

alter table "public"."routers" enable row level security;

revoke all on table "public"."routers" from anon, authenticated, public;

CREATE UNIQUE INDEX routers_pkey ON public.routers USING btree (id);

alter table "public"."routers" add constraint "routers_pkey" PRIMARY KEY using index "routers_pkey";

alter table "public"."routers" add constraint "public_routers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."routers" validate constraint "public_routers_organization_id_fkey";

create table "public"."router_config_versions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "router_id" uuid not null,
    "version" varchar(255) not null,
    "config" jsonb not null
);

alter table "public"."router_config_versions" enable row level security;

revoke all on table "public"."router_config_versions" from anon, authenticated, public;

CREATE UNIQUE INDEX router_config_versions_pkey ON public.router_config_versions USING btree (id);

alter table "public"."router_config_versions" add constraint "router_config_versions_pkey" PRIMARY KEY using index "router_config_versions_pkey";

alter table "public"."router_config_versions" add constraint "public_router_config_versions_router_id_fkey" FOREIGN KEY (router_id) REFERENCES routers(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."router_config_versions" validate constraint "public_router_config_versions_router_id_fkey";

create table "public"."router_keys" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "router_id" uuid not null,
    "api_key_id" bigint not null,
    "added_by" uuid not null
);

alter table "public"."router_keys" enable row level security;
revoke all on table "public"."router_keys" from anon, authenticated, public;

CREATE UNIQUE INDEX router_keys_pkey ON public.router_keys USING btree (id);

alter table "public"."router_keys" add constraint "router_keys_pkey" PRIMARY KEY using index "router_keys_pkey";

alter table "public"."router_keys" add constraint "public_router_keys_api_key_id_fkey" FOREIGN KEY (api_key_id) REFERENCES helicone_api_keys(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."router_keys" validate constraint "public_router_keys_api_key_id_fkey";

alter table "public"."router_keys" add constraint "public_router_keys_router_id_fkey" FOREIGN KEY (router_id) REFERENCES routers(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."router_keys" validate constraint "public_router_keys_router_id_fkey";

alter table "public"."router_keys" add constraint "public_router_keys_added_by_fkey" FOREIGN KEY (added_by) REFERENCES auth.users(id) not valid;

alter table "public"."router_keys" validate constraint "public_router_keys_added_by_fkey";