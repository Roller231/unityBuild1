import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import TonIcon from "../icons/ton.png";

const GiftCard = ({
  price = "0.5",
  gradientColors = ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.25)", "#FFFFFF"],
}: {
  price?: string;
  gradientColors?: string[];
}) => {
  return (
    <View style={styles.cardWrapper}>
      {/* 💎 Плашка стоимости с блюром */}
      <View style={styles.priceTag}>
        <BlurView intensity={40} tint="light" style={styles.priceInner}>
          <View style={styles.iconCircle}>
            <Image source={TonIcon} style={styles.icon} resizeMode="contain" />
          </View>
          <Text style={styles.priceText}>{price}</Text>
        </BlurView>
      </View>

      {/* 🔹 Основной фон карточки (градиент снизу) */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: 164,
    height: 164,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    margin: 8,
  },

  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "80%",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  priceTag: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    borderRadius: 100,
    overflow: "hidden", // 🔹 чтобы блюр был по форме
  },

  // 🔹 Теперь фон полупрозрачный с блюром
  priceInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // лёгкий белый фон поверх блюра
  },

  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0098EA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },
});

export default GiftCard;
