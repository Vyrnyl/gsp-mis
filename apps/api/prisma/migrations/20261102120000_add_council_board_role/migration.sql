-- Council Board: a fourth, view-only role (client batch item 7).
-- Roles are rows, not schema, and the seed never runs against a live database, so the
-- role and its grants ship here to reach every environment through `migrate deploy`.
INSERT INTO "roles" ("id", "name", "description")
VALUES (
  gen_random_uuid(),
  'council_board',
  'Board members with view-only access to council, event and analytics data'
)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'council_board'
  AND p."name" IN ('organizations:read', 'events:read', 'analytics:read')
ON CONFLICT DO NOTHING;
