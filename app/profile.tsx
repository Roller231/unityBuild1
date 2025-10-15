import React, { useEffect, useState, useRef, useMemo } from "react";

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  Text,
  Pressable,
  ScrollView, // 👈 вот это добавь
} from "react-native";


import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

// ===== Импорт иконок =====
import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import IconGift from "../components/icons/gift.png";
import IconStar from "../components/icons/star.svg";
import IconTon from "../components/icons/ton.svg";
import IconCopy from "../components/icons/copy.svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const Profile = () => {
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);

  const [tgName, setTgName] = useState("User");
  const [tgAvatar, setTgAvatar] = useState<string | null>(null);

  const [activeMenu, setActiveMenu] = useState<"deposit" | "stars" | "ton">("deposit");

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;


  // === BottomSheet (панель) ===
// === BottomSheet (панель) ===
const [openMenu, setOpenMenu] = useState<null | "deposit" | "stars" | "ton">(null);
const bottomSheetRef = useRef<BottomSheet>(null);

const snapPoints = useMemo(() => {
  if (!openMenu) return [];
  switch (openMenu) {
    case "deposit":
      return ["80%", "80%"]; // 👈 первый — свернутый, второй — полностью открыт
    case "stars":
      return ["80%", "80%"];
    case "ton":
      return ["80%", "80%"];
    default:
      return ["80%", "80%"];
  }
}, [openMenu]);





  // 🟣 Получаем данные Telegram пользователя
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      if (user) {
        setTgName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
        if (user.photo_url) setTgAvatar(user.photo_url);
      }
    }
  }, []);

  // 🇷🇺 Переключение языка
  const toggleLanguage = () => {
    Animated.sequence([
      Animated.timing(flagAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 50, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
      setCurrentFlag((prev) => (prev === "ru" ? "en" : "ru"));
      Animated.timing(flagAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleBalancePress = () => console.log("Balance clicked!");
  const handleInvitePress = () => console.log("Invite pressed!");
  const handleCopyPress = () => console.log("Copied!");

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />






      {/* === ScrollView вместо View === */}
      <ScrollView
        contentContainerStyle={[
          styles.wrapper,
          {
            width: fixedWidth,
            paddingBottom: 120, // отступ снизу
            minHeight: screenHeight + 100, // позволяет немного проскроллить
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="always"
        bounces
      >


        {/* ===== Верхняя панель ===== */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleLanguage} activeOpacity={0.8}>
            <View style={styles.langButton}>
              <Animated.Image
                source={currentFlag === "ru" ? FlagRU : FlagEN}
                style={[
                  styles.flagIcon,
                  {
                    transform: [{ translateY: flagAnim }],
                    opacity: flagAnim.interpolate({
                      inputRange: [-50, 0, 50],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <BalanceButton onPress={handleBalancePress} />
        </View>

        {/* ===== 🧑‍🚀 Аватар ===== */}
        <View style={[styles.avatarContainer, styles.sectionGap]}>
          <View style={styles.avatarWrapper}>
            {tgAvatar ? (
              <Image source={{ uri: tgAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
          <Text style={styles.userName}>{tgName}</Text>
        </View>

        {/* ===== 🟣 Меню ===== */}
        <View style={[styles.menuContainer, styles.sectionGap]}>
          {/* 🔹 Первая строка — кнопки */}
          <View style={styles.menuRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpenMenu("deposit")}

              style={[
                styles.menuButton,
                activeMenu === "deposit"
                  ? styles.menuButtonActive
                  : styles.menuButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.menuText,
                  activeMenu === "deposit" && styles.menuTextActive,
                ]}
              >
                Deposit
              </Text>
              <Image source={IconGift} style={styles.icon} resizeMode="contain" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMenu("stars")}
              style={[
                styles.menuButton,
                activeMenu === "stars"
                  ? styles.menuButtonActive
                  : styles.menuButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.menuText,
                  activeMenu === "stars" && styles.menuTextActive,
                ]}
              >
                Stars
              </Text>
              <Image source={IconStar} style={styles.icon} resizeMode="contain" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMenu("ton")}
              style={[
                styles.menuButton,
                activeMenu === "ton"
                  ? styles.menuButtonActive
                  : styles.menuButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.menuText,
                  activeMenu === "ton" && styles.menuTextActive,
                ]}
              >
                Deposit
              </Text>
              <Image source={IconTon} style={styles.icon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* 🔹 Вторая строка — Inventory + Sell All */}
          <View style={styles.inventoryRow}>
            <Text style={styles.inventoryText}>Inventory (0)</Text>
            <Pressable style={styles.sellButton}>
              <Text style={styles.sellButtonText}>Sell All</Text>
            </Pressable>
          </View>

          {/* 🔹 Третья строка — Инвентарь подарков */}
          <View style={styles.inventoryGrid}>
            <View style={styles.inventoryItem}>
              <View style={styles.giftIconWrapper}>
                <Image
                  source={require("../components/icons/gift.png")}
                  style={styles.inventoryIcon}
                />
              </View>
            </View>
            <View style={styles.inventoryItem}>
              <View style={styles.giftIconWrapper}>
                <Image
                  source={require("../components/icons/gift.png")}
                  style={styles.inventoryIcon}
                />
              </View>
            </View>
            <View style={styles.inventoryItem}>
              <View style={styles.giftIconWrapper}>
                <Image
                  source={require("../components/icons/arrow.svg")}
                  style={styles.arrow}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 🔹 Четвёртая строка — Invite friends */}
        <View style={[styles.newMenuContainer, styles.sectionGap]}>
          <View style={styles.inviteTopRow}>
            <Text style={styles.inviteText}>
              Invite friends and earn 10% of their deposits
            </Text>
            <Pressable style={styles.termsButton}>
              <Text style={styles.termsText}>Terms</Text>
            </Pressable>
          </View>

          <View style={styles.inviteBottomRow}>
            <Pressable style={styles.inviteButton} onPress={handleInvitePress}>
              <Text style={styles.inviteButtonText}>Invite</Text>
            </Pressable>
            <Pressable style={styles.copyButton} onPress={handleCopyPress}>
              <Image source={IconCopy} style={styles.copyIcon} resizeMode="contain" />
            </Pressable>
          </View>
        </View>

{/* 🔹 Третья секция — Баланс и Рефералы */}
<View style={[styles.emptyMenuContainer, styles.sectionGap]}>
  <View style={styles.balanceLeft}>
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>Balance:</Text>
      <Text style={styles.balanceValue}>0.00</Text>
      <Image
        source={require("../components/icons/ton.svg")}
        style={styles.tonIcon}
        resizeMode="contain"
      />
    </View>
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>Referrals:</Text>
      <Text style={styles.balanceValue}>0.00</Text>
    </View>
  </View>

  <Pressable style={styles.withdrawButton}>
    <Text style={styles.withdrawText}>Withdraw</Text>
  </Pressable>
</View>





</ScrollView>



 {/* === Bottom Sheet Меню === */}
 {openMenu && snapPoints.length > 0 && (
  <BottomSheet
    ref={bottomSheetRef}
    index={1} // ✅ Всегда открыта при появлении
    snapPoints={snapPoints}
    enablePanDownToClose
    onClose={() => setOpenMenu(null)}
    backgroundStyle={styles.sheetBackground}
    handleIndicatorStyle={styles.sheetHandle}
    animateOnMount
  >
    <BottomSheetView style={styles.sheetContent}>
      {openMenu === "deposit" && (
        <>
          <Text style={styles.sheetTitle}>Deposit Funds</Text>
          <Text style={styles.sheetText}>Choose how to deposit your funds:</Text>
          <TouchableOpacity style={styles.modalButton}>
            <Text style={styles.modalButtonText}>💎 Deposit TON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton}>
            <Text style={styles.modalButtonText}>🎁 Deposit Gifts</Text>
          </TouchableOpacity>
        </>
      )}

      {openMenu === "stars" && (
        <>
          <Text style={styles.sheetTitle}>Stars Info</Text>
          <Text style={styles.sheetText}>
            Stars can be used to participate in exclusive events and redeem bonuses.
          </Text>
        </>
      )}

      {openMenu === "ton" && (
        <>
          <Text style={styles.sheetTitle}>Connect Wallet</Text>
          <Text style={styles.sheetText}>Your wallet is not connected.</Text>
          <TouchableOpacity style={styles.modalButton}>
            <Text style={styles.modalButtonText}>🔗 CONNECT WALLET</Text>
          </TouchableOpacity>
        </>
      )}
    </BottomSheetView>
  </BottomSheet>

)}

    </LinearGradient>
  );
};

// ===== Стили =====
const styles = StyleSheet.create({
  background: { flex: 1, alignItems: "center" },
  wrapper: { flex: 1, alignSelf: "center" },
  sectionGap: { marginTop: 20 },

  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 100,
    marginBottom: 0,
    alignSelf: "center",
  },
  langButton: {
    backgroundColor: "#1F0248",
    borderRadius: 100,
    height: 40,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  flagIcon: { width: 28, height: 28 },

  avatarContainer: {
    width: 140,
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 2,
    borderColor: "#9028FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 70 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  userName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 24,
    marginTop: 10,
  },

  menuContainer: {
    height: 270,
    paddingVertical: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#352851",
    width: "90%",
    alignSelf: "center",
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
    gap: 16,
  },
  menuButton: {
    height: 48,
    paddingVertical: 4,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    flexDirection: "row",
    flex: 1,
  },
  menuButtonInactive: {
    borderWidth: 2,
    borderColor: "#6B3FD8",
    backgroundColor: "transparent",
  },
  menuButtonActive: { backgroundColor: "#6B3FD8" },
  menuText: { color: "#fff", fontWeight: "600", fontSize: 16, opacity: 0.85 },
  menuTextActive: { opacity: 1, fontWeight: "700" },
  icon: { width: 18, height: 18, marginLeft: 4 },

  inventoryRow: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  inventoryText: { color: "#C4BED4", fontSize: 18, fontWeight: "500", opacity: 0.8 },
  sellButton: {
    height: 34,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderRadius: 100,
    backgroundColor: "#1F0248",
  },
  sellButtonText: { color: "#B98CFF", fontSize: 15, fontWeight: "600" },

  inventoryGrid: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    marginTop: 6,
  },
  inventoryItem: {
    width: 110,
    height: 110,
    padding: 29,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#1F0248",
  },
  giftIconWrapper: {
    width: 2,
    height: 1,
    borderRadius: 12,
    backgroundColor: "#352851",
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryIcon: {
    width: 36,
    height: 36,
    opacity: 0.9,
    tintColor: "#352851",
  },
  arrow: { width: 36, height: 36, opacity: 0.9, tintColor: "#A07BFF" },

  // === Invite Block ===
  newMenuContainer: {
    height: 146,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#352851",
    width: "90%",
    alignSelf: "center",
  },
  inviteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  inviteText: {
    width: 227,
    color: "#C4BED4",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 23.4,
    letterSpacing: -0.408,
  },
  termsButton: {
    height: 34,
    width: "18%",
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderRadius: 100,
    backgroundColor: "#1F0248", // такой же фон, как у Sell All
  },


  termsText: {
    color: "#B98CFF", // такой же цвет текста, как у Sell All
    fontSize: 15,
    fontWeight: "600",
  },
    inviteBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 12,

  },
  inviteButton: {
    flex: 1,
    height: 56,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
    shadowColor: "rgba(37,2,72,0.5)",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
  },
  inviteButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  copyButton: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6B3FD8",  

  },
  copyIcon: { width: 28, height: 28, tintColor: "#FFFFFF" },



  // ===== Баланс / Рефералы меню =====
  emptyMenuContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#352851",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 20,
  },

  balanceLeft: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceLabel: {
    color: "#C4BED4",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 23.4,
    letterSpacing: -0.408,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "200",
    lineHeight: 23.4,
  },
  tonIcon: {
    width: 24,
    height: 24,
  },

  withdrawButton: {
    height: 56,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    flex: 1,
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
    shadowColor: "rgba(37, 2, 72, 0.5)",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  withdrawText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },


  // === Bottom Sheet ===
sheetBackground: {
  backgroundColor: "#352851",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.15)",
},
sheetHandle: { backgroundColor: "#6B3FD8", width: 60 },
sheetContent: { padding: 20, alignItems: "center" },
sheetTitle: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "700",
  marginBottom: 10,
},
sheetText: {
  color: "#C4BED4",
  fontSize: 16,
  textAlign: "center",
  marginBottom: 12,
},
modalButton: {
  backgroundColor: "#6B3FD8",
  borderRadius: 100,
  paddingVertical: 12,
  paddingHorizontal: 24,
  marginVertical: 6,
},
modalButtonText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},


  
});

export default Profile;
