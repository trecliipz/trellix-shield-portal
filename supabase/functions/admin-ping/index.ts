
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user and check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { target, method = 'http', port, attempts = 1 } = await req.json()

    if (!target) {
      return new Response(
        JSON.stringify({ error: 'Target is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse target if it's a full URL
    let parsedTarget = target
    let parsedMethod = method
    let parsedPort = port
    
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        const url = new URL(target)
        parsedTarget = url.hostname
        parsedMethod = url.protocol === 'https:' ? 'https' : 'http'
        parsedPort = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
        console.log(`Parsed URL - Target: ${parsedTarget}, Method: ${parsedMethod}, Port: ${parsedPort}`)
      }
    } catch (error) {
      console.log(`Failed to parse as URL, treating as hostname: ${target}`)
    }

    console.log(`Admin ping request - Target: ${parsedTarget}, Method: ${parsedMethod}, Attempts: ${attempts}, Port: ${parsedPort}`)

    const results = []

    for (let i = 1; i <= attempts; i++) {
      const startTime = Date.now()
      let status = 'error'
      let latency_ms = null
      let error_message = null
      let resolved_ip = null

      try {
        if (parsedMethod === 'http' || parsedMethod === 'https') {
          const protocol = parsedMethod === 'https' ? 'https' : 'http'
          const targetPort = parsedPort || (protocol === 'https' ? 443 : 80)
          const url = `${protocol}://${parsedTarget}${targetPort !== (protocol === 'https' ? 443 : 80) ? `:${targetPort}` : ''}`
          
          console.log(`Attempt ${i}: Pinging ${url}`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Trellix-ePO-Admin-Ping/1.0'
            }
          })
          
          clearTimeout(timeoutId)
          latency_ms = Date.now() - startTime
          status = response.ok ? 'success' : 'unreachable'
          
          // Try to resolve IP (simplified - just use the target for now)
          resolved_ip = parsedTarget.match(/^\d+\.\d+\.\d+\.\d+$/) ? parsedTarget : null

        } else if (parsedMethod === 'tcp') {
          // For TCP, we'll do a basic connection test
          const targetPort = parsedPort || 80
          console.log(`Attempt ${i}: TCP ping to ${parsedTarget}:${targetPort}`)
          
          // Since Deno doesn't have a direct TCP ping, we'll use fetch with a very short timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          try {
            await fetch(`http://${parsedTarget}:${targetPort}`, {
              method: 'HEAD',
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            latency_ms = Date.now() - startTime
            status = 'success'
          } catch (e) {
            clearTimeout(timeoutId)
            latency_ms = Date.now() - startTime
            status = 'timeout'
            error_message = 'Connection timeout or refused'
          }

          resolved_ip = parsedTarget.match(/^\d+\.\d+\.\d+\.\d+$/) ? parsedTarget : null
        }

      } catch (error) {
        latency_ms = Date.now() - startTime
        if (error.name === 'AbortError') {
          status = 'timeout'
          error_message = 'Request timeout'
        } else {
          status = 'error'
          error_message = error.message
        }
        console.error(`Ping attempt ${i} failed:`, error.message)
      }

      // Log the result to database
      const logResult = {
        user_id: user.id,
        target: parsedTarget,
        resolved_ip,
        method: parsedMethod,
        port: parsedPort || null,
        status,
        latency_ms,
        attempts,
        attempt_index: i,
        error_message
      }

      const { error: insertError } = await supabase
        .from('network_ping_logs')
        .insert(logResult)

      if (insertError) {
        console.error('Error logging ping result:', insertError)
      }

      results.push({
        attempt: i,
        status,
        latency_ms,
        error_message,
        timestamp: new Date().toISOString()
      })

      // Small delay between attempts
      if (i < attempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        target: parsedTarget,
        method: parsedMethod,
        port: parsedPort,
        total_attempts: attempts,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin ping error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
