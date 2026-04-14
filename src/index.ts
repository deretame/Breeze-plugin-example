import {
  NOT_FOUND_IMAGE_URL,
  PLUGIN_ID,
  createActionItem,
  createComicItem,
  createImage,
  createMetadataActionList,
  createPaging,
  toStringMap,
} from "./common";
import { buildPluginInfo } from "./get-info";

type BasePayload = {
  extern?: Record<string, unknown>;
  path?: string;
  useJwt?: boolean;
  jwtToken?: string;
};

type SearchPayload = BasePayload & {
  keyword?: string;
  page?: number;
};

type ComicDetailPayload = BasePayload & {
  comicId?: string;
};

type ReadSnapshotPayload = {
  comicId?: string;
  chapterId?: string;
  extern?: Record<string, unknown>;
};

type FetchImagePayload = {
  url?: string;
  timeoutMs?: number;
};

function openSearchAction(keyword: string) {
  return {
    type: "openSearch",
    payload: {
      source: PLUGIN_ID,
      keyword,
      extern: {},
    },
  };
}

async function getInfo() {
  return buildPluginInfo();
}

async function searchComic(payload: SearchPayload = {}) {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, Number(payload.page ?? 1) || 1);
  const keyword =
    String(payload.keyword ?? extern.keyword ?? "").trim() || "example";
  const item = createComicItem("10001", `示例漫画：${keyword}`);

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    scheme: {
      version: "1.0.0",
      type: "searchResult",
      source: PLUGIN_ID,
      list: "comicGrid",
    },
    data: {
      paging: createPaging(page, 1),
      items: [item],
    },
    paging: createPaging(page, 1),
    items: [item],
  };
}

async function getComicDetail(payload: ComicDetailPayload = {}) {
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) {
    throw new Error("comicId 不能为空");
  }

  const normalizedInfo = {
    id: comicId,
    name: `示例漫画 #${comicId}`,
    description: "这是详情占位数据，用于示例工程联调。",
    addtime: "1704067200",
    total_views: "1234",
    likes: "66",
    comment_total: "5",
    author: ["example-author"],
    tags: ["example", "placeholder"],
    works: [],
    actors: [],
    related_list: [],
    liked: false,
    is_favorite: false,
    is_aids: false,
    price: "0",
    purchased: "1",
    series: [
      {
        id: "ep-1",
        name: "第1话 占位章节",
        order: 1,
        rawOrder: 1,
      },
    ],
  };

  const normal = {
    comicInfo: {
      id: String(normalizedInfo.id),
      title: normalizedInfo.name,
      titleMeta: [
        createActionItem(`浏览：${normalizedInfo.total_views}`),
        createActionItem("更新时间：2026-01-01T00:00:00.000Z"),
        createActionItem(`章节数：${normalizedInfo.series.length}`),
        createActionItem(`示例车号：${normalizedInfo.id}`),
      ],
      creator: {
        id: "creator-1",
        name: "example-author",
        avatar: createImage({
          id: "creator-1",
          url: NOT_FOUND_IMAGE_URL,
          name: "avatar",
          path: "creator/avatar.jpg",
          extension: {},
        }),
        onTap: {},
        extension: {},
      },
      description: normalizedInfo.description,
      cover: createImage({
        id: String(normalizedInfo.id),
        url: NOT_FOUND_IMAGE_URL,
        name: `${normalizedInfo.id}.jpg`,
        path: `comic/${normalizedInfo.id}/cover.jpg`,
        extension: {},
      }),
      metadata: [
        createMetadataActionList(
          "author",
          "作者",
          normalizedInfo.author,
          (item) => createActionItem(item, openSearchAction(item)),
        ),
        createMetadataActionList("tags", "标签", normalizedInfo.tags, (item) =>
          createActionItem(item, openSearchAction(item)),
        ),
        createMetadataActionList("works", "作品", normalizedInfo.works),
        createMetadataActionList("actors", "角色", normalizedInfo.actors),
      ],
      extension: {},
    },
    eps: normalizedInfo.series.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      order: Number(item.order),
      extension: {
        sort: Number(item.rawOrder),
      },
    })),
    recommend: [],
    totalViews: Number(normalizedInfo.total_views),
    totalLikes: Number(normalizedInfo.likes),
    totalComments: Number(normalizedInfo.comment_total),
    isFavourite: normalizedInfo.is_favorite,
    isLiked: normalizedInfo.liked,
    allowComments: false,
    allowLike: false,
    allowCollected: false,
    allowDownload: false,
    extension: {},
  };

  const scheme = {
    version: "1.0.0",
    type: "comicDetail",
    source: PLUGIN_ID,
  };

  const data = {
    normal,
    raw: {
      comicInfo: normalizedInfo,
      series: normalizedInfo.series,
    },
  };

  return {
    source: PLUGIN_ID,
    comicId,
    extern: payload.extern ?? null,
    scheme,
    data,
  };
}

