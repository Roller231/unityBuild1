import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CustomTabBar from "@/components/CustomTabBar";

import {
  init,
  viewport,
  swipeBehavior,
  useRawInitData,
  useLaunchParams,
} from "@telegram-apps/sdk-react";

// 🚫 предотвращаем масштабирование и выделение текста
if (typeof window !== "undefined") {
  window.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
  window.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });

  // 🚫 Запрещаем выделение текста глобально
  const style = document.createElement("style");
  style.innerHTML = `
    * {
      user-select: none !important;
      -webkit-user-select: none !important;
      -ms-user-select: none !important;
      -moz-user-select: none !important;
    }
    img, svg {
      pointer-events: none !important;
      -webkit-user-drag: none !important;
    }
  `;
  document.head.appendChild(style);
}

const _layout = () => {
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";

  let launchParams: any;
  try {
    launchParams = useLaunchParams();
  } catch {
    launchParams = { tgWebAppPlatform: "web", tgWebAppData: { user: { first_name: "Guest" } } };
    console.warn("⚠️ Telegram SDK: using fallback launchParams (not in Telegram)");
  }

  const rawInitData = (() => {
    try {
      return useRawInitData();
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    try {
      init();
      console.log("🚀 Telegram SDK initialized");
    } catch (err) {
      console.warn("⚠️ Telegram SDK init skipped:", err);
    }

    if (viewport.mount.isAvailable()) {
      viewport.mount();
      viewport.expand();
      console.log("🖥️ Viewport expanded");
    }

    if (viewport.requestFullscreen.isAvailable()) {
      viewport.requestFullscreen();
    }

    if (swipeBehavior.isSupported()) {
      swipeBehavior.mount();
      swipeBehavior.disableVertical();
      console.log("✅ Vertical swipe disabled");
    }

    console.log("🧾 Launch Params:", launchParams);
    console.log("📦 Raw Init Data:", rawInitData);
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.appFrame, isDesktop && styles.desktopFrame]}>
        <Tabs
          initialRouteName="case"
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <CustomTabBar {...props} />}
        >
          <Tabs.Screen name="case" options={{ title: "Кейсы" }} />
          <Tabs.Screen name="crash" options={{ title: "Краш" }} />
          <Tabs.Screen name="profile" options={{ title: "Профиль" }} />
        </Tabs>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  appFrame: {
    width: "100%",
    height: "100%",
  },
  desktopFrame: {
    width: 470,
    borderRadius: 25,
    overflow: "hidden",
  },
});

export default _layout;
