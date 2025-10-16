import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CustomTabBar from "@/components/CustomTabBar";

// предотвращаем масштабирование
if (typeof window !== "undefined") {
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false }
  );

  window.addEventListener(
    "gesturestart",
    (e) => e.preventDefault(),
    { passive: false }
  );
}

const _layout = () => {
  const platform = useTelegramPlatform();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready(); // ✅ Telegram ждёт, пока Mini App готова
  
      try {
        const sdk = require("@telegram-apps/sdk");
        const swipeBehavior = sdk.swipeBehavior;
        if (swipeBehavior?.isSupported()) {
          swipeBehavior.disableVerticalSwipe();
          console.log("✅ Vertical swipe disabled");
        }
  
        // 👇 Разворачиваем WebApp на максимум (чтобы нельзя было «потащить вниз»)
        tg.expand();
        tg.setHeaderColor("#000000");
        tg.setBackgroundColor("#000000");
        console.log("🖥️ App expanded to full height");
  
      } catch (err) {
        console.warn("⚠️ Telegram SDK not available:", err);
      }
    }
  }, []);
  
  

  const isDesktop = platform === "tdesktop" || platform === "macos";

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
    backgroundColor: "#111",
  },
  desktopFrame: {
    width: 470,
    borderRadius: 25,
    overflow: "hidden",
  },
});

export default _layout;
