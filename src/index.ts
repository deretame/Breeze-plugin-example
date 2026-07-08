import type {
  AdvancedSearchContract,
  CapabilitiesBundleContract,
  ChapterContentContract,
  ChapterPage,
  ChapterPayload,
  ChapterSummary,
  ComicDetailContract,
  ComicDetailNormal,
  ComicDetailPayload,
  ComicListSceneBundleContract,
  ComicPagedListContract,
  CommentFeedContract,
  CommentFeedPayload,
  CommentItem,
  CommentMutationContract,
  CommentPostPayload,
  CommentRepliesContract,
  CommentRepliesPayload,
  CommentReplyPayload,
  FetchImageBytesPayload,
  FilterBundleContract,
  FunctionPageContract,
  GetFunctionPagePayload,
  InfoContract,
  ListFavoriteFoldersResult,
  MoveFavoriteToFolderPayload,
  ReadSnapshotContract,
  ReadSnapshotPayload,
  SearchComicPayload,
  SearchResultContract,
  SettingChangedPayload,
  SettingsBundleContract,
  ToggleFavoritePayload,
  ToggleFavoriteResult,
  ToggleLikePayload,
  ToggleLikeResult,
  UserInfoBundleContract,
} from "breeze-plugin-kit";
import {
  cache,
  flutterTools,
  opencc,
  pluginConfig,
  runtime,
} from "breeze-plugin-kit";
import {
  NOT_FOUND_IMAGE_URL,
  PLUGIN_ID,
  createActionItem,
  createComicItem,
  createImage,
  createMetadataActionList,
  toStringMap,
} from "./common";
import { buildPluginInfo } from "./get-info";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** 构建示例章节列表 */
function buildExampleChapters(comicId: string): ChapterSummary[] {
  void comicId;
  return [
    {
      id: "ep-1",
      requestId: "ep-1",
      logicalKey: "ep-1",
      storageChapterId: "ep-1",
      name: "第1话 占位章节",
      order: 1,
      extern: {},
    },
  ];
}

/** 解析 requestId / chapterId 到具体章节 */
function resolveChapterByRequestId(
  chapters: ChapterSummary[],
  input: unknown,
): ChapterSummary {
  const id = String(input ?? "").trim();
  return chapters.find((c) => c.requestId === id || c.id === id) ?? chapters[0];
}

/** 构建示例章节图片 */
function createChapterPages(
  comicId: string,
  storageChapterId: string,
): ChapterPage[] {
  return [
    {
      id: "p-1",
      name: "1.jpg",
      path: `comic/${comicId}/${storageChapterId}/1.jpg`,
      url: NOT_FOUND_IMAGE_URL,
      extern: {},
    },
    {
      id: "p-2",
      name: "2.jpg",
      path: `comic/${comicId}/${storageChapterId}/2.jpg`,
      url: NOT_FOUND_IMAGE_URL,
      extern: {},
    },
  ];
}

// ---------------------------------------------------------------------------
// getInfo — 插件注册信息
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// init — 插件初始化（可选）
// ---------------------------------------------------------------------------

/** 插件初始化 — 每次加载/热更新后调用一次 */
async function init(): Promise<{ source: string; data: { ok: boolean } }> {
  console.log("[init] 插件初始化");

  // 示例：从持久化配置中读取上次保存的登录账号
  const raw = await pluginConfig.load("auth.account", "");
  try {
    const { value } = JSON.parse(raw);
    console.log("[init] 上次登录账号:", value);
  } catch {
    // 没有保存过或解析失败，忽略
  }

  return { source: PLUGIN_ID, data: { ok: true } };
}

// ---------------------------------------------------------------------------
// getInfo — 插件注册信息
// ---------------------------------------------------------------------------

/** 插件注册信息 — Flask 宿主发现插件时调用 */
async function getInfo(): Promise<InfoContract> {
  return buildPluginInfo() as InfoContract;
}

