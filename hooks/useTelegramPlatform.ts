import { useEffect, useState } from "react";

/**
 * ✅ Определяет Telegram платформу (tdesktop, macos, web, webk, weba, android, ios)
 * Если не в Telegram — использует userAgent fallback.
 */
export function useTelegramPlatform() {
  const [platform, setPlatform] = useState<string>("web"); // безопасный дефолт

  useEffect(() => {
    // SSR-safe: проверяем, что код выполняется в браузере
    if (typeof window === "undefined") return;

    try {
      const tg = (window as any)?.Telegram?.WebApp;

      if (tg && typeof tg.platform === "string" && tg.platform.length > 0) {
        // 💡 Telegram Mini App доступен
        tg.ready?.();
        setPlatform(tg.platform); // "tdesktop", "macos", "web", "weba", "webk", "android", "ios"
      } else {
        // 💻 fallback по userAgent (если не внутри Telegram)
        const ua = navigator.userAgent.toLowerCase();

        if (ua.includes("android")) setPlatform("android");
        else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) setPlatform("ios");
        else if (ua.includes("macintosh")) setPlatform("macos");
        else if (ua.includes("windows")) setPlatform("tdesktop");
        else setPlatform("web");
      }
    } catch (err) {
      console.warn("⚠️ Telegram platform detection failed:", err);
      setPlatform("web");
    }
  }, []);

  return platform;
}
