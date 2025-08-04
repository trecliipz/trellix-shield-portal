-- Sync admin account with database
-- Create or update admin profile
INSERT INTO public.profiles (id, name, email)
VALUES (
  '511ed7ad-1a4a-499e-93c0-7578c5861f59'::uuid,
  'Admin User',
  'admin@trellix.com'
)
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = now();

-- Ensure admin has necessary permissions by creating/updating agent configuration
INSERT INTO public.agent_configurations (
  user_id,
  agent_version,
  auto_update_enabled,
  deployment_policies
)
VALUES (
  '511ed7ad-1a4a-499e-93c0-7578c5861f59'::uuid,
  '5.10.0',
  true,
  '{"admin_access": true, "deployment_enabled": true}'::jsonb
)
ON CONFLICT (user_id)
DO UPDATE SET
  deployment_policies = EXCLUDED.deployment_policies,
  updated_at = now();