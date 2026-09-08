# Operations Runbook

## Launch gate
HTTPS/domain; Supabase production project; migrations/RLS review; Auth SMTP + MFA; payment webhook; private storage; verified CUN content; legal/privacy review; accessibility/performance/security testing; backups and recovery test.

## Daily controls
Review failed payments/webhooks, admission exceptions, security/audit alerts and support queue.

## Release controls
Backup -> migrate -> smoke-test authentication, applications, documents, payments and portals -> monitor -> rollback if required.
