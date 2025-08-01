-- Create function for bulk agent deployment
CREATE OR REPLACE FUNCTION public.deploy_agent_to_users(
    p_agent_id UUID,
    p_deployment_target TEXT,
    p_target_user_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(deployment_id UUID, target_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deployment_id UUID;
    v_target_count INTEGER;
    v_agent_data RECORD;
    v_user_ids UUID[];
BEGIN
    -- Get agent package details
    SELECT * INTO v_agent_data
    FROM public.admin_agent_packages
    WHERE id = p_agent_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, 0, 'Agent package not found or inactive'::TEXT;
        RETURN;
    END IF;

    -- Determine target users based on deployment target
    CASE p_deployment_target
        WHEN 'all' THEN
            SELECT ARRAY_AGG(id) INTO v_user_ids
            FROM public.profiles
            WHERE email IS NOT NULL;
        
        WHEN 'test' THEN
            SELECT ARRAY_AGG(id) INTO v_user_ids
            FROM public.profiles
            WHERE email ILIKE '%test%';
            
        WHEN 'custom' THEN
            v_user_ids := p_target_user_ids;
            
        ELSE
            RETURN QUERY SELECT NULL::UUID, 0, 'Invalid deployment target'::TEXT;
            RETURN;
    END CASE;

    -- Get count of target users
    v_target_count := COALESCE(array_length(v_user_ids, 1), 0);

    IF v_target_count = 0 THEN
        RETURN QUERY SELECT NULL::UUID, 0, 'No target users found for deployment'::TEXT;
        RETURN;
    END IF;

    -- Create deployment record
    INSERT INTO public.bulk_operations (
        user_id,
        operation_type,
        status,
        total_items,
        operation_data
    )
    VALUES (
        auth.uid(),
        'agent_deployment',
        'pending',
        v_target_count,
        jsonb_build_object(
            'agent_id', p_agent_id,
            'agent_name', v_agent_data.name,
            'agent_version', v_agent_data.version,
            'deployment_target', p_deployment_target,
            'target_users', v_user_ids
        )
    )
    RETURNING id INTO v_deployment_id;

    -- Assign agent to all target users
    PERFORM public.assign_agent_to_users(p_agent_id, v_user_ids, auth.uid());

    -- Return deployment details
    RETURN QUERY SELECT v_deployment_id, v_target_count, 
        format('Deployment initiated for %s users', v_target_count)::TEXT;
END;
$$;

-- Create function to get deployment status
CREATE OR REPLACE FUNCTION public.get_deployment_status(p_deployment_id UUID)
RETURNS TABLE(
    deployment_id UUID,
    status TEXT,
    total_users INTEGER,
    completed_users INTEGER,
    failed_users INTEGER,
    progress_percentage INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bo.id as deployment_id,
        bo.status,
        bo.total_items as total_users,
        bo.completed_items as completed_users,
        bo.failed_items as failed_users,
        CASE 
            WHEN bo.total_items > 0 THEN 
                ROUND((bo.completed_items::NUMERIC / bo.total_items::NUMERIC) * 100)::INTEGER
            ELSE 0
        END as progress_percentage,
        bo.created_at
    FROM public.bulk_operations bo
    WHERE bo.id = p_deployment_id
    AND bo.operation_type = 'agent_deployment';
END;
$$;