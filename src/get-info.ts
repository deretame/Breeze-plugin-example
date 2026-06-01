import { PLUGIN_ID } from "./common";
import type { InfoContract } from "../types/type";

export function buildPluginInfo(): InfoContract {
  return {
    name: "Example Plugin",
    uuid: PLUGIN_ID,
    iconUrl: "https://httpstat.us/404",
    creator: {
      name: "example",
      describe: "占位作者信息",
    },
    describe: "Breeze 插件示例工程（含全部类型示例）",
    version: "0.1.0",
    home: "https://example.com",
    updateUrl: "https://httpstat.us/404",
    npmName: "breeze-plugin-example",
    function: [
      // 目前仅推荐使用 openComicList 作为自定义页面入口
      {
        id: "ranking",
        title: "排行榜",
        action: {
          type: "openComicList" as const,
          payload: {
            scene: {
              title: "示例排行榜",
              source: PLUGIN_ID,
              body: {
                type: "pluginPagedComicList" as const,
                request: {
                  fnPath: "getRankingData",
                  core: {},
                  extern: { source: "ranking" },
                },
              },
              filter: {
                fnPath: "getRankingFilterBundle",
                extern: { source: "ranking" },
              },
            },
          },
        },
      },
      {
        id: "favorite",
        title: "云端收藏",
        action: {
          type: "openComicList" as const,
          payload: {
            scene: {
              title: "云端收藏",
              source: PLUGIN_ID,
              body: {
                type: "pluginPagedComicList" as const,
                request: {
                  fnPath: "getRankingData",
                  core: {},
                  extern: { source: "favorite" },
                },
              },
              filter: {
                fnPath: "getRankingFilterBundle",
                extern: { source: "favorite" },
              },
            },
          },
        },
      },
    ],
  };
}

export function buildManifestInfo(): InfoContract {
  return buildPluginInfo();
}
