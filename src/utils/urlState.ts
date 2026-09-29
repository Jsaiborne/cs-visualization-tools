import { useUIStore } from '../store/useUIStore';
import { captureModuleState, applyModuleState, isActiveModule } from './moduleState';

// Payload formats: 'z.' + deflate-raw + base64url (current), 'j.' + base64url JSON
// (browsers without CompressionStream), or an unprefixed legacy btoa(encodeURIComponent(json)).
const COMPRESSED_PREFIX = 'z.';
const PLAIN_PREFIX = 'j.';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array<ArrayBuffer> {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array<ArrayBuffer>> {
  const output = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(output).arrayBuffer());
}

/**
 * Serialize any JS object into a compact, URL-safe string.
 */
export async function serializeState(data: unknown): Promise<string> {
  try {
    const json = new TextEncoder().encode(JSON.stringify(data));
    if (typeof CompressionStream === 'undefined') {
      return PLAIN_PREFIX + toBase64Url(json);
    }
    return COMPRESSED_PREFIX + toBase64Url(await transform(json, new CompressionStream('deflate-raw')));
  } catch (err) {
    console.error('Failed to serialize state:', err);
    return '';
  }
}

/**
 * Deserialize a string produced by serializeState (or a legacy share link) back into a JS object.
 */
export async function deserializeState<T>(encoded: string): Promise<T | null> {
  try {
    let json: string;
    if (encoded.startsWith(COMPRESSED_PREFIX)) {
      const bytes = await transform(fromBase64Url(encoded.slice(COMPRESSED_PREFIX.length)), new DecompressionStream('deflate-raw'));
      json = new TextDecoder().decode(bytes);
    } else if (encoded.startsWith(PLAIN_PREFIX)) {
      json = new TextDecoder().decode(fromBase64Url(encoded.slice(PLAIN_PREFIX.length)));
    } else {
      json = decodeURIComponent(atob(encoded));
    }
    return JSON.parse(json) as T;
  } catch (err) {
    console.error('Failed to deserialize state:', err);
    return null;
  }
}

/**
 * Generate a shareable URL containing serialized state for the current active module.
 */
export async function getShareableURL(): Promise<string> {
  const activeModule = useUIStore.getState().activeModule;
  const statePayload = captureModuleState(activeModule);

  const encodedState = statePayload ? await serializeState(statePayload) : '';
  const url = new URL(window.location.href);
  url.searchParams.set('module', activeModule);
  if (encodedState) {
    url.searchParams.set('state', encodedState);
  } else {
    url.searchParams.delete('state');
  }

  return url.toString();
}

/**
 * Read query parameters on startup and hydrate stores if valid state is found.
 * The active module is set synchronously (call this before the first render to avoid
 * flashing the home page); the encoded state is decoded asynchronously.
 */
export async function loadStateFromURL(): Promise<boolean> {
  try {
    const params = new URLSearchParams(window.location.search);
    const moduleParam = params.get('module');
    const stateParam = params.get('state');

    if (!isActiveModule(moduleParam)) return false;
    useUIStore.getState().setActiveModule(moduleParam);

    if (stateParam) {
      applyModuleState(moduleParam, await deserializeState(stateParam));
    }
    return true;
  } catch (err) {
    console.error('Failed to hydrate state from URL:', err);
    return false;
  }
}
