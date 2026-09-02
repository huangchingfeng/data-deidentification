import type { CustomPatternConfig, Pattern, PatternConfig } from './types';
import { BUILTIN_PATTERNS } from './patterns';

export const STORAGE_KEY = 'deid.patternConfig.v1';

function defaultConfig(): PatternConfig {
  return { version: 1, disabledBuiltins: [], enabledBuiltins: [], customPatterns: [] };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadConfig(): PatternConfig {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return defaultConfig();
  try {
    const parsed = JSON.parse(raw) as Partial<PatternConfig>;
    if (parsed.version !== 1) return defaultConfig();
    return {
      version: 1,
      disabledBuiltins: Array.isArray(parsed.disabledBuiltins) ? parsed.disabledBuiltins.filter((x) => typeof x === 'string') : [],
      enabledBuiltins: Array.isArray(parsed.enabledBuiltins) ? parsed.enabledBuiltins.filter((x) => typeof x === 'string') : [],
      customPatterns: Array.isArray(parsed.customPatterns)
        ? parsed.customPatterns.filter((c) => c && typeof c.regex === 'string' && validateRegex(c.regex) === null)
        : [],
    };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(config: PatternConfig): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Returns an error message, or null when the regex compiles with the 'gu' flags. */
export function validateRegex(src: string): string | null {
  if (!src.trim()) return '規則不可為空';
  try {
    const re = new RegExp(src, 'gu');
    if (re.test('')) return '規則不可比對空字串';
    return null;
  } catch (e) {
    return `無效的規則：${(e as Error).message}`;
  }
}

/** 規則自身 `enabled: false` 代表「預設關閉」，必須由使用者主動開啟。 */
export function defaultsOff(id: string): boolean {
  return BUILTIN_PATTERNS.find((p) => p.id === id)?.enabled === false;
}

export function getEffectivePatterns(config: PatternConfig = loadConfig()): Pattern[] {
  const disabled = new Set(config.disabledBuiltins);
  const optedIn = new Set(config.enabledBuiltins);
  const builtins = BUILTIN_PATTERNS.map((p) => ({
    ...p,
    enabled: p.enabled === false ? optedIn.has(p.id) : !disabled.has(p.id),
  }));
  const customs: Pattern[] = config.customPatterns.map((c) => ({ ...c, source: 'custom' }));
  return [...builtins, ...customs];
}

export function setBuiltinEnabled(config: PatternConfig, id: string, enabled: boolean): PatternConfig {
  if (defaultsOff(id)) {
    const set = new Set(config.enabledBuiltins);
    if (enabled) set.add(id);
    else set.delete(id);
    return { ...config, enabledBuiltins: [...set] };
  }
  const set = new Set(config.disabledBuiltins);
  if (enabled) set.delete(id);
  else set.add(id);
  return { ...config, disabledBuiltins: [...set] };
}

export function upsertCustom(config: PatternConfig, custom: CustomPatternConfig): PatternConfig {
  const err = validateRegex(custom.regex);
  if (err) throw new Error(err);
  const idx = config.customPatterns.findIndex((c) => c.id === custom.id);
  const list = [...config.customPatterns];
  if (idx >= 0) list[idx] = custom;
  else list.push(custom);
  return { ...config, customPatterns: list };
}

export function removeCustom(config: PatternConfig, id: string): PatternConfig {
  return { ...config, customPatterns: config.customPatterns.filter((c) => c.id !== id) };
}

export function newCustomId(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return 'c-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
