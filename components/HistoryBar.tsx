import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import * as Font from "expo-font";

interface HistoryBarProps {
  history: number[];
  activeIndex?: number;
}

const ITEM_WIDTH = 66;
const SPACING = 8;

const HistoryBar: React.FC<HistoryBarProps> = ({ history, activeIndex = 0 }) => {
  const listRef = useRef<FlatList>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // === загружаем шрифт ===
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  // === фильтруем нулевые / NaN ===
  const filtered = history.filter((v) => v && !isNaN(v) && v > 0);

  // === создаём структуру: [активный, ...история]
  // т.е. активный множитель — всегда первый (слева)
  const reordered = filtered.length
    ? [filtered[filtered.length - 1], ...filtered.slice(0, -1).reverse()]
    : [];

  // === автопрокрутка при обновлении истории ===
  useEffect(() => {
    if (listRef.current && reordered.length > 0) {
      try {
        listRef.current.scrollToOffset({
          offset: 0,
          animated: true,
        });
      } catch (err) {
        console.warn("Scroll error:", err);
      }
    }
  }, [reordered]);

  if (!fontLoaded) return null;

  return (
    <View style={[styles.container, { paddingLeft: 10 }]}>
  <FlatList
    ref={listRef}
    data={reordered}
    keyExtractor={(_, index) => index.toString()}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={[
      styles.list,
      { paddingLeft: 0, paddingRight: 10 }, // ✅ переносим сюда
    ]}
    renderItem={({ item, index }) => (
      <View
        style={[
          styles.block,
          index === 0 ? styles.activeBlock : styles.inactiveBlock,
        ]}
      >
        <Text style={styles.text}>x{item.toFixed(2)}</Text>
      </View>
    )}
    ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
  />
</View>

  );
};

const styles = StyleSheet.create({
  container: {
    width: "93%",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 12,
  },
  list: {
    flexDirection: "row",
    alignItems: "center",
  },
  block: {
    width: 58,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  inactiveBlock: {
    backgroundColor: "rgba(31, 2, 72, 1)", // 💡 тёмно-прозрачный, но виден на фоне
    borderWidth: 1.5,
    borderColor: "rgba(82, 40, 140, 1)", // лёгкий контур
  },
  activeBlock: {
    backgroundColor: "rgba(110, 20, 255, 0.7)", // чуть ярче
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
