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
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={reordered}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        inverted={false} // важно! не переворачиваем список
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
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 20,
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
    backgroundColor: "#1F0248",
  },
  activeBlock: {
    backgroundColor: "rgba(110, 20, 255, 0.6)",
    borderWidth: 1.4,
    borderColor: "#A35BFF",
    shadowColor: "#A35BFF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SF-Pro-Medium",
    fontWeight: "500",
  },
});

export default HistoryBar;