// ---------------------------------------------------------------------------
// searchComic — 搜索漫画
// ---------------------------------------------------------------------------

/** 搜索漫画 — 关键字 / 分页 */
async function searchComic(
  payload: SearchComicPayload = {},
): Promise<SearchResultContract> {
  console.log("[searchComic]", payload);
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, Number(payload.page ?? 1) || 1);
  let keyword =
    String(payload.keyword ?? extern.keyword ?? "").trim() || "example";

  // 示例：使用 opencc 把繁体关键字转成简体再搜索（若目标站是简体）
  keyword = await opencc.convert(keyword, "t2s.json");

  // 示例：使用 cache 做进程内搜索缓存
  const cacheKey = `search:${keyword}:${page}`;
  const cached = await cache.get<SearchResultContract | null>(cacheKey, null);
  if (cached) {
    console.log("[searchComic] 命中缓存");
    return cached;
  }

  const item = createComicItem("10001", `示例漫画：${keyword}`);
  const paging = { page, pages: 1, total: 1, hasReachedMax: true };

  const result: SearchResultContract = {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    scheme: {
      version: "1.0.0" as const,
      type: "searchResult" as const,
      source: PLUGIN_ID,
      list: "comicGrid",
    },
    data: { paging, items: [item] },
    paging,
    items: [item],
  };

  await cache.set(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// getComicDetail — 漫画详情
// ---------------------------------------------------------------------------

/** 漫画详情 — 基本信息 / 章节列表 / 推荐 */
async function getComicDetail(
  payload: ComicDetailPayload = {},
): Promise<ComicDetailContract> {
  console.log("[getComicDetail]", payload);
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) throw new Error("comicId 不能为空");

  // 示例：读取插件设置，根据“允许成人内容”开关过滤标签
  const adultRaw = await pluginConfig.load("content.adult", "false");
  const isAdultAllowed = JSON.parse(adultRaw).value === true;
  console.log("[getComicDetail] 允许成人内容:", isAdultAllowed);

  const normalizedInfo = {
    id: comicId,
    name: `示例漫画 #${comicId}`,
    description: "这是详情占位数据，用于示例工程联调。",
    total_views: "1234",
    likes: "66",
    comment_total: "5",
    author: ["example-author"],
    tags: ["example", "placeholder"],
    works: [] as string[],
    actors: [] as string[],
    related_list: [] as string[],
    liked: false,
    is_favorite: false,
    series: buildExampleChapters(comicId),
  };

  const normal: ComicDetailNormal = {
    comicInfo: {
      id: String(normalizedInfo.id),
      title: normalizedInfo.name,
      titleMeta: [
        createActionItem(`浏览：${normalizedInfo.total_views}`),
        createActionItem(`章节数：${normalizedInfo.series.length}`),
      ],
      creator: {
        id: "creator-1",
        name: "example-author",
        avatar: createImage({
          id: "creator-1",
          url: NOT_FOUND_IMAGE_URL,
          name: "avatar",
          path: "creator/avatar.jpg",
          extern: {},
        }),
        onTap: {},
        extern: {},
      },
      description: normalizedInfo.description,
      cover: createImage({
        id: normalizedInfo.id,
        url: NOT_FOUND_IMAGE_URL,
        name: `${normalizedInfo.id}.jpg`,
        path: `comic/${normalizedInfo.id}/cover.jpg`,
        extern: {},
      }),
      metadata: [
        createMetadataActionList("author", "作者", normalizedInfo.author),
        createMetadataActionList("tags", "标签", normalizedInfo.tags),
      ],
      extern: {},
    },
    eps: normalizedInfo.series.map((item) => ({
      id: String(item.id),
      requestId: String(item.requestId),
      logicalKey: String(item.logicalKey),
      storageChapterId: String(item.storageChapterId),
      name: String(item.name),
      order: Number(item.order),
      extern: item.extern,
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
    extern: {},
  };

  return {
    source: PLUGIN_ID,
    comicId,
    extern: payload.extern ?? null,
    scheme: {
      version: "1.0.0" as const,
      type: "comicDetail" as const,
      source: PLUGIN_ID,
    },
    data: {
      normal,
      raw: {
        comicInfo: normalizedInfo,
        series: normalizedInfo.series,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// getChapter — 章节内容（下载场景）
// ---------------------------------------------------------------------------

/** 获取章节内容（下载用） — 返回该章的全部图片 */
async function getChapter(
  payload: ChapterPayload = {},
): Promise<ChapterContentContract> {
  console.log("[getChapter]", payload);
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) throw new Error("comicId 不能为空");

  const chapters = buildExampleChapters(comicId);
  const chapter = resolveChapterByRequestId(chapters, payload.chapterId);
  const pages = createChapterPages(comicId, chapter.storageChapterId);

  return {
    source: PLUGIN_ID,
    comicId,
    chapterId: chapter.id,
    extern: payload.extern ?? null,
    scheme: {
      version: "1.0.0" as const,
      type: "chapterContent" as const,
      source: PLUGIN_ID,
    },
    data: {
      comic: {
        id: comicId,
        source: PLUGIN_ID,
        title: chapter.name,
        extern: chapter.extern,
      },
      chapter: {
        id: chapter.id,
        requestId: chapter.requestId,
        logicalKey: chapter.logicalKey,
        storageChapterId: chapter.storageChapterId,
        name: chapter.name,
        order: chapter.order,
        pages,
        extern: chapter.extern,
      },
      chapters: chapters.map((item) => ({
        id: item.id,
        requestId: item.requestId,
        logicalKey: item.logicalKey,
        storageChapterId: item.storageChapterId,
        name: item.name,
        order: item.order,
        extern: item.extern,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// getReadSnapshot — 阅读快照（在线阅读用）
// ---------------------------------------------------------------------------

/** 获取阅读快照 — 返回当前章节图片 + 章节导航列表 */
async function getReadSnapshot(
  payload: ReadSnapshotPayload = {},
): Promise<ReadSnapshotContract> {
  console.log("[getReadSnapshot]", payload);
  const comicId = String(payload.comicId ?? "").trim();
  if (!comicId) throw new Error("comicId 不能为空");

  const chapters = buildExampleChapters(comicId);
  const currentChapter = resolveChapterByRequestId(chapters, payload.chapterId);
  const pages = createChapterPages(comicId, currentChapter.storageChapterId);

  const detail = await getComicDetail({ comicId, extern: payload.extern });
  const normal = toStringMap(toStringMap(detail.data).normal);
  const comicInfo = toStringMap(normal.comicInfo);

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    data: {
      comic: {
        id: String(comicInfo.id ?? comicId),
        source: PLUGIN_ID,
        title: String(comicInfo.title ?? ""),
        extern: toStringMap(comicInfo.extern),
      },
      chapter: {
        id: currentChapter.id,
        requestId: currentChapter.requestId,
        logicalKey: currentChapter.logicalKey,
        storageChapterId: currentChapter.storageChapterId,
        name: currentChapter.name,
        order: currentChapter.order,
        pages,
        extern: currentChapter.extern,
      },
      chapters: chapters.map((item) => ({
        id: item.id,
        name: item.name,
        order: item.order,
        extern: item.extern,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// fetchImageBytes — 下载图片
// ---------------------------------------------------------------------------

/** 下载图片二进制数据 */
async function fetchImageBytes({
  url = "",
  timeoutMs = 30000,
  taskGroupKey = "",
  extern = {},
}: FetchImageBytesPayload = {}): Promise<Uint8Array<ArrayBufferLike>> {
  console.log("[fetchImageBytes]", { url, timeoutMs, taskGroupKey, extern });
  const targetUrl = String(url).trim();
  if (!targetUrl) throw new Error("url 不能为空");

  // 示例：检查下载任务是否已被取消
  if (taskGroupKey && (await runtime.isTaskGroupCancelled(taskGroupKey))) {
    console.log("[fetchImageBytes] 任务已取消，跳过下载");
    return new Uint8Array(new ArrayBuffer(0));
  }

  // 示例：使用 fetch 下载图片，并加上二进制响应优化头
  const res = await fetch(targetUrl, {
    headers: { "x-rquickjs-host-offload-binary-v1": "1" },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`下载失败: ${res.status} ${res.statusText}`);
  }

  return new Uint8Array(await res.arrayBuffer());
}

// ---------------------------------------------------------------------------
// toggleLike — 点赞
// ---------------------------------------------------------------------------

/** 点赞 / 取消点赞 */
async function toggleLike(
  payload: ToggleLikePayload = {},
): Promise<ToggleLikeResult> {
  console.log("[toggleLike]", payload);
  void payload;
  return { liked: !Boolean(payload.currentLiked) };
}

// ---------------------------------------------------------------------------
// toggleFavorite — 收藏
// ---------------------------------------------------------------------------

/** 收藏 / 取消收藏 */
async function toggleFavorite(
  payload: ToggleFavoritePayload = {},
): Promise<ToggleFavoriteResult> {
  console.log("[toggleFavorite]", payload);
  void payload;
  return { favorited: !Boolean(payload.currentFavorite), nextStep: "none" };
}

// ---------------------------------------------------------------------------
// listFavoriteFolders — 收藏夹列表
// ---------------------------------------------------------------------------

/** 获取收藏夹列表 */
async function listFavoriteFolders(): Promise<ListFavoriteFoldersResult> {
  return { items: [{ id: "fav-1", name: "默认收藏夹" }] };
}

// ---------------------------------------------------------------------------
// moveFavoriteToFolder — 移动到收藏夹
// ---------------------------------------------------------------------------

/** 将漫画移动到指定收藏夹 */
async function moveFavoriteToFolder(
  payload: MoveFavoriteToFolderPayload = {},
): Promise<{ ok: boolean }> {
  console.log("[moveFavoriteToFolder]", payload);
  void payload;
  return { ok: true };
}

// ---------------------------------------------------------------------------
// getAdvancedSearchScheme — 高级搜索方案
// ---------------------------------------------------------------------------

/** 高级搜索方案 — 定义搜索页面上的筛选字段 */
async function getAdvancedSearchScheme(
  _payload: Record<string, unknown> = {},
): Promise<AdvancedSearchContract> {
  console.log("[getAdvancedSearchScheme]", _payload);
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "advancedSearch" as const,
      title: "高级搜索",
      fields: [
        {
          key: "sortBy",
          kind: "choice" as const,
          label: "排序",
          options: [
            { label: "最新", value: "latest" },
            { label: "最热", value: "hot" },
          ],
        },
        {
          key: "categories",
          kind: "multiChoice" as const,
          label: "分类选择",
          options: [
            { label: "示例分类 A", value: "cat-a" },
            { label: "示例分类 B", value: "cat-b" },
            { label: "示例分类 C", value: "cat-c" },
          ],
        },
        {
          key: "freeOnly",
          kind: "switch" as const,
          label: "只看免费",
        },
        {
          key: "minPages",
          kind: "text" as const,
          label: "最少页数",
        },
      ],
    },
    data: { values: { sortBy: "latest" } },
  };
}

// ---------------------------------------------------------------------------
// getComicListSceneBundle — 漫画列表场景
// ---------------------------------------------------------------------------

/** 漫画列表场景 — 定义排行榜 / 最新 / 分类等 tab */
async function getComicListSceneBundle(): Promise<ComicListSceneBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "comicListSceneBundle" as const,
    },
    data: {
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
  };
}

// ---------------------------------------------------------------------------
// getRankingData — 榜单数据
// ---------------------------------------------------------------------------

/** 分页漫画列表（排行榜 / 最新 / 分类等共享此函数） */
async function getRankingData(
  _payload: SearchComicPayload = {},
): Promise<ComicPagedListContract> {
  console.log("[getRankingData]", _payload);
  const item = createComicItem("rank-1", "示例榜单漫画");
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "rankingFeed" as const,
    },
    data: {
      hasReachedMax: true,
      items: [item],
    },
  };
}

// ---------------------------------------------------------------------------
// getRankingFilterBundle — 榜单筛选
// ---------------------------------------------------------------------------

/** 榜单筛选 — choice 类型的 FilterField 示例 */
async function getRankingFilterBundle(): Promise<FilterBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      fields: [
        {
          key: "rankType",
          kind: "choice" as const,
          label: "榜单类型",
          options: [
            {
              label: "日榜",
              value: "day",
              result: { extern: { rankType: "day" } },
            },
            {
              label: "周榜",
              value: "week",
              result: { extern: { rankType: "week" } },
            },
            {
              label: "月榜",
              value: "month",
              result: { extern: { rankType: "month" } },
            },
          ],
        },
      ],
    },
    data: { values: { rankType: "day" } },
  };
}

// ---------------------------------------------------------------------------
// getCommentFeed — 评论列表
// ---------------------------------------------------------------------------

/** 获取评论列表 */
async function getCommentFeed(
  _payload: CommentFeedPayload = {},
): Promise<CommentFeedContract> {
  console.log("[getCommentFeed]", _payload);
  const comment: CommentItem = {
    id: "c-1",
    author: { name: "示例用户", avatar: { url: "", path: "" } },
    content: "这是占位评论内容",
    createdAt: "2026-01-01",
    replyCount: 0,
    replies: [],
    extern: {},
  };
  return {
    source: PLUGIN_ID,
    extern: null,
    scheme: { version: "1.0.0" as const, type: "commentFeed" as const },
    data: {
      topItems: [],
      items: [comment],
      paging: { hasReachedMax: true },
      replyMode: "lazy",
      canComment: { comic: false, reply: false },
    },
  };
}

// ---------------------------------------------------------------------------
// loadCommentReplies — 评论回复列表
// ---------------------------------------------------------------------------

/** 获取评论的回复列表 */
async function loadCommentReplies(
  _payload: CommentRepliesPayload = {},
): Promise<CommentRepliesContract> {
  console.log("[loadCommentReplies]", _payload);
  return {
    source: PLUGIN_ID,
    extern: null,
    scheme: { version: "1.0.0" as const, type: "commentReplies" as const },
    data: {
      commentId: "c-1",
      items: [],
      paging: { hasReachedMax: true },
    },
  };
}

// ---------------------------------------------------------------------------
// postComment — 发送评论
// ---------------------------------------------------------------------------

/** 发送评论 */
async function postComment(
  _payload: CommentPostPayload = {},
): Promise<CommentMutationContract> {
  console.log("[postComment]", _payload);
  return {
    source: PLUGIN_ID,
    scheme: { version: "1.0.0" as const, type: "commentMutation" as const },
    data: {
      ok: true,
      mode: "postComment",
      created: null,
      insertHint: { needsRefetch: true },
    },
  };
}

// ---------------------------------------------------------------------------
// postCommentReply — 回复评论
// ---------------------------------------------------------------------------

/** 回复评论 */
async function postCommentReply(
  _payload: CommentReplyPayload = {},
): Promise<CommentMutationContract> {
  console.log("[postCommentReply]", _payload);
  return {
    source: PLUGIN_ID,
    scheme: { version: "1.0.0" as const, type: "commentMutation" as const },
    data: {
      ok: true,
      mode: "postReply",
      parentId: "c-1",
      created: null,
      insertHint: {
        strategy: "prepend",
        targetCommentId: "c-1",
        needsRefetch: true,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// getSettingsBundle — 设置方案
// ---------------------------------------------------------------------------

/**
 * 设置方案 — 定义插件设置页面 UI。
 *
 * 支持的 FieldKind:
 * - `text`     : 文本输入
 * - `password` : 密码输入（掩码）
 * - `switch`   : 开关
 * - `choice`   : 单选下拉 / 选择
 * - `multiChoice` : 多选弹窗
 *
 * fnPath 可用于字段变更时回调插件函数：
 *   当用户在设置页修改字段值后，插件会收到 fnPath 对应的调用，
 *   参数为 { key, value, allValues }。
 * persist: false 会禁止自动保存到本地数据库。
 */
async function getSettingsBundle(): Promise<SettingsBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "settings" as const,
      sections: [
        // ---------- account ----------
        {
          title: "账号",
          fields: [
            {
              key: "auth.account",
              kind: "text",
              label: "用户名",
              fnPath: "onAuthChanged",
              persist: true,
            },
            {
              key: "auth.password",
              kind: "password",
              label: "密码",
              fnPath: "onAuthChanged",
              persist: true,
            },
            {
              key: "auth.remember",
              kind: "switch",
              label: "记住密码",
              fnPath: "onRememberChanged",
            },
          ],
        },
        // ---------- display ----------
        {
          title: "显示",
          fields: [
            {
              key: "display.theme",
              kind: "choice",
              label: "主题",
              options: [
                { label: "跟随系统", value: "auto" },
                { label: "浅色", value: "light" },
                { label: "深色", value: "dark" },
              ],
              fnPath: "onThemeChanged",
            },
            {
              key: "display.quality",
              kind: "choice",
              label: "画质",
              fnPath: "onQualityChanged",
              options: [
                { label: "原图", value: "original" },
                { label: "高", value: "high" },
                { label: "中", value: "medium" },
                { label: "低", value: "low" },
              ],
            },
          ],
        },
        // ---------- content ----------
        {
          title: "内容",
          fields: [
            {
              key: "content.adult",
              kind: "switch",
              label: "允许成人内容",
              fnPath: "onAdultChanged",
            },
            {
              key: "content.hiddenTags",
              kind: "multiChoice",
              label: "屏蔽标签",
              fnPath: "onHiddenTagsChanged",
              options: [
                { label: "标签 A", value: "tag-a" },
                { label: "标签 B", value: "tag-b" },
                { label: "标签 C", value: "tag-c" },
                { label: "标签 D", value: "tag-d" },
              ],
            },
          ],
        },
      ],
    },
    data: {
      canShowUserInfo: false,
      values: {
        "auth.account": "",
        "auth.password": "",
        "auth.remember": false,
        "display.theme": "auto",
        "display.quality": "original",
        "content.adult": false,
        "content.hiddenTags": [],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Capabilities — "操作" 区段
// ---------------------------------------------------------------------------

/** 设置页底部"操作"区段 */
async function getCapabilitiesBundle(): Promise<CapabilitiesBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "capabilities" as const,
      actions: [
        { key: "clear", title: "清理插件缓存", fnPath: "clearPluginCache" },
      ],
    },
    data: {},
  };
}

// ---------------------------------------------------------------------------
// getUserInfoBundle — 用户信息卡片
// ---------------------------------------------------------------------------

/** 设置页用户信息卡片 */
async function getUserInfoBundle(): Promise<UserInfoBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: { version: "1.0.0" as const, type: "userInfo" as const },
    data: {
      title: "账号信息",
      avatar: createImage({
        id: "u-1",
        url: "",
        name: "avatar",
        path: "u/1.jpg",
        extern: {},
      }),
      lines: ["用户名: example", "等级: 1", "经验: 0"],
    },
  };
}

// ---------------------------------------------------------------------------
// getFunctionPage — 插件自定义页面
// ---------------------------------------------------------------------------

/** 插件自定义页面 */
async function getFunctionPage(
  _payload: GetFunctionPagePayload = {},
): Promise<FunctionPageContract> {
  // 示例：返回一个带标题的空列表页面
  return {
    source: PLUGIN_ID,
    scheme: {
      version: "1.0.0" as const,
      type: "page" as const,
      title: "示例自定义页面",
      body: { type: "list", children: [] },
    },
    data: { message: "这是 getFunctionPage 返回的示例页面。" },
  };
}

// ---------------------------------------------------------------------------
// fnPath 回调 — 设置页字段变更时调用
// ---------------------------------------------------------------------------

/** 用户名/密码变更回调——建议在两次变更完后统一校验并登录 */
async function onAuthChanged(
  payload: SettingChangedPayload<string> = { extern: {}, key: "", value: "" },
): Promise<Record<string, unknown>> {
  console.log("[onAuthChanged]", payload);

  // 示例：把当前值临时保存到配置中，提交时再统一读取
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));

  // 示例：调用 Flutter Toast 提示用户
  await flutterTools.showToast({
    message: `${payload.key} 已更新`,
    level: "info",
    seconds: 2,
  });

  return {};
}

/** 记住密码开关变更回调 */
async function onRememberChanged(
  payload: SettingChangedPayload<boolean> = {
    extern: {},
    key: "",
    value: false,
  },
): Promise<Record<string, unknown>> {
  console.log("[onRememberChanged]", payload);
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));

  if (payload.value) {
    // 用户打开了"记住密码"，这里可以读取 auth.account / auth.password 做持久化登录
  }
  return {};
}

/** 主题变更回调 */
async function onThemeChanged(
  payload: SettingChangedPayload<string> = { extern: {}, key: "", value: "" },
): Promise<Record<string, unknown>> {
  console.log("[onThemeChanged]", payload);
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));
  return {};
}

/** 画质变更回调 */
async function onQualityChanged(
  payload: SettingChangedPayload<string> = { extern: {}, key: "", value: "" },
): Promise<Record<string, unknown>> {
  console.log("[onQualityChanged]", payload);
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));
  return {};
}

