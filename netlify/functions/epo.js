// netlify/functions/epo.js
const fetch = require("node-fetch");
const xml2js = require("xml2js");

exports.handler = async function(event, context) {
  const startTime = Date.now();
  
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
    // Parse query parameters for API path and parse mode
    const { searchParams } = new URL(`https://example.com${event.path}?${event.rawQuery || ''}`);
    const apiPath = searchParams.get('path') || 'remote/core.help';
    const timeout = parseInt(searchParams.get('timeout') || '30000');
    const parseMode = searchParams.get('parse') || 'auto'; // auto, json, xml, raw
    const ping = searchParams.get('ping') === '1'; // health check mode

    // Handle ping/health check mode
    if (ping) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: true,
          message: "Netlify function is operational",
          timestamp: new Date().toISOString(),
          environment: {
            hasProxyUrl: !!process.env.PROXY_URL,
            hasProxyUser: !!process.env.PROXY_USER,
            hasProxyPass: !!process.env.PROXY_PASS
          }
        })
      };
    }

    // Validate environment variables
    if (!process.env.PROXY_URL || !process.env.PROXY_USER || !process.env.PROXY_PASS) {
      throw new Error("Missing required environment variables: PROXY_URL, PROXY_USER, PROXY_PASS");
    }

    // Normalize PROXY_URL (remove trailing slashes and /remote path)
    const normalizedProxyUrl = process.env.PROXY_URL.replace(/\/+$/, '').replace(/\/remote$/, '');
    
    // Normalize apiPath (ensure it doesn't start with /)
    const normalizedApiPath = apiPath.replace(/^\/+/, '');
    
    // Build Basic Auth header
    const authHeader = "Basic " + Buffer.from(
      `${process.env.PROXY_USER}:${process.env.PROXY_PASS}`
    ).toString("base64");

    // Construct full URL
    const targetUrl = `${normalizedProxyUrl}/${normalizedApiPath}`;

    console.log(`[EPO-NETLIFY] Proxying to: ${targetUrl} (parse: ${parseMode})`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Make request to Trellix ePO
    const response = await fetch(targetUrl, {
      method: event.httpMethod || "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json, application/xml, text/xml, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Netlify-EPO-Proxy/1.0"
      },
      body: event.httpMethod === "POST" ? event.body : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      // Return more specific HTTP error information
      return {
        statusCode: response.status,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: `EPO server returned ${response.status}: ${response.statusText}`,
          code: `HTTP_${response.status}`,
          timestamp: new Date().toISOString(),
          meta: {
            path: normalizedApiPath,
            targetUrl,
            latency,
            httpStatus: response.status,
            httpStatusText: response.statusText
          }
        })
      };
    }

    // Parse response based on mode and content type
    const rawResponse = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    let detectedFormat = 'raw';
    
    try {
      if (parseMode === 'raw') {
        responseData = rawResponse;
        detectedFormat = 'raw';
      } else if (parseMode === 'json' || (parseMode === 'auto' && contentType.includes('json'))) {
        responseData = JSON.parse(rawResponse);
        detectedFormat = 'json';
      } else if (parseMode === 'xml' || (parseMode === 'auto' && (contentType.includes('xml') || rawResponse.trim().startsWith('<')))) {
        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
        responseData = await parser.parseStringPromise(rawResponse);
        detectedFormat = 'xml';
      } else {
        // Auto-detect: try JSON first, then XML, then raw
        try {
          responseData = JSON.parse(rawResponse);
          detectedFormat = 'json';
        } catch {
          try {
            if (rawResponse.trim().startsWith('<')) {
              const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
              responseData = await parser.parseStringPromise(rawResponse);
              detectedFormat = 'xml';
            } else {
              responseData = rawResponse;
              detectedFormat = 'raw';
            }
          } catch {
            responseData = rawResponse;
            detectedFormat = 'raw';
          }
        }
      }
    } catch (parseError) {
      console.warn(`[EPO-NETLIFY] Parse error (${parseMode}):`, parseError.message);
      responseData = rawResponse;
      detectedFormat = 'raw';
    }

    console.log(`[EPO-NETLIFY] Success: ${detectedFormat} response, ${latency}ms`);

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
          path: normalizedApiPath,
          targetUrl,
          timestamp: new Date().toISOString(),
          contentType,
          detectedFormat,
          parseMode,
          latency,
          responseSize: rawResponse.length
        }
      })
    };

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`[EPO-NETLIFY] Error after ${latency}ms:`, error);

    // Enhanced error classification and messaging
    let errorMessage = "Unknown error occurred";
    let statusCode = 500;
    let suggestions = [];

    if (error.name === 'AbortError') {
      errorMessage = "Request timeout - EPO server not responding";
      statusCode = 408;
      suggestions = [
        "Check if EPO server is running and accessible",
        "Increase timeout value",
        "Verify network connectivity"
      ];
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "DNS resolution failed - cannot find EPO server";
      statusCode = 502;
      suggestions = [
        "Verify the server hostname/IP in PROXY_URL",
        "Ensure the server is publicly accessible",
        "Check DNS configuration"
      ];
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "Connection refused - EPO server not accepting connections";
      statusCode = 502;
      suggestions = [
        "Check if EPO server is running",
        "Verify the port number (usually 8443)",
        "Check firewall settings"
      ];
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      errorMessage = "Network connectivity issue";
      statusCode = 502;
      suggestions = [
        "Check network stability",
        "Verify server is reachable",
        "Try increasing timeout"
      ];
    } else if (error.message && error.message.includes('certificate')) {
      errorMessage = "SSL certificate error";
      statusCode = 502;
      suggestions = [
        "Check SSL certificate validity",
        "Ensure certificate is not self-signed",
        "Verify certificate chain"
      ];
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
        suggestions,
        timestamp: new Date().toISOString(),
        meta: {
          latency,
          proxyUrl: process.env.PROXY_URL || 'not_set'
        }
      })
    };
  }
}