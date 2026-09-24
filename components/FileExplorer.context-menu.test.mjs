import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const explorerSource = await readFile(new URL("./FileExplorer.tsx", import.meta.url), "utf8");
const filesRouteSource = await readFile(new URL("../app/api/files/[...path]/route.ts", import.meta.url), "utf8");
const desktopNativeSource = await readFile(new URL("../lib/desktop-native.ts", import.meta.url), "utf8");
const zhCNSource = await readFile(new URL("../lib/i18n/messages/zh-CN.ts", import.meta.url), "utf8");
const zhTWSource = await readFile(new URL("../lib/i18n/messages/zh-TW.ts", import.meta.url), "utf8");
const enSource = await readFile(new URL("../lib/i18n/messages/en.ts", import.meta.url), "utf8");

test("FileExplorer provides right-click context menu with reveal in explorer and more tools", () => {
  // Checks onContextMenu on rows
  assert.match(explorerSource, /onContextMenu=\{handleContextMenu\}/);
  assert.match(explorerSource, /onContextMenu=\{handleOpenContextMenu\}/);
  // Checks reveal in explorer and more tools
  assert.match(explorerSource, /files\.revealInExplorer/);
  assert.match(explorerSource, /files\.moreTools/);
  assert.match(explorerSource, /renderSubmenuItems/);
  assert.match(explorerSource, /handleReveal/);
});

test("API route supports type=reveal and type=open for OS integration", () => {
  assert.match(filesRouteSource, /type === "reveal"/);
  assert.match(filesRouteSource, /type === "open"/);
  assert.match(filesRouteSource, /explorer\.exe/);
  assert.match(filesRouteSource, /rundll32\.exe/);
});

test("desktop-native provides web fallback for revealItemInDirNative and openPathNative", () => {
  assert.match(desktopNativeSource, /export async function revealItemInDirNative/);
  assert.match(desktopNativeSource, /type=reveal/);
  assert.match(desktopNativeSource, /export async function openPathNative/);
  assert.match(desktopNativeSource, /type=open/);
});

test("i18n dictionaries include file context menu translations", () => {
  assert.match(zhCNSource, /"files\.revealInExplorer": "在文件浏览器中显示"/);
  assert.match(zhCNSource, /"files\.openWithDefaultApp": "用默认应用打开"/);
  assert.match(zhTWSource, /"files\.revealInExplorer": "在檔案總管中顯示"/);
  assert.match(zhTWSource, /"files\.openWithDefaultApp": "用預設應用程式開啟"/);
  assert.match(enSource, /"files\.revealInExplorer": "Reveal in File Explorer"/);
  assert.match(enSource, /"files\.openWithDefaultApp": "Open with Default App"/);
});
