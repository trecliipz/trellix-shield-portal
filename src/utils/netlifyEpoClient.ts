// src/utils/netlifyEpoClient.ts

export interface NetlifyEpoResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  meta?: {
    path: string;
    timestamp: string;
    contentType: string;
  };
}

export interface EpoCallOptions {
  timeout?: number;
  method?: 'GET' | 'POST';
  body?: any;
}

/**
 * Call EPO API via Netlify Functions proxy
 * @param apiPath - EPO API path (e.g., 'remote/core.help', 'remote/system.find')
 * @param options - Request options
 * @returns Promise with EPO response data
 */
export async function callEpoViaNetlify<T = any>(
  apiPath: string, 
  options: EpoCallOptions = {}
): Promise<NetlifyEpoResponse<T>> {
  const { timeout = 30000, method = 'GET', body } = options;

  // Build query parameters
  const params = new URLSearchParams({
    path: apiPath,
    timeout: timeout.toString()
  });

  const url = `/.netlify/functions/epo?${params}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: NetlifyEpoResponse<T> = await response.json();
    return result;

  } catch (error) {
    // Return standardized error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
      code: 'NETWORK_ERROR',
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
    return callEpoViaNetlify<string>('remote/core.help');
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
}> {
  try {
    console.log('Testing EPO connection via Netlify...');
    
    const response = await epoApi.getHelp();
    
    if (response.success) {
      return {
        success: true,
        message: 'EPO connection successful via Netlify proxy',
        details: {
          timestamp: response.timestamp,
          dataType: typeof response.data,
          hasData: !!response.data
        }
      };
    } else {
      return {
        success: false,
        message: response.error || 'EPO connection failed',
        details: response
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
      details: { error }
    };
  }
}