import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import * as Font from "expo-font";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onLanguageChange } from "@/components/languageEvents";

interface HistoryBarProps {
  history: number[];
  activeIndex?: number;
  phase?: "idle" | "countdown" | "flight" | "crash";
}

const { width: screenWidth } = Dimensions.get("window");
const SPACING = 12;

const HistoryBar: React.FC<HistoryBarProps> = ({
  history,
  activeIndex = 0,
  phase = "idle",
}) => {
  const listRef = useRef<FlatList>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [language, setLanguage] = useState<"ru" | "en">("ru");

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : Math.min(screenWidth, 470);

  // 🌍 локализация
  const translations = {
    ru: { waiting: "Ожидание" },
    en: { waiting: "Waiting" },
  } as const;
  const t = (key: keyof typeof translations["en"]) => translations[language][key];

  // === загрузка языка ===
  useEffect(() => {
    const loadLang = async () => {
      const saved = await AsyncStorage.getItem("app_language");
      if (saved === "ru" || saved === "en") setLanguage(saved);
    };
    loadLang();
    const unsub = onLanguageChange((newLang) => {
      if (newLang === "ru" || newLang === "en") setLanguage(newLang);
    });
    return unsub;
  }, []);

  // === загрузка шрифта ===
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  // === фильтруем некорректные значения ===
  const filtered = history.filter((v) => v && !isNaN(v) && v > 0);

  // === история с последним элементом впереди ===
  const reordered = filtered.length
    ? [filtered[filtered.length - 1], ...filtered.slice(0, -1).reverse()]
    : [];

  // === автопрокрутка ===
  useEffect(() => {
    if (listRef.current && reordered.length > 0) {
      try {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      } catch (err) {
        console.warn("Scroll error:", err);
      }
    }
  }, [reordered]);

  if (!fontLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={{ width: fixedWidth * 0.9 }}>
        <FlatList
          ref={listRef}
          data={reordered}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            isDesktop && { paddingLeft: 25, paddingRight: 12 },
          ]}
          renderItem={({ item, index }) => {
            const isActive = index === 0;
            const showWaiting = phase === "countdown" && isActive;

            // 🔹 динамический стиль блока
            const blockStyle = [
              styles.block,
              isActive ? styles.activeBlock : styles.inactiveBlock,
              showWaiting && styles.waitingBlock, // адаптируется под текст
            ];

            return (
              <View style={blockStyle}>
                <Text style={styles.text}>
                  {showWaiting ? t("waiting") : `x${item.toFixed(2)}`}
                </Text>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 10,
  },
  list: {
    flexDirection: "row",
    alignItems: "center",
  },
  block: {
    width: 66, // фиксированный размер для чисел
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  waitingBlock: {
    width: "auto", // 🟣 динамическая ширина
    paddingHorizontal: 14, // чуть шире, чтобы "Ожидание" не слипалось
    minWidth: 66, // не меньше стандартного размера
  },
  inactiveBlock: {
    backgroundColor: "rgba(31, 2, 72, 1)",
    borderWidth: 1.5,
    borderColor: "rgba(82, 40, 140, 1)",
  },
  activeBlock: {
    backgroundColor: "rgba(110, 20, 255, 0.7)",
    borderWidth: 1.5,
    borderColor: "#B174FF",
    shadowColor: "#B174FF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SF-Pro-Medium",
    fontWeight: "500",
  },
});

export default HistoryBar;
