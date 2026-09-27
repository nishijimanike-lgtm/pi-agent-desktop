import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appShellSource = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");
const sessionSidebarSource = await readFile(new URL("./SessionSidebar.tsx", import.meta.url), "utf8");
const useAgentSessionSource = await readFile(new URL("../hooks/useAgentSession.ts", import.meta.url), "utf8");

test("SessionSidebar exposes onModelsVersionChange and forwards modelsVersion from SSE", () => {
  assert.match(sessionSidebarSource, /onModelsVersionChange\?: \(version: number\) => void/);
  assert.match(sessionSidebarSource, /data\.modelsVersion/);
  assert.match(sessionSidebarSource, /onModelsVersionChange(?:Ref\.current)?\?\.\(data\.modelsVersion\)/);
});

test("AppShell tracks modelsVersion and increments modelsRefreshKey on version changes", () => {
  assert.match(appShellSource, /onModelsVersionChange={handleModelsVersionChange}/);
  assert.match(appShellSource, /setModelsRefreshKey\(\(key\) => key \+ 1\)/);
});

test("useAgentSession gracefully clears missing model if removed from nextModelList", () => {
  assert.match(useAgentSessionSource, /newSessionModelOverrideRef\.current/);
  assert.match(useAgentSessionSource, /nextModelList\.some/);
});
