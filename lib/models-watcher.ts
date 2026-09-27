import { existsSync, mkdirSync, statSync, watch, type FSWatcher } from "node:fs";
import { basename, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { invalidateModelsCache } from "./models-cache";

const DEFAULT_DEBOUNCE_MS = 200;
const WATCHED_CONFIG_FILES = new Set(["models.json", "settings.json", "auth.json"]);

export function isWatchedModelConfigFile(filename: string | null | undefined): boolean {
  if (!filename) return false;
  return WATCHED_CONFIG_FILES.has(basename(filename));
}

interface FileSignature {
  exists: boolean;
  mtimeMs: number;
  size: number;
}

function getFileSignature(filePath: string): FileSignature {
  try {
    const stats = statSync(filePath);
    return {
      exists: true,
      mtimeMs: stats.mtimeMs,
      size: stats.size,
    };
  } catch {
    return {
      exists: false,
      mtimeMs: 0,
      size: 0,
    };
  }
}

function signaturesEqual(a: FileSignature, b: FileSignature): boolean {
  return a.exists === b.exists && a.mtimeMs === b.mtimeMs && a.size === b.size;
}

export interface ModelsWatcherOptions {
  agentDir?: string;
  debounceMs?: number;
  onInvalidate?: () => void;
}

interface ActiveWatcher {
  watcher: FSWatcher;
  timer: NodeJS.Timeout | null;
  agentDir: string;
  stop: () => void;
}

declare global {
  var __piModelsWatcher: ActiveWatcher | undefined;
}

export function stopModelsWatcher(): void {
  const active = globalThis.__piModelsWatcher;
  if (!active) return;
  if (active.timer) clearTimeout(active.timer);
  try {
    active.watcher.close();
  } catch {
    // Ignore close errors
  }
  globalThis.__piModelsWatcher = undefined;
}

export function startModelsWatcher(options?: ModelsWatcherOptions): () => void {
  const agentDir = options?.agentDir ?? getAgentDir();
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const onInvalidate = options?.onInvalidate ?? invalidateModelsCache;

  // If already running with the same agentDir, keep the active instance.
  if (globalThis.__piModelsWatcher) {
    if (globalThis.__piModelsWatcher.agentDir === agentDir && !options?.onInvalidate) {
      return globalThis.__piModelsWatcher.stop;
    }
    stopModelsWatcher();
  }

  if (!existsSync(agentDir)) {
    try {
      mkdirSync(agentDir, { recursive: true });
    } catch {
      // Best effort; if creation fails, watcher cannot be attached
      return () => {};
    }
  }

  // Pre-populate known signatures for watched files so initial state is recorded
  const knownSignatures = new Map<string, FileSignature>();
  for (const filename of WATCHED_CONFIG_FILES) {
    const fullPath = join(agentDir, filename);
    knownSignatures.set(filename, getFileSignature(fullPath));
  }

  let debounceTimer: NodeJS.Timeout | null = null;
  let disposed = false;

  const flush = () => {
    debounceTimer = null;
    if (disposed) return;

    let hasChange = false;
    for (const filename of WATCHED_CONFIG_FILES) {
      const fullPath = join(agentDir, filename);
      const currentSignature = getFileSignature(fullPath);
      const lastSignature = knownSignatures.get(filename) ?? { exists: false, mtimeMs: 0, size: 0 };

      if (!signaturesEqual(currentSignature, lastSignature)) {
        knownSignatures.set(filename, currentSignature);
        hasChange = true;
      }
    }

    if (hasChange) {
      try {
        onInvalidate();
      } catch {
        // Callback errors must not crash the watcher
      }
    }
  };

  let watcher: FSWatcher;
  try {
    watcher = watch(agentDir, { recursive: false }, (_eventType, filename) => {
      if (disposed) return;
      if (filename && !isWatchedModelConfigFile(filename)) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, debounceMs);
    });
  } catch {
    // If watching fails (e.g. permission or unwatchable filesystem), gracefully fall back
    return () => {};
  }

  const stop = () => {
    if (disposed) return;
    disposed = true;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    try {
      watcher.close();
    } catch {
      // Ignore close errors
    }
    if (globalThis.__piModelsWatcher?.stop === stop) {
      globalThis.__piModelsWatcher = undefined;
    }
  };

  const active: ActiveWatcher = {
    watcher,
    timer: debounceTimer,
    agentDir,
    stop,
  };
  globalThis.__piModelsWatcher = active;

  return stop;
}

export function ensureModelsWatcherStarted(): () => void {
  if (globalThis.__piModelsWatcher) {
    return globalThis.__piModelsWatcher.stop;
  }
  return startModelsWatcher();
}
