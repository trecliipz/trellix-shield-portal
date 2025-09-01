// netlify/functions/epo.js
import fetch from "node-fetch";

export async function handler(event, context) {
  // CORS headers for all responses
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Parse query parameters for API path
    const { searchParams } = new URL(`https://example.com${event.path}?${event.rawQuery || ''}`);
    const apiPath = searchParams.get('path') || 'remote/core.help';
    const timeout = parseInt(searchParams.get('timeout') || '30000');

    // Validate environment variables
    if (!process.env.PROXY_URL || !process.env.PROXY_USER || !process.env.PROXY_PASS) {
      throw new Error("Missing required environment variables: PROXY_URL, PROXY_USER, PROXY_PASS");
    }

    // Build Basic Auth header
    const authHeader = "Basic " + Buffer.from(
      `${process.env.PROXY_USER}:${process.env.PROXY_PASS}`
    ).toString("base64");

    // Construct full URL
    const targetUrl = `${process.env.PROXY_URL}/${apiPath.replace(/^\/+/, '')}`;

    console.log(`[EPO-NETLIFY] Proxying request to: ${targetUrl}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Make request to Trellix ePO
    const response = await fetch(targetUrl, {
      method: event.httpMethod || "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Netlify-EPO-Proxy/1.0"
      },
      body: event.httpMethod === "POST" ? event.body : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`EPO request failed: ${response.status} ${response.statusText}`);
    }

    // Try to parse as JSON, fallback to text
    let responseData;
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseError) {
      // If JSON parsing fails, get as text
      responseData = await response.text();
    }

    console.log(`[EPO-NETLIFY] Request successful, response type: ${typeof responseData}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        data: responseData,
        meta: {
          path: apiPath,
          timestamp: new Date().toISOString(),
          contentType: contentType
        }
      })
    };

  } catch (error) {
    console.error(`[EPO-NETLIFY] Error:`, error);

    // Handle different error types
    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error.name === 'AbortError') {
      errorMessage = "Request timeout";
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = "Cannot connect to EPO server";
      statusCode = 502;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      })
    };
  }
}