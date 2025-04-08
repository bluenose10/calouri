
-- Create the view for user statistics
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
    date_trunc('day', created_at) AS signup_date,
    COUNT(*) AS signup_count
FROM auth.users
GROUP BY date_trunc('day', created_at)
ORDER BY signup_date DESC;

-- Create a security function to check if current user can access user statistics
CREATE OR REPLACE FUNCTION public.can_view_user_statistics()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Create a function to assign admin role to a user
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user ID from the email
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- For debugging: Assign admin role to a specific user (Update with appropriate email)
DO $$
BEGIN
    PERFORM public.assign_admin_role('mark.moran@example.com');
END$$;
