// src/utils/netlifyEpoClient.ts

export interface NetlifyEpoResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  suggestions?: string[];
  timestamp: string;
  meta?: {
    path: string;
    targetUrl?: string;
    timestamp: string;
    contentType: string;
    detectedFormat?: string;
    parseMode?: string;
    latency?: number;
    responseSize?: number;
    httpStatus?: number;
    httpStatusText?: string;
    proxyUrl?: string;
    responsePreview?: string;
    parseError?: string;
    requestUrl?: string;
    userAgent?: string;
  };
}

export interface EpoCallOptions {
  timeout?: number;
  method?: 'GET' | 'POST';
  body?: any;
  parse?: 'auto' | 'json' | 'xml' | 'raw';
}

/**
 * Call EPO API via Netlify Functions proxy
 * @param apiPath - EPO API path (e.g., 'remote/core.help', 'remote/system.find')
 * @param options - Request options including parse mode
 * @returns Promise with EPO response data
 */
export async function callEpoViaNetlify<T = any>(
  apiPath: string, 
  options: EpoCallOptions = {}
): Promise<NetlifyEpoResponse<T>> {
  const { timeout = 30000, method = 'GET', body, parse = 'auto' } = options;

  // Environment-aware base URL resolution
  const getBaseUrl = () => {
    // Check if we're in preview environment and have Netlify URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('lovable.dev')) {
      const netlifyUrl = import.meta.env.VITE_NETLIFY_SITE_URL;
      if (netlifyUrl) {
        return netlifyUrl;
      }
    }
    return ''; // Use relative URL for same-origin requests
  };

  // Build query parameters
  const params = new URLSearchParams({
    path: apiPath,
    timeout: timeout.toString(),
    parse
  });

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/epo?${params}`;

  try {
    console.log(`[NetlifyEpoClient] Calling ${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Enhanced response handling for HTML/redirect detection
    const contentType = response.headers.get('content-type') || '';
    let responseText = '';
    
    try {
      responseText = await response.text();
    } catch (textError) {
      return {
        success: false,
        error: 'Failed to read response body',
        code: 'RESPONSE_READ_ERROR',
        suggestions: ['Check network connectivity', 'Try again in a moment'],
        timestamp: new Date().toISOString(),
        meta: {
          path: apiPath,
          timestamp: new Date().toISOString(),
          httpStatus: response.status,
          httpStatusText: response.statusText,
          contentType
        }
      };
    }

    // Detect HTML responses (error pages, redirects)
    const isHtmlResponse = contentType.includes('text/html') || 
                          responseText.trim().startsWith('<!DOCTYPE') ||
                          responseText.trim().startsWith('<html');

    if (isHtmlResponse) {
      return {
        success: false,
        error: 'Received HTML page instead of JSON API response',
        code: 'HTML_RESPONSE_ERROR',
        suggestions: [
          'Check if Netlify function is properly deployed',
          'Verify environment variables are set in Netlify dashboard',
          'Check if EPO server URL is accessible from Netlify',
          'Try testing directly via "Run on Netlify" button'
        ],
        timestamp: new Date().toISOString(),
        meta: {
          path: apiPath,
          timestamp: new Date().toISOString(),
          httpStatus: response.status,
          httpStatusText: response.statusText,
          contentType,
          responsePreview: responseText.substring(0, 200) + '...',
          detectedFormat: 'html'
        }
      };
    }

    // Try to parse as JSON
    let result: NetlifyEpoResponse<T>;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON response from Netlify function',
        code: 'JSON_PARSE_ERROR',
        suggestions: [
          'Check Netlify function logs for errors',
          'Verify EPO server is returning valid responses',
          'Try different parse mode (xml, raw)'
        ],
        timestamp: new Date().toISOString(),
        meta: {
          path: apiPath,
          timestamp: new Date().toISOString(),
          httpStatus: response.status,
          httpStatusText: response.statusText,
          contentType,
          responsePreview: responseText.substring(0, 200) + '...',
          parseError: parseError.message
        }
      };
    }
    
    if (!response.ok) {
      // Enhanced error handling with Netlify function error details
      console.error(`[NetlifyEpoClient] HTTP ${response.status}:`, result);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
        code: result.code || `HTTP_${response.status}`,
        suggestions: result.suggestions || [],
        timestamp: result.timestamp || new Date().toISOString(),
        meta: result.meta
      };
    }

    console.log(`[NetlifyEpoClient] Success:`, {
      path: result.meta?.path,
      format: result.meta?.detectedFormat,
      latency: result.meta?.latency
    });
    
    return result;

  } catch (error) {
    console.error(`[NetlifyEpoClient] Network error:`, error);
    
    // Enhanced error classification
    let errorCode = 'NETWORK_ERROR';
    let suggestions = [
      'Check your network connection',
      'Verify Netlify functions are deployed',
      'Check browser console for more details'
    ];

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorCode = 'FETCH_ERROR';
      suggestions = [
        'Check if the Netlify function URL is accessible',
        'Verify CORS configuration',
        'Try refreshing the page'
      ];
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
      code: errorCode,
      suggestions,
      timestamp: new Date().toISOString(),
      meta: {
        path: apiPath,
        timestamp: new Date().toISOString(),
        contentType: 'unknown',
        requestUrl: url,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
      }
    };
  }
}

