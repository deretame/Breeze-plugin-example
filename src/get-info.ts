import { PLUGIN_ID } from "./common";
import type { PluginInfo } from "../types/type";

export function buildPluginInfo(): PluginInfo {
  return {
    name: "Example Plugin",
    uuid: PLUGIN_ID,
    iconUrl: "https://httpstat.us/404",
    creator: {
      name: "example",
      describe: "占位作者信息",
    },
    describe: "Breeze 插件示例工程（占位实现）",
    version: "0.1.0",
    home: "https://example.com",
    updateUrl: "https://httpstat.us/404",
    npmName: "breeze-plugin-example",
    function: [
      {
        id: "search",
        title: "搜索",
        action: {
          type: "openSearch",
          payload: { source: PLUGIN_ID, keyword: "example" },
        },
      },
      {
        id: "detail",
        title: "详情",
        action: {
          type: "openComicDetail",
          payload: { comicId: "10001" },
        },
      },
    ],
  };
}

export function buildManifestInfo(): PluginInfo {
  return buildPluginInfo();
}
