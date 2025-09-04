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

  // Build query parameters
  const params = new URLSearchParams({
    path: apiPath,
    timeout: timeout.toString(),
    parse
  });

  const url = `/api/epo?${params}`;

  try {
    console.log(`[NetlifyEpoClient] Calling ${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result: NetlifyEpoResponse<T> = await response.json();
    
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
    // Return standardized error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
      code: 'NETWORK_ERROR',
      suggestions: [
        'Check your network connection',
        'Verify Netlify functions are deployed',
        'Check browser console for more details'
      ],
      timestamp: new Date().toISOString()
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