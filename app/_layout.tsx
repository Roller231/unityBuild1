// app/_layout.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, ImageBackground, Animated, Easing, Dimensions } from "react-native";
import { Tabs } from "expo-router";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";

import CustomTabBar from "@/components/CustomTabBar";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

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

SplashScreen.preventAutoHideAsync(); // Предотвращаем автo‑скрытие сплэша до готовности

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const resizeMode = isDesktop ? "cover" : "contain";

  const animateProgress = (toValue: number, duration = 500) => {
    Animated.timing(progressAnim, {
      toValue,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        animateProgress(0);

        await Font.loadAsync({
          "SF‑Pro‑Heavy": require("../fonts/SF‑Pro-Display-Heavy.otf"),
          "SF‑Pro‑Bold": require("../fonts/SF‑Pro-Display-Bold.otf"),
          "SF‑Pro‑Semibold": require("../fonts/SF‑Pro-Display-Semibold.otf"),
          "SF‑Pro‑Medium": require("../fonts/SF‑Pro-Display-Medium.otf"),
          "SF‑Pro‑Regular": require("../fonts/SF‑Pro-Display-Regular.otf"),
        });
        animateProgress(30);

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

        // Здесь можно вставить инициализацию SDK и другое
        // …

        animateProgress(100);
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
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={styles.fullScreen} onLayout={onLayoutRootView}>
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <ImageBackground
              source={BgImage}
              resizeMode={resizeMode}
              style={styles.bgImage}
              imageStyle={{ width: "100%", height: "100%" }}
            >
              <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                  <Animated.View style={[styles.progressBar, { width: barWidth }]} />
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
    width: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    width: 475,
    aspectRatio: 9 / 16,
    backgroundColor: "#000",
    overflow: "hidden",
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

