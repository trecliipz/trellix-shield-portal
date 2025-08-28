
-- Ensure profiles are automatically created when a new auth user signs up/gets created
-- The function public.handle_new_user already exists; we add the trigger if it doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END;
$$;
