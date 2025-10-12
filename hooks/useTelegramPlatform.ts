import { useEffect, useState } from "react";

/**
 * Возвращает платформу Telegram Mini App или fallback "web"/"android"/"ios"
 */
export function useTelegramPlatform() {
  const [platform, setPlatform] = useState<string>("web"); // по умолчанию web

  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;

      if (tg && typeof tg.platform === "string") {
        tg.ready?.(); // безопасно вызываем init Telegram
        setPlatform(tg.platform);
      } else if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes("android")) setPlatform("android");
        else if (ua.includes("iphone") || ua.includes("ios")) setPlatform("ios");
        else if (ua.includes("mac")) setPlatform("macos");
        else setPlatform("web");
      }
    } catch (err) {
      console.warn("Failed to detect Telegram platform:", err);
      setPlatform("web");
    }
  }, []);

  return platform;
}
