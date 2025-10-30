import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  ScaledSize,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onLanguageChange } from "@/components/languageEvents";

// 🔹 Иконки
import CaseIcon from "./icons/gift.png";
import CaseIconActive from "./icons/gift_active.png";
import CrashIcon from "./icons/rocket.png";
import CrashIconActive from "./icons/rocket_active.png";
import ProfileIcon from "./icons/cat.png";
import ProfileIconActive from "./icons/cat_active.png";

const TABS_ORDER = ["case", "crash", "profile"];
const ACTIVE_COLOR = "#FFFFFF";
const INACTIVE_COLOR = "rgba(255,255,255,0.6)";

const translations = {
  ru: {
    case: "Кейсы",
    crash: "Краш",
    profile: "Профиль",
  },
  en: {
    case: "Cases",
    crash: "Crash",
    profile: "Profile",
  },
} as const;

type Lang = keyof typeof translations;

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const platform = useTelegramPlatform();
  const [language, setLanguage] = useState<Lang>("en");
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);

  // ✅ Подписываемся на изменение языка
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("app_language");
      if (saved === "ru" || saved === "en") {
        setLanguage(saved);
      }
    })();

    return onLanguageChange((lang) => setLanguage(lang));
  }, []);

  const isDesktop = platform === "tdesktop" || platform === "macos";

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => setWindowWidth(window.width);
    const sub = Dimensions.addEventListener("change", onChange);
    return () => sub.remove?.();
  }, []);

  const containerWidth = isDesktop ? 470 * 0.9 : windowWidth * 0.9;

  const t = (key: keyof typeof translations["en"]) => translations[language][key];

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint="light" style={[styles.container, { width: containerWidth }]}>
        {TABS_ORDER.map((tabName) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tabName);
          if (routeIndex === -1) return null;

          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          return (
            <TabItem
              key={route.key}
              label={t(tabName as keyof typeof translations["en"])}
              icon={getTabIcon(tabName, isFocused)}
              active={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </BlurView>
    </View>
  );
};

const TabItem = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: any;
  active: boolean;
  onPress: () => void;
}) => {
  const rIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(active ? 1.25 : 1, { duration: 150 }) }],
    opacity: withTiming(active ? 1 : 0.8, { duration: 150 }),
  }));

  const rTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(active ? 1.1 : 1, { duration: 150 }) }],
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
      <Animated.View style={rIconStyle}>
        <Image source={icon} style={{ width: 28, height: 28 }} resizeMode="contain" />
      </Animated.View>
      <Animated.Text
        style={[styles.label, rTextStyle, { color: active ? ACTIVE_COLOR : INACTIVE_COLOR }]}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

function getTabIcon(name: string, active: boolean) {
  switch (name) {
    case "case":
      return active ? CaseIconActive : CaseIcon;
    case "crash":
      return active ? CrashIconActive : CrashIcon;
    case "profile":
      return active ? ProfileIconActive : ProfileIcon;
    default:
      return CaseIcon;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 10,
    elevation: 10,
  },
  container: {
    flexDirection: "row",
    height: 70,
    paddingVertical: 3,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.4)",
    borderRadius: 16,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  label: {
    fontSize: 12,
  },
});

export default CustomTabBar;