/**
 * Common EPO API calls with typed responses
 */
export const epoApi = {
  /**
   * Get EPO server version and info
   */
  async getVersion() {
    return callEpoViaNetlify<{ version: string; build: string }>('remote/core.getVersion');
  },

  /**
   * Get help information
   */
  async getHelp() {
    return callEpoViaNetlify<string>('remote/core.help', { parse: 'xml' });
  },

  /**
   * Find systems/agents
   */
  async findSystems(searchText?: string) {
    const params = searchText ? { searchText } : {};
    return callEpoViaNetlify('remote/system.find', { 
      method: 'POST', 
      body: params 
    });
  },

  /**
   * List policies
   */
  async listPolicies() {
    return callEpoViaNetlify('remote/policy.listPolicies');
  },

  /**
   * Execute custom EPO command
   */
  async executeCommand(command: string, parameters: any = {}) {
    return callEpoViaNetlify(`remote/${command}`, {
      method: 'POST',
      body: parameters
    });
  }
};

/**
 * Test Netlify function health
 */
export async function testNetlifyHealth(): Promise<NetlifyEpoResponse> {
  return callEpoViaNetlify('ping', { parse: 'raw' });
}

/**
 * Test connection to EPO via Netlify proxy
 */
export async function testNetlifyEpoConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
  diagnostics?: any;
}> {
  try {
    console.log('Testing EPO connection via Netlify proxy...');
    
    const response = await epoApi.getHelp();
    
    if (response.success) {
      const diagnostics = {
        targetUrl: response.meta?.targetUrl,
        latency: response.meta?.latency,
        contentType: response.meta?.contentType,
        detectedFormat: response.meta?.detectedFormat,
        responseSize: response.meta?.responseSize,
        timestamp: response.timestamp
      };
      
      return {
        success: true,
        message: `EPO connection successful! Response received in ${response.meta?.latency || 'unknown'}ms`,
        details: {
          dataType: typeof response.data,
          hasData: !!response.data,
          sampleData: typeof response.data === 'string' ? response.data.substring(0, 200) + '...' : response.data
        },
        diagnostics
      };
    } else {
      return {
        success: false,
        message: response.error || 'EPO connection failed',
        details: {
          error: response.error,
          code: response.code,
          suggestions: response.suggestions || [],
          meta: response.meta
        },
        diagnostics: {
          targetUrl: response.meta?.targetUrl,
          latency: response.meta?.latency,
          proxyUrl: response.meta?.proxyUrl
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
      details: { error: error instanceof Error ? error.message : error },
      diagnostics: {
        clientError: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}