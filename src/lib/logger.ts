/* Centralized client-side logger: captures global errors, console warnings, and failed fetches.
   - Stores recent logs in localStorage under 'error_logs' for the UI
   - Buffers logs to 'error_log_queue' and periodically persists to Supabase public.error_logs
*/
import { supabase } from '@/integrations/supabase/client';

export type DBLogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';

type UILogLevel = 'critical' | 'error' | 'warning';

interface QueueItem {
  created_at: string;
  level: DBLogLevel;
  message: string;
  source?: string;
  url?: string;
  user_agent?: string;
  session_id?: string;
  user_id?: string | null;
  details?: any;
  tags?: string[];
}

interface UILogItem {
  id: string;
  timestamp: string;
  level: UILogLevel;
  message: string;
  source: string;
  details?: string;
  resolved: boolean;
}

declare global {
  interface Window {
    __APP_LOGGER_INSTALLED?: boolean;
    __APP_LOGGER_FETCH_PATCHED?: boolean;
  }
}

const UI_STORAGE_KEY = 'error_logs';
const QUEUE_STORAGE_KEY = 'error_log_queue';
const SESSION_KEY = 'error_session_id';
const IGNORE_PATTERNS = [/\[vite\]\s*failed to connect to websocket/i];
const DEMOTE_INFO_PATTERNS = [/No authenticated user - fetching via public endpoint/i];
const recentLogs = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5000;

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

let cachedUserId: string | null | undefined = undefined;
async function ensureUserId() {
  if (cachedUserId !== undefined) return cachedUserId;
  try {
    const { data } = await supabase.auth.getUser();
    cachedUserId = data.user?.id ?? null;
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items.slice(-500)));
  } catch {
    // ignore
  }
}

function appendToUI(log: UILogItem) {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    const list: UILogItem[] = raw ? JSON.parse(raw) : [];
    const updated = [log, ...list].slice(0, 1000);
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

let flushing = false;
let nextDelay = 2000;
async function flushQueue() {
  if (flushing) return;
  const items = readQueue();
  if (items.length === 0) return;
  flushing = true;
  try {
    const batch = items.slice(0, 50);
    const { error } = await supabase.from('error_logs').insert(batch);
    if (!error) {
      writeQueue(items.slice(batch.length));
      nextDelay = 2000; // reset backoff
    } else {
      nextDelay = Math.min(nextDelay * 2, 60000);
    }
  } catch {
    nextDelay = Math.min(nextDelay * 2, 60000);
  } finally {
    flushing = false;
    setTimeout(flushQueue, nextDelay);
  }
}

function toUILevel(dbLevel: DBLogLevel, message: string): UILogLevel {
  if (/Failed to load user data from API/i.test(message) || /database connection lost/i.test(message)) return 'critical';
  if (dbLevel === 'warn') return 'warning';
  return 'error';
}

export async function logClientError(level: DBLogLevel, message: string, source = 'app', details?: any) {
  const now = new Date();
  const text = String(message ?? '');
  // Ignore noisy patterns
  if (IGNORE_PATTERNS.some((re) => re.test(text))) return;
  // Dedupe recent identical logs
  const key = `${level}|${text}`;
  const nowMs = now.getTime();
  const last = recentLogs.get(key);
  if (last && nowMs - last < DEDUPE_WINDOW_MS) return;
  recentLogs.set(key, nowMs);

  const uiLog: UILogItem = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now.toISOString(),
    level: toUILevel(level, text),
    message: text,
    source,
    details: typeof details === 'string' ? details : JSON.stringify(details ?? {}),
    resolved: false,
  };
  appendToUI(uiLog);

  const queueItem: QueueItem = {
    created_at: now.toISOString(),
    level,
    message: text,
    source,
    url: location.href,
    user_agent: navigator.userAgent,
    session_id: getSessionId(),
    user_id: await ensureUserId(),
    details,
    tags: details?.tags || [],
  };
  const q = readQueue();
  q.push(queueItem);
  writeQueue(q);
  // try immediate flush (debounced by flushQueue guard/backoff)
  flushQueue();
}

function installGlobalHandlers() {
  if (window.__APP_LOGGER_INSTALLED) return;
  window.__APP_LOGGER_INSTALLED = true;

  const originals = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    log: console.log,
    debug: console.debug,
  } as const;

  console.error = (...args: any[]) => {
    const msg = args.map(String).join(' ');
    try { logClientError('error', msg, 'console.error'); } catch {}
    originals.error.apply(console, args as any);
  };
  console.warn = (...args: any[]) => {
    const msg = args.map(String).join(' ');
    const demote = DEMOTE_INFO_PATTERNS.some((re) => re.test(msg));
    try { logClientError(demote ? 'info' : 'warn', msg, 'console.warn'); } catch {}
    (demote ? originals.info : originals.warn).apply(console, args as any);
  };

  // Global JS errors (includes resource errors via non-ErrorEvent)
  window.addEventListener('error', (event: Event) => {
    try {
      if ((event as any).error instanceof Error) {
        const ee = event as ErrorEvent;
        const d = { stack: (ee.error as Error).stack, filename: ee.filename, lineno: ee.lineno, colno: ee.colno };
        logClientError('error', ee.message, 'window.onerror', d);
      } else if (event.target && (event.target as HTMLElement).tagName) {
        const el = event.target as any;
        const tag = el.tagName?.toLowerCase();
        const src = el.src || el.href;
        logClientError('error', `Resource load error: <${tag}> ${src || ''}`.trim(), 'resource');
      }
    } catch {}
  }, true);

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    try {
      const reason = (event as any).reason;
      if (reason && typeof reason === 'object' && 'message' in reason) {
        logClientError('error', String((reason as any).message), 'unhandledrejection', { reason: String(reason), stack: (reason as any).stack });
      } else {
        logClientError('error', `Unhandled rejection: ${String(reason)}`, 'unhandledrejection');
      }
    } catch {}
  });

  // Patch fetch for failed requests
  if (!window.__APP_LOGGER_FETCH_PATCHED) {
    window.__APP_LOGGER_FETCH_PATCHED = true;
    const origFetch = window.fetch.bind(window);
    window.fetch = (async (...args: any[]) => {
      try {
        const res = await origFetch(...args);
        const req = new Request(...args as [any]);
        if (!res.ok) {
          logClientError('error', `HTTP ${res.status} ${req.method} ${req.url}`, 'fetch', { statusText: res.statusText });
        }
        return res;
      } catch (err: any) {
        const url = (args[0] && typeof args[0] === 'string') ? args[0] : (args[0]?.url || '');
        logClientError('error', `Fetch failed: ${String(err?.message || err)}`, 'fetch', { url });
        throw err;
      }
    }) as any;
  }

  // Periodic flush
  setTimeout(flushQueue, nextDelay);
}

// Helper function for integration errors
export function logIntegrationError(
  message: string,
  source: string,
  integrationName: string = 'epo',
  details?: any
) {
  logClientError('error', message, source, {
    ...details,
    tags: ['integration', integrationName]
  });
}

// Initialize on import
installGlobalHandlers();
