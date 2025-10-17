import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CustomTabBar from "@/components/CustomTabBar";

import {
  init,
  viewport,
  themeParams,
  swipeBehavior,
  useRawInitData,
  useLaunchParams,
} from "@telegram-apps/sdk-react";

// 🚫 предотвращаем масштабирование
if (typeof window !== "undefined") {
  window.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
  window.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
}

const _layout = () => {
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";

  // ✅ Безопасно получаем launchParams (с мок-fallback)
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

  // === Инициализация SDK ===
  useEffect(() => {
    try {
      init();
      console.log("🚀 Telegram SDK initialized");
    } catch (err) {
      console.warn("⚠️ Telegram SDK init skipped (probably not in Telegram):", err);
    }

    if (viewport.mount.isAvailable()) {
            viewport.expand();
      console.log("🖥️ Viewport expanded");
    }

    if (swipeBehavior.isSupported()) {
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