async function getReadSnapshot(payload: ReadSnapshotPayload = {}) {
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) {
    throw new Error("comicId 不能为空");
  }
  const chapterId = String(payload.chapterId ?? "ep-1").trim() || "ep-1";

  const detail = await getComicDetail({ comicId, extern: payload.extern });
  const normal = toStringMap(toStringMap(detail.data).normal);
  const comicInfo = toStringMap(normal.comicInfo);

  const pages = [
    {
      id: "p-1",
      name: "1.jpg",
      path: `comic/${comicId}/${chapterId}/1.jpg`,
      url: NOT_FOUND_IMAGE_URL,
      extern: {},
    },
    {
      id: "p-2",
      name: "2.jpg",
      path: `comic/${comicId}/${chapterId}/2.jpg`,
      url: NOT_FOUND_IMAGE_URL,
      extern: {},
    },
  ];

  const chapters = [
    {
      id: chapterId,
      name: "第 1 话（占位）",
      order: 1,
      extern: {},
    },
  ];

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    data: {
      comic: {
        id: String(comicInfo.id ?? comicId),
        source: PLUGIN_ID,
        title: String(comicInfo.title ?? ""),
        description: String(comicInfo.description ?? ""),
        cover: {
          ...toStringMap(comicInfo.cover),
          extern: toStringMap(toStringMap(comicInfo.cover).extension),
        },
        creator: {
          ...toStringMap(comicInfo.creator),
          avatar: {
            ...toStringMap(toStringMap(comicInfo.creator).avatar),
            extern: toStringMap(
              toStringMap(toStringMap(comicInfo.creator).avatar).extension,
            ),
          },
          extern: toStringMap(toStringMap(comicInfo.creator).extension),
        },
        titleMeta: Array.isArray(comicInfo.titleMeta)
          ? comicInfo.titleMeta
          : [],
        metadata: Array.isArray(comicInfo.metadata) ? comicInfo.metadata : [],
        extern: toStringMap(comicInfo.extension),
      },
      chapter: {
        id: chapterId,
        name: "第 1 话（占位）",
        order: 1,
        pages,
        extern: {},
      },
      chapters,
    },
  };
}

async function fetchImageBytes({
  url = "",
  timeoutMs = 30000,
}: FetchImagePayload = {}) {
  const targetUrl = String(url).trim();
  if (!targetUrl) {
    throw new Error("url 不能为空");
  }
  void timeoutMs;
  return {
    nativeBufferId: 0,
  };
}

async function getSettingsBundle() {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0",
      type: "settings",
      sections: [
        {
          id: "account",
          title: "账号",
          fields: [
            { key: "auth.account", kind: "text", label: "用户名" },
            { key: "auth.password", kind: "password", label: "密码" },
          ],
        },
      ],
    },
    data: {
      canShowUserInfo: false,
      values: {
        "auth.account": "",
        "auth.password": "",
      },
    },
  };
}

export default {
  getInfo,
  searchComic,
  getComicDetail,
  getReadSnapshot,
  fetchImageBytes,
  getSettingsBundle,
};
