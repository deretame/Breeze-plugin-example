/**
 * 进程内缓存，塞什么出来就是什么。
 *
 * @example
 *   await cache.set("foo", { x: 1 });
 *   const got = await cache.get<{ x: number }>("foo", null);  // { x: 1 }
 */
export const cache = {
  get: <T = unknown>(key: string, fallback: T = null as T): Promise<T> =>
    bridge.call("cache.get", key, fallback) as Promise<T>,
  getSync: (key: string, fallback: unknown = null): unknown =>
    bridge.callSync("cache.get.sync", key, fallback),
  set: (key: string, value: unknown) =>
    bridge.call("cache.set", key, value) as Promise<boolean>,
  setSync: (key: string, value: unknown): boolean =>
    bridge.callSync("cache.set.sync", key, value) as boolean,
  setIfAbsent: (key: string, value: unknown) =>
    bridge.call("cache.set_if_absent", key, value) as Promise<boolean>,
  compareAndSet: (key: string, expected: unknown, next: unknown) =>
    bridge.call(
      "cache.compare_and_set",
      key,
      expected,
      next,
    ) as Promise<boolean>,
  delete: (key: string) => bridge.call("cache.delete", key) as Promise<boolean>,
};

export const pluginConfig = {
  /**
   * 持久化配置存储：保存配置。
   * * value 需要是 JSON 字符串，Dart 端会 `jsonDecode` 后存入 ObjectBox。
   *
   * @example
   * ```ts
   * await pluginConfig.save("site", "\"EH\"");
   * await pluginConfig.save("opts", JSON.stringify({ a: 1 }));
   * ```
   * @param key 配置键名
   * @param value 要保存的 JSON 字符串
   */
  save: <T = unknown>(key: string, value: string): Promise<T> =>
    bridge.call("save_plugin_config", key, value) as Promise<T>,

  /**
   * 持久化配置存储：读取配置。
   * * 直接返回 `{ ok: boolean, value: unknown }` 对象。
   * * 当 `ok === true` 时，可取 `value` 作为存储值。
   * * 当 `ok === false` 或读取失败时，可视为 key 不存在。
   *
   * @example
   * ```ts
   * const raw = await pluginConfig.load<Record<string, unknown>>("site", "\"EH\"");
   * if (raw.ok === true) {
   *   console.log(raw.value); // "EH"
   * }
   * ```
   * @param key 配置键名
   * @param fallback 找不到键时的默认返回值（JSON 字符串），默认为 ""
   */
  load: <T = unknown>(key: string, fallback = ""): Promise<T> =>
    bridge.call("load_plugin_config", key, fallback) as Promise<T>,
};

export const runtime = {
  gc: () => bridge.call("runtime.gc") as Promise<void>,
  isTaskGroupCancelled: (taskGroupKey: string) =>
    bridge.call(
      "runtime.is_task_group_cancelled",
      taskGroupKey,
    ) as Promise<boolean>,
};

export const opencc = {
  convert: (
    text: string,
    config:
      | "s2t.json"
      | "t2s.json"
      | "s2tw.json"
      | "tw2s.json"
      | "s2hk.json"
      | "hk2s.json",
  ) => {
    return bridge.call("opencc.convert", { text, config }) as Promise<string>;
  },
};

interface ToastOptions {
  message: string;
  title?: string;
  seconds?: number;
  level?: "info" | "success" | "warning" | "error";
}

export const flutterTools = {
  getAppVersion: () => bridge.call("dart.getAppVersion") as Promise<string>,
  showToast: (options: ToastOptions) => {
    return bridge.call(
      "flutter.showToast",
      JSON.stringify(options),
    ) as Promise<string>;
  },
};
