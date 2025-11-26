import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import { apiGet, apiPatch } from "../utils/api";

const API_URL_UP = "https://ggcat.org/crash-rounds?limit=5000000000";
const LIMIT = 6;

const { width: screenWidth } = Dimensions.get("window");
const SPACING = 12;

interface Round {
  id: number;
  round_number: number;
  crash_point: number;
}

interface Props {
  phase: "idle" | "countdown" | "flight" | "crash";
  currentMultiplier: number;
}

export default function FullCrashHistoryBar({ phase, currentMultiplier }: Props) {
  const [history, setHistory] = useState<Round[]>([]);
  const listRef = useRef<FlatList>(null);

  // === загрузка истории ===
  const loadHistory = async () => {
    try {
      const res = await fetch(API_URL_UP);
      const data: Round[] = await res.json();
  
      // Берём последние 6
      const lastSix = data.slice(-LIMIT);
  
      console.log(
        "%c🔥 REAL LAST 6 FROM API (correct order):",
        "color: #00ff90; font-size: 14px; font-weight: bold;"
      );
      console.table(lastSix);
  
      setHistory(lastSix);  // сохраняем как есть
  
    } catch (e) {
      console.log("History load error:", e);
    }
  };
  

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (phase === "crash") {
      setTimeout(loadHistory, 500);
    }
  }, [phase]);

  // === формирование ленты ===
  let items: (number | "waiting")[] = [...history.map(h => h.crash_point)].reverse();

  if (phase === "flight") items = [currentMultiplier, ...items];
  if (phase === "countdown") items = ["waiting", ...items];

  // автоскролл
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollToOffset({ offset: 0, animated: true });
  }, [items]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const isActive = index === 0;
          const waiting = item === "waiting";

          return (
            <View
              style={[
                styles.block,
                isActive ? styles.activeBlock : styles.inactiveBlock,
                waiting && styles.waitingBlock,
              ]}
            >
              <Text style={styles.text}>
                {waiting ? "Ожидание" : `x${Number(item).toFixed(2)}`}
              </Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ width: SPACING }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingLeft: 25,
    marginBottom: 10,
  },

  list: {
    flexDirection: "row",
    alignItems: "center",
  },

  block: {
    width: 66,
    height: 30,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  waitingBlock: {
    width: "auto",
    paddingHorizontal: 14,
    minWidth: 66,
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
    fontWeight: "500",
    fontFamily: "SF-Pro-Medium",
  },
});
