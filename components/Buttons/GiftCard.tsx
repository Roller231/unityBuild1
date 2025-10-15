import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import TonIcon from "../icons/ton.svg";

interface GiftCardProps {
  price?: string;
  gradientColors?: string[];
  cardWidth?: number;
}

const GiftCard = ({
  price = "0.5",
  gradientColors = ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.25)", "#FFFFFF"],
  cardWidth = 160,
}: GiftCardProps) => {
  return (
    <View style={[styles.cardWrapper, { width: cardWidth, height: cardWidth }]}>
      {/* 💎 Плашка стоимости с блюром */}
      <View style={styles.priceTag}>
        <BlurView intensity={40} tint="light" style={styles.priceInner}>
          <View style={styles.iconCircle}>
            <Image source={TonIcon} style={styles.icon} resizeMode="contain" />
          </View>
          <Text style={styles.priceText}>{price}</Text>
        </BlurView>
      </View>

      {/* 🔹 Основной фон карточки */}
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
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "80%",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  priceTag: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    borderRadius: 100,
    overflow: "hidden",
  },

  priceInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },

  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0098EA",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
});

export default GiftCard;
