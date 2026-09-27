# 模型列表随 Provider 与配置变更实时同步实施计划

> **For Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现当外部配置文件（`~/.pi/agent/models.json`、`settings.json`、`auth.json`）修改，或内部 Provider 配置更新时，前端实时自动感知并无刷新更新模型列表。

**Architecture:** 在 Next.js 服务端维护全局单例文件监听器（`lib/models-watcher.ts`），利用 200ms 防抖及 mtime/size 校验监控 `~/.pi/agent/` 下关键配置文件的变更；在 `lib/models-cache.ts` 维护全局 `modelsVersion` 版本号，并在失效时广播；通过 `/api/agent/running/events` SSE 帧注入 `modelsVersion` 推送至前端；前端 `AppShell` 接收版本变动后递增 `modelsRefreshKey` 触发无感重新获取模型。

**Tech Stack:** Node.js, Next.js 16, TypeScript, React 19, Server-Sent Events (SSE), Node.js native test runner (`node --test`).

---

### Task 1: 服务端模型版本号与失效广播通知

**Files:**
- Modify: `lib/models-cache.ts`
- Modify: `lib/rpc-manager.ts`
- Test: `lib/models-cache.test.mjs`

**Step 1: 编写版本号与广播机制的失败测试**
在 `lib/models-cache.test.mjs` 中添加针对 `getModelsVersion()`、失效自增和监听回调的测试用例。

**Step 2: 运行测试验证失败**
运行：`node --test lib/models-cache.test.mjs`
预期：FAIL，提示 `getModelsVersion` 或监听函数未定义。

**Step 3: 编写最小实现代码**
- 在 `lib/models-cache.ts` 中维护全局 `modelsVersion`；
- 导出 `getModelsVersion(): number`；
- 导出 `onModelsCacheInvalidated(listener: () => void): () => void`；
- 在 `invalidateModelsCache()` 中递增 `modelsVersion` 并通知监听者；
- 在 `lib/rpc-manager.ts` 中订阅该事件，触发已有的 `notifyRunningChange()`（以便立即推送 SSE）。

**Step 4: 运行测试验证通过**
运行：`node --test lib/models-cache.test.mjs`
预期：PASS。

**Step 5: 提交更改**
```bash
git add lib/models-cache.ts lib/rpc-manager.ts lib/models-cache.test.mjs
git commit -m "feat(models): add modelsVersion tracking and cache invalidation broadcast"
```

---

### Task 2: 配置文件防抖监听器 (`lib/models-watcher.ts`)

**Files:**
- Create: `lib/models-watcher.ts`
- Create: `lib/models-watcher.test.mjs`

**Step 1: 编写文件监听器的失败测试**
在 `lib/models-watcher.test.mjs` 中，创建临时配置目录并挂载 Watcher，测试写入/修改/删除 `models.json` 和 `settings.json` 时，是否在 200ms 防抖后精确触发一次回调。

**Step 2: 运行测试验证失败**
运行：`node --test lib/models-watcher.test.mjs`
预期：FAIL，找不到模块 `lib/models-watcher.ts`。

**Step 3: 编写监听器实现**
- 创建 `lib/models-watcher.ts`；
- 监控目录：传入的 `agentDir`（生产默认使用 `getAgentDir()`）；
- 关注文件白名单：`models.json`、`settings.json`、`auth.json`；
- 实现 200ms 防抖计时器；
- 维护已记录文件的 `mtimeMs` 与 `size` 映射，仅在状态真正改变时调用 `invalidateModelsCache()`；
- 使用 `globalThis.__piModelsWatcher` 保证 Next.js 开发热重载下单例运行。

**Step 4: 运行测试验证通过**
运行：`node --test lib/models-watcher.test.mjs`
预期：PASS。

**Step 5: 提交更改**
```bash
git add lib/models-watcher.ts lib/models-watcher.test.mjs
git commit -m "feat(models): implement debounced file watcher for agent configuration"
```

---

### Task 3: 将 `modelsVersion` 注入 SSE 事件流与 API 响应

**Files:**
- Modify: `app/api/agent/running/events/route.ts`
- Modify: `app/api/models/route.ts`
- Modify: `app/api/agent/events-route.test.mjs`

**Step 1: 编写 SSE 路由测试验证新字段**
在 `app/api/agent/events-route.test.mjs` 中增加断言，验证推送的 JSON 帧中包含数字类型的 `modelsVersion`。

**Step 2: 运行测试验证失败**
运行：`node --test app/api/agent/events-route.test.mjs`
预期：FAIL，缺失 `modelsVersion` 字段。

**Step 3: 编写最小实现**
- 在 `app/api/agent/running/events/route.ts` 中引入 `getModelsVersion`，并启动 `startModelsWatcher()`；
- 在 Initial Snapshot 和后续 `subscribeRunningSessions` 广播帧中包含 `modelsVersion: getModelsVersion()`；
- 在 `app/api/models/route.ts` 的返回体中包含 `modelsVersion: getModelsVersion()`。

**Step 4: 运行测试验证通过**
运行：`node --test app/api/agent/events-route.test.mjs`
预期：PASS。

**Step 5: 提交更改**
```bash
git add app/api/agent/running/events/route.ts app/api/models/route.ts app/api/agent/events-route.test.mjs
git commit -m "feat(models): stream modelsVersion in running SSE frames and models API"
```

---

### Task 4: 前端客户端全局监听与自动重载联动

**Files:**
- Modify: `components/SessionSidebar.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `hooks/useAgentSession.ts`
- Create / Modify: `components/ModelSync.test.mjs`

**Step 1: 编写前端模型同步逻辑测试**
验证在收到 `modelsVersion` 增加时，触发 `modelsRefreshKey` 递增；以及模型失效时的回退行为。

**Step 2: 运行测试验证失败**
运行：`node --test components/ModelSync.test.mjs`
预期：FAIL。

**Step 3: 编写前端实现**
- 在 `components/SessionSidebar.tsx`（或传递回调给 `AppShell.tsx`）的 SSE `onmessage` 中读取 `data.modelsVersion`；
- 当 `data.modelsVersion` 变动时，调用 `onModelsVersionChange(data.modelsVersion)`，触发 `setModelsRefreshKey((k) => k + 1)`；
- 在 `hooks/useAgentSession.ts` 中，当 `loadModels` 获取到新的模型列表后：
  - 如果当前选中的模型已不在新列表中，安全退回至 `defaultModel` 或列表中可用模型，并提示 notice。

**Step 4: 运行测试验证通过**
运行：`node --test components/ModelSync.test.mjs`
预期：PASS。

**Step 5: 提交更改**
```bash
git add components/SessionSidebar.tsx components/AppShell.tsx hooks/useAgentSession.ts components/ModelSync.test.mjs
git commit -m "feat(models): connect frontend SSE listener to auto-refresh model list"
```

---

### Task 5: 整体集成验证与类型代码检查

**Files:**
- All touched files

**Step 1: 运行全量单元与集成测试**
运行：`npm test`
预期：所有测试套件全部通过（0 failures）。

**Step 2: 运行 TypeScript 类型检查**
运行：`node_modules/.bin/tsc --noEmit`
预期：0 errors。

**Step 3: 运行代码规范检查 (Lint)**
运行：`npm run lint`
预期：0 errors。

**Step 4: 提交并完成**
```bash
git commit --allow-empty -m "chore: complete model list auto-sync verification"
```
