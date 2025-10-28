import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CustomTabBar from "@/components/CustomTabBar";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import { init, viewport, swipeBehavior } from "@telegram-apps/sdk-react";

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

// 🖼 Фон загрузочного экрана
import BgImage from "../components/icons/12.png";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

if (typeof window !== "undefined") {
  window.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
  window.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });

  const style = document.createElement("style");
  style.innerHTML = `
    * {
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    html, body {
      overflow: hidden !important;
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: #000;
    }
    img, svg {
      pointer-events: none !important;
      -webkit-user-drag: none !important;
    }
  `;
  document.head.appendChild(style);
}

const _layout = () => {
  const [isReady, setIsReady] = useState(false);
  const [didWalkthrough, setDidWalkthrough] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";

  // === Анимация прогресса ===
  const animateProgress = (toValue: number, duration = 500) => {
    Animated.timing(progressAnim, {
      toValue,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  // === Основная инициализация ===
  useEffect(() => {
    const initialize = async () => {
      try {
        animateProgress(0);

        // 1. Шрифты
        await Font.loadAsync({
          "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
          "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),
          "SF-Pro-Semibold": require("../fonts/SF-Pro-Display-Semibold.otf"),
          "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
          "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
        });
        animateProgress(30);

        // 2. Ассеты
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

        // 3. Telegram SDK
        try {
          init();
          if (viewport.mount.isAvailable()) viewport.mount();
          if (viewport.requestFullscreen.isAvailable()) viewport.requestFullscreen();
          if (swipeBehavior.isSupported()) {
            swipeBehavior.mount();
            swipeBehavior.disableVertical();
          }
        } catch (sdkError) {
          console.warn("⚠️ Telegram SDK init skipped:", sdkError);
        }

        // 4. Завершение
        animateProgress(100);
        setTimeout(() => setIsReady(true), 800);
      } catch (err) {
        console.error("❌ Initialization failed:", err);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // === Автоматический walkthrough ===
  useEffect(() => {
    if (!isReady || didWalkthrough) return;
    setDidWalkthrough(true);
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => router.push("/profile"), 100));
    timers.push(setTimeout(() => router.push("/case"), 1300));
    timers.push(setTimeout(() => router.push("/crash"), 100));
    return () => timers.forEach(clearTimeout);
  }, [isReady, didWalkthrough]);

  // === Прогресс-бар ширина ===
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // === Экран загрузки ===
  if (!isReady) {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <ImageBackground
              source={BgImage}
              resizeMode="contain"
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
  

  // === Основное приложение ===
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

  outerContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000", // Чёрный фон снаружи
    justifyContent: "center",
    alignItems: "center",
  },
  
  innerContainer: {
    width: 475,
    aspectRatio: 9 / 16, // Или подогнать под твоё изображение
    backgroundColor: "#6B3FD8", // Фиолетовая подложка
    overflow: "hidden",
    borderRadius: 0, // Можно добавить если нужна закруглённость
  },
  
  bgImage: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  

  loaderContainer: {
    flex: 1,
    backgroundColor: "#6B3FD8", // Фиолетовый фон вокруг
    alignItems: "center",
    justifyContent: "center",
  },
  


  fullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
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

export default _layout;