/** 成人内容开关变更回调 */
async function onAdultChanged(
  payload: SettingChangedPayload<boolean> = {
    extern: {},
    key: "",
    value: false,
  },
): Promise<Record<string, unknown>> {
  console.log("[onAdultChanged]", payload);
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));
  return {};
}

/** 屏蔽标签多选变更回调 */
async function onHiddenTagsChanged(
  payload: SettingChangedPayload<string[]> = {
    extern: {},
    key: "content.hiddenTags",
    value: [],
  },
): Promise<Record<string, unknown>> {
  console.log("[onHiddenTagsChanged]", payload);
  await pluginConfig.save(payload.key, JSON.stringify({ value: payload.value }));
  return {};
}

/** 清理插件缓存操作 */
async function clearPluginCache(): Promise<Record<string, unknown>> {
  // 示例：清理进程内缓存
  await cache.set("search:example:1", null);
  await flutterTools.showToast({
    message: "缓存已清理",
    level: "success",
    seconds: 2,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// default export — 导出所有函数
// ---------------------------------------------------------------------------

export default {
  // lifecycle
  init,
  getInfo,

  // core
  searchComic,
  getComicDetail,
  getChapter,
  getReadSnapshot,
  fetchImageBytes,

  // social
  toggleLike,
  toggleFavorite,
  listFavoriteFolders,
  moveFavoriteToFolder,
  getCommentFeed,
  loadCommentReplies,
  postComment,
  postCommentReply,

  // discovery
  getAdvancedSearchScheme,
  getComicListSceneBundle,
  getRankingData,
  getRankingFilterBundle,

  // settings
  getSettingsBundle,
  getCapabilitiesBundle,
  getUserInfoBundle,

  // fnPath callbacks
  onAuthChanged,
  onRememberChanged,
  onThemeChanged,
  onQualityChanged,
  onAdultChanged,
  onHiddenTagsChanged,
  clearPluginCache,

  // function pages
  getFunctionPage,
};
