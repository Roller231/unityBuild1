import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CustomTabBar from "@/components/CustomTabBar";

const _layout = () => {
  const platform = useTelegramPlatform();

  // Проверяем, нужно ли ограничить ширину (ПК, Telegram Desktop или Web)
  const isDesktop =
    platform === "tdesktop" ||
    platform === "macos" ||
    platform === "weba" ||
    platform === "webk" ||
    platform === "web";

  return (
    <View style={styles.wrapper}>
      <View style={[styles.appFrame, isDesktop && styles.desktopFrame]}>
        <Tabs
          initialRouteName="profile"
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <CustomTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="location" options={{ title: "Location" }} />
          <Tabs.Screen name="search" options={{ title: "Search" }} />
          <Tabs.Screen name="cart" options={{ title: "Cart" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
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
    backgroundColor: "#000", // фон по бокам
  },
  appFrame: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  desktopFrame: {
    width: 470, // ✅ фиксированная ширина только для ПК и Telegram Web
    borderRadius: 25,
    overflow: "hidden",
  },
});

export default _layout;
