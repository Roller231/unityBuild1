// app/_layout.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";
import { Tabs } from "expo-router";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";

import { UserProvider } from "../components/UserContext";

import CustomTabBar from "@/components/CustomTabBar";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import {
  init,
  viewport,
  swipeBehavior,
  isTMA,
  useLaunchParams,
} from "@telegram-apps/sdk-react";

import { getUserByTgId, createUser } from "../utils/api";
import { useUser } from "../components/UserContext";

// === Импорт ассетов ===
import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import IconGift from "../components/icons/gift.png";
import IconTon from "../components/icons/ton.svg";
import IconStar from "../components/icons/star.svg";
import IconCopy from "../components/icons/copy.svg";
import IconArrow from "../components/icons/arrow.svg";
import OrangePng from "../components/icons/OrangePng.png";
import VenusP from "../components/icons/VenusP.png";
import CatIcon from "../components/icons/cat.png";
import Oran from "../components/icons/Oran.svg";
import Timeline from "../components/icons/Timeline.svg";
import BgImage from "../components/icons/12.png";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutInner />
    </UserProvider>
  );
}

function RootLayoutInner() {
  const [isReady, setIsReady] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const { setUser } = useUser();

  // === SAFE useLaunchParams (чтобы RootLayout не падал) ===
  let launchParams: any = {};
  try {
    launchParams = useLaunchParams();
  } catch (e) {
    console.warn("⚠ useLaunchParams unavailable during bootstrap:", e);
    launchParams = { tgWebAppData: {} };
  }

  const animateProgress = (toValue: number, duration = 500) => {
    Animated.timing(progressAnim, {
      toValue,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  // === Init Telegram SDK ===
  useEffect(() => {
    async function initTg() {
      if (await isTMA()) {
        try {
          init();

          if (viewport.mount.isAvailable()) {
            await viewport.mount();
            viewport.expand();
          }
          if (viewport.requestFullscreen.isAvailable()) {
            await viewport.requestFullscreen();
          }
        } catch (err) {
          console.warn("⚠ Telegram Init Error:", err);
        }
      }
    }
    initTg();
  }, []);

  // === Disable text selection on web ===
  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.innerHTML = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // === APP INITIALIZATION ===
  useEffect(() => {
    const initialize = async () => {
      try {
        animateProgress(0);
        const startTime = Date.now();

        // Load fonts
        await Font.loadAsync({
          "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
          "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),
          "SF-Pro-Semibold": require("../fonts/SF-Pro-Display-Semibold.otf"),
          "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
          "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
        });
        animateProgress(30);

        // Load images
        await Asset.loadAsync([
          FlagRU,
          FlagEN,
          IconGift,
          IconTon,
          IconStar,
          IconCopy,
          IconArrow,
          OrangePng,
          VenusP,
          CatIcon,
          Oran,
          Timeline,
          BgImage,
        ]);
        animateProgress(70);

        // Init Telegram behavior
        try {
          init();
          if (viewport.mount.isAvailable()) viewport.mount();
          if (viewport.requestFullscreen.isAvailable())
            viewport.requestFullscreen();
          if (swipeBehavior.isSupported()) {
            swipeBehavior.mount();
            swipeBehavior.disableVertical();
          }
        } catch (err) {
          console.warn("⚠ Telegram SDK init skipped:", err);
        }

        // === LOAD USER (Telegram OR Local) ===
        try {
          const telegramAvailable = await isTMA();
          let finalUser = null;

          const tgUser = launchParams?.tgWebAppData?.user;

          if (telegramAvailable && tgUser) {
            // Telegram user detected
            const tg_id = String(tgUser.id);
            const username = tgUser.username ?? "unknown";
            const firstname = tgUser.first_name ?? "User";

            console.log("🔍 Checking user:", tg_id);

            const existing = await getUserByTgId(tg_id);

            if (existing) {
              finalUser = existing;
            } else {
              finalUser = await createUser({
                tg_id,
                username,
                firstname,
                balance: 0,
                refcount: 0,
                inventory: "[]",
              });
            }
          } else {
            // Local fallback
            console.log("⚠ Local mode activated");

            const existing = await getUserByTgId("local");

            if (existing) {
              finalUser = existing;
            } else {
              finalUser = await createUser({
                tg_id: "local",
                username: "localuser",
                firstname: "Local",
                balance: 0,
                refcount: 0,
                inventory: "",
              });
            }
          }

          setUser(finalUser);
        } catch (err) {
          console.warn("❌ User loading failed:", err);
        }

        // Progress to 100
        animateProgress(100);

        // Guarantee 1.5s splash
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
          await new Promise((res) => setTimeout(res, 1500 - elapsed));
        }

        setIsReady(true);
      } catch (err) {
        console.warn("Initialization error:", err);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      setTimeout(async () => {
        await SplashScreen.hideAsync();
      }, 500);
    }
  }, [isReady]);

  // === Splash screen ===
  if (!isReady) {
    return (
      <View style={styles.fullScreen} onLayout={onLayoutRootView}>
        <View
          style={[
            styles.outerContainer,
            !isDesktop && { width: "100%", height: "100%" },
          ]}
        >
          <View
            style={[
              styles.innerContainer,
              !isDesktop && styles.innerContainerMobile,
            ]}
          >
            <ImageBackground
              source={BgImage}
              resizeMode={isDesktop ? "cover" : "stretch"}
              style={[
                styles.bgImage,
                !isDesktop && { width: "100%", height: "100%" },
              ]}
            >
              <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                  <Animated.View
                    style={[styles.progressBar, { width: barWidth }]}
                  />
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={onLayoutRootView}>
      <View style={[styles.appFrame, isDesktop && styles.desktopFrame]}>
        <Tabs
          initialRouteName="case"
          screenOptions={{ headerShown: false, lazy: false }}
          tabBar={(props) => <CustomTabBar {...props} />}
        >
          <Tabs.Screen name="case" options={{ title: "Кейсы" }} />
          <Tabs.Screen name="crash" options={{ title: "Краш" }} />
          <Tabs.Screen name="profile" options={{ title: "Профиль" }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  outerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    width: 475,
    aspectRatio: 9 / 16,
    backgroundColor: "#000",
    overflow: "hidden",
    borderRadius: 25,
  },
  innerContainerMobile: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  bgImage: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  progressWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 80,
  },
  progressContainer: {
    width: "60%",
    height: 8,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  appFrame: {
    width: "100%",
    height: "100%",
  },
  desktopFrame: {
    width: 475,
    borderRadius: 25,
    overflow: "hidden",
  },
});

export {};
