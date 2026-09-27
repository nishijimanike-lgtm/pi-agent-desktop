import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";
import { setTimeout as sleep } from "node:timers/promises";

const jiti = createJiti(import.meta.url);
const {
  isWatchedModelConfigFile,
  startModelsWatcher,
  stopModelsWatcher,
} = await jiti.import("./models-watcher.ts");

test("isWatchedModelConfigFile matches targeted config basenames", () => {
  assert.equal(isWatchedModelConfigFile("models.json"), true);
  assert.equal(isWatchedModelConfigFile("settings.json"), true);
  assert.equal(isWatchedModelConfigFile("auth.json"), true);
  assert.equal(isWatchedModelConfigFile("models.json.tmp"), false);
  assert.equal(isWatchedModelConfigFile("other.txt"), false);
  assert.equal(isWatchedModelConfigFile(""), false);
});

test("models watcher debounces and triggers invalidation on watched config changes", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "pi-models-watcher-test-"));
  let triggeredCount = 0;

  try {
    const stop = startModelsWatcher({
      agentDir: tempDir,
      debounceMs: 50,
      onInvalidate: () => {
        triggeredCount += 1;
      },
    });

    // Write an unwatched file; should not trigger invalidation
    writeFileSync(join(tempDir, "unrelated.log"), "some log");
    await sleep(100);
    assert.equal(triggeredCount, 0, "unrelated file must not trigger invalidation");

    // Write models.json; should trigger invalidation once after debounce
    writeFileSync(join(tempDir, "models.json"), JSON.stringify({ providers: {} }));
    await sleep(120);
    assert.equal(triggeredCount, 1, "writing models.json must trigger invalidation");

    // Multiple rapid writes to models.json should be debounced into a single trigger
    writeFileSync(join(tempDir, "models.json"), JSON.stringify({ providers: { a: {} } }));
    writeFileSync(join(tempDir, "models.json"), JSON.stringify({ providers: { a: { baseUrl: "http://localhost" } } }));
    await sleep(120);
    assert.equal(triggeredCount, 2, "rapid updates should debounce into one callback invocation");

    // Write settings.json
    writeFileSync(join(tempDir, "settings.json"), JSON.stringify({ defaultProvider: "a" }));
    await sleep(120);
    assert.equal(triggeredCount, 3, "writing settings.json must trigger invalidation");

    // Stop watcher
    stop();

    // After stopping, writes should not trigger callback
    writeFileSync(join(tempDir, "models.json"), JSON.stringify({ providers: {} }));
    await sleep(100);
    assert.equal(triggeredCount, 3, "writes after stop must not trigger callback");
  } finally {
    stopModelsWatcher();
    rmSync(tempDir, { recursive: true, force: true });
  }
});
