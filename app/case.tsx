import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import CustomBottomSheet from "../components/CustomBottomSheet";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CaseRoulette from "../components/CaseRoulette";
import * as Font from "expo-font";
import Confetti from "react-confetti";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import TonIcon from "../components/icons/ton.svg";
import Svg, { Text as SvgText } from "react-native-svg";
import { emitLanguageChange, onLanguageChange } from "@/components/languageEvents";

import { useLaunchParams } from "@telegram-apps/sdk-react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";



const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const sampleDrops: DropItem[] = [
  { id: "1", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "2", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "3", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "4", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
];

const Case = () => {

// === BottomSheet пополнения ===
const [showDepositSheet, setShowDepositSheet] = useState(false);
const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("TON");
const [tonAmount, setTonAmount] = useState("");
const [starsAmount, setStarsAmount] = useState("");




  const [resetKey, setResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);
  const [animation] = useState(new Animated.Value(0));

  const [openMenu, setOpenMenu] = useState(false);
  const [resultSheetVisible, setResultSheetVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [result, setResult] = useState<DropItem | null>(null);


// ✅ при загрузке читаем язык из AsyncStorage
  // ✅ при загрузке читаем язык из AsyncStorage
  useFocusEffect(
    React.useCallback(() => {
      const checkLanguage = async () => {
        const saved = await AsyncStorage.getItem("app_language");
        if (saved === "ru" || saved === "en") {
          setLanguage(saved);
          setCurrentFlag(saved);
        }
      };
  
      checkLanguage();
    }, []) // <-- зависимости указываем здесь внутри useCallback
  );
  
  


  const launchParams = (() => {
    try {
      return useLaunchParams();
    } catch {
      console.warn("⚠️ Telegram SDK not found — running in dev mode (localhost)");
      return {
        tgWebAppData: {
          user: { first_name: "Guest", last_name: "", photo_url: null },
        },
      };
    }
  })();
  
  
  




  const [fontLoaded, setFontLoaded] = useState(false);
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF‑Pro‑Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
        "SF‑Pro‑Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const bottomSheetHeightRatio = isDesktop ? 0.5 : 0.6;

  const fixedWidth = isDesktop ? 470 : screenWidth;
  const switchWidth = fixedWidth * 0.9;
  const iconSize = Math.min(fixedWidth * 0.45, 200);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2],
  });

  const toggleLanguage = async () => {
    const newLang = language === "ru" ? "en" : "ru";
    setLanguage(newLang);
    setCurrentFlag(newLang);
    await AsyncStorage.setItem("app_language", newLang);
  
    emitLanguageChange(newLang); // 🔹 вот это ключ
  
    Animated.sequence([
      Animated.timing(flagAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 50, duration: 0, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  

  const handleGiftPress = () => {
    setOpenMenu(true);
    setSpinning(false);
    setResult(null);
  };

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const randomItem = sampleDrops[Math.floor(Math.random() * sampleDrops.length)];
    setTimeout(() => setResultId(randomItem.id), 200);
  };

  const handleFinish = (item: DropItem) => {
    setSpinning(false);
    setResult(item);
    setOpenMenu(false);
    setTimeout(() => setResultSheetVisible(true), 300);
  };

  if (!fontLoaded) return null;

  return (
    <LinearGradient key={resetKey} colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />
      <View style={[styles.wrapper, { width: fixedWidth }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Верхняя панель */}
          <View style={styles.topBar}>
            <TouchableWithoutFeedback onPress={toggleLanguage}>
              <View style={styles.langButton}>
                <Animated.Image
                  source={currentFlag === "ru" ? FlagRU : FlagEN}
                  style={[styles.flagIcon, {
                    transform: [{ translateY: flagAnim }],
                    opacity: flagAnim.interpolate({ inputRange: [-50,0,50], outputRange: [0,1,0] }),
                  }]}
                  resizeMode="contain"
                />
              </View>
            </TouchableWithoutFeedback>
            <BalanceButton
  onPress={() => {
    setSelectedTab("TON");
    setShowDepositSheet(true);
  }}
/>

          </View>

          {/* Переключатель Paid / Free */}
          <View style={[styles.switchContainer, { width: switchWidth }]}>
            <Animated.View style={[styles.switchHighlight, { transform: [{ translateX }] }]} />
            {["paid","free"].map(tab => (
              <TouchableWithoutFeedback
                key={tab}
                onPress={() =>
                  Animated.timing(animation, { toValue: tab === "paid" ? 0 : 1, duration: 250, useNativeDriver: false })
                    .start(() => setActiveTab(tab as any))
                }
              >
                <View style={styles.switchButton}>
                  <Text style={[styles.switchText, activeTab === tab && styles.switchTextActive]}>
                    {tab === "paid" ? "Paid" : "Free"}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>

          {/* Сетка подарков */}
          <View style={[styles.giftGrid, { width: switchWidth }]}>
            {Array.from({ length: 6 }).map((_, index) => (
              <GiftCard
                key={index}
                price={activeTab === "paid" ? "0.5" : "0.1"}
                cardWidth={(switchWidth - 10)/2}
                drops={sampleDrops}
                gradientColors={
                  activeTab === "paid"
                    ? ["rgba(0,0,0,0)", "rgba(0,255,100,0.25)", "rgba(0,255,100,0.85)"]
                    : ["rgba(255, 100, 100, 0.01)", "rgba(255, 0, 0, 0.2)", "rgba(255, 0, 0, 0.85)"]


                }
                onPress={handleGiftPress}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* BottomSheet рулетки */}
      <CustomBottomSheet
        visible={openMenu}
        onClose={() => {
          setOpenMenu(false);
          setSpinning(false);
        }}
        heightRatio={0.8}
      >
        <View style={[styles.sheetContainer, styles.sheetBorder]}>
          <View style={styles.sheetContent}>
            <CaseRoulette
              title="MEGA CASE OPENING"
              items={sampleDrops}
              active={spinning}
              resultId={resultId}
              onFinish={handleFinish}
              onSpin={handleSpin}
              spinning={spinning}
            />
          </View>
        </View>
      </CustomBottomSheet>

      <CustomBottomSheet
  visible={resultSheetVisible}
  onClose={() => setResultSheetVisible(false)}
  heightRatio={0.6}

  
>
  {resultSheetVisible && (
    <Confetti
      width={screenWidth}
      height={screenHeight * 0.5}
      numberOfPieces={300}
      recycle={false}
      gravity={0.4}
      run={resultSheetVisible}
    />
  )}
{result && (
  <View style={styles.resultWrapper}>
    <View style={styles.resultModal}>
      <Text style={styles.resultTitle}>Congratulations!</Text>
      <View style={[styles.cardOnly, { width: iconSize, height: iconSize }]}>
        <Image source={result.icon} style={styles.cardIcon} resizeMode="contain" />
      </View>
      <View style={styles.prizeRow}>
        <Text style={styles.prizeText}>+{result.price.toFixed(2)}</Text>
        <View style={styles.tonIconWrapper}>
          <Image source={TonIcon} style={styles.tonIcon} resizeMode="contain" />
        </View>
      </View>
    </View>

    <TouchableWithoutFeedback
      onPress={() => {
        setResultSheetVisible(false);
        setTimeout(() => setResetKey(prev => prev + 1), 300);
      }}
    >
      <View style={styles.okButton}>
        <Text style={styles.okButtonText}>Ok</Text>
      </View>
    </TouchableWithoutFeedback>
  </View>
)}

</CustomBottomSheet>


{/* === Bottom Sheet Пополнения (Deposit) === */}
<CustomBottomSheet
  visible={showDepositSheet}
  onClose={() => setShowDepositSheet(false)}
  heightRatio={bottomSheetHeightRatio}
>
  <ScrollView
    contentContainerStyle={styles.bottomSheetContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    nestedScrollEnabled
  >
    <Text style={styles.sheetTitle}>Enter amount</Text>

    {/* Tabs */}
    <View style={styles.tabRow}>
      {[
        { key: "Gifts", label: "Gifts", icon: require("../components/icons/gift.png") },
        { key: "Stars", label: "Stars", icon: require("../components/icons/star.svg") },
        { key: "TON", label: "TON", icon: require("../components/icons/ton.svg") },
      ].map(({ key, label, icon }) => {
        const activeTab = selectedTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tabButton, activeTab && styles.tabButtonActive, { flex: 1 }]}
            onPress={() => setSelectedTab(key as "Gifts" | "Stars" | "TON")}
            activeOpacity={0.9}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab && styles.tabTextActive]}>
                {label}
              </Text>
              <Animated.Image source={icon} resizeMode="contain" style={styles.tabIcon} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>

    {/* Контент */}
    {selectedTab === "Gifts" && (
      <View style={{ marginTop: 32, alignItems: "center" }}>
        <Image
          source={require("../components/icons/Timeline.svg")}
          style={styles.timelineIcon}
          resizeMode="contain"
        />
      </View>
    )}

    {(selectedTab === "Stars" || selectedTab === "TON") && (
      <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
        <Text style={styles.inputLabel}>
          {selectedTab === "Stars" ? "Amount of Stars" : "Amount of TON"}
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="0"
            placeholderTextColor="#777"
            style={styles.textInput}
            keyboardType="numeric"
            value={selectedTab === "Stars" ? starsAmount : tonAmount}
            onChangeText={(text) =>
              selectedTab === "Stars" ? setStarsAmount(text) : setTonAmount(text)
            }
          />
          <Animated.Image
            source={selectedTab === "Stars"
              ? require("../components/icons/star.svg")
              : require("../components/icons/ton.svg")}
            resizeMode="contain"
            style={styles.inputIcon}
          />
        </View>

        {/* Кнопка CONNECT WALLET */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.placeButton, { width: fixedWidth * 1.4 }]}
          onPress={() =>
            console.log(
              `Depositing ${selectedTab === "TON" ? tonAmount : starsAmount} ${selectedTab}`
            )
          }
        >
          <Image
            source={require("../components/icons/OrangePng.png")}
            style={styles.orangePng}
            resizeMode="contain"
          />

          <Svg
            height="100%"
            width="100%"
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 400 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <SvgText
              fill="none"
              stroke="#D35100"
              strokeWidth={5}
              fontSize="16"
              fontFamily="SF-Pro-Heavy"
              fontWeight="900"
              x="50%"
              y="45%"
              textAnchor="middle"
              letterSpacing={3}
            >
              CONNECT WALLET
            </SvgText>
            <SvgText
              fill="#FFF"
              fontSize="16"
              fontFamily="SF-Pro-Heavy"
              fontWeight="900"
              x="50%"
              y="45%"
              textAnchor="middle"
              letterSpacing={3}
            >
              CONNECT WALLET
            </SvgText>
          </Svg>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
</CustomBottomSheet>




    </LinearGradient>
  );
};

const styles = StyleSheet.create({



  sheetTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  



  background: { flex: 1, alignItems: "center" },
  wrapper: { flex: 1 },
  container: { alignItems: "center", paddingTop: 60, paddingBottom: 150 },
  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 40,
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 100,
    borderWidth: 1.2,
    borderColor: "#9028FF",
    backgroundColor: "#1F0248",
    overflow: "hidden",
    marginBottom: 25,
  },
  switchHighlight: {
    position: "absolute",
    width: "50%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#9028FF",
  },
  switchButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  switchText: { color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "600" },
  switchTextActive: { color: "#fff", fontWeight: "700" },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  sheetContainer: { flex: 1, justifyContent: "center" },
  sheetContent: { alignItems: "center", paddingTop: 10 },
  sheetBorder: { padding: 10, overflow: "hidden", elevation: 5 },

  resultTitle: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "SF‑Pro‑Medium",
    fontWeight: "500",
    textAlign: "center",
  },
  resultWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
  },
  resultModal: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  
  cardOnly: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1F0248",
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    width: "80%",
    height: "55%",
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  prizeText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "SF‑Pro‑Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    lineHeight: 31.2,
  },
  tonIconWrapper: {
    marginLeft: 8,
    width: 24,
    height: 24,
  },
  tonIcon: {
    width: 24,
    height: 24,
  },
  okButton: {
    width: "90%",
    height: 60,
    marginTop: 24,
    backgroundColor: "#6B3FD8",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(37,2.31,71.87,0.50)",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 8,
  },
  okButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "SF‑Pro‑Medium",
    fontWeight: "600",
    textTransform: "capitalize",
    lineHeight: 23.4,
  },


  bottomSheetContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  timelineIcon: {
    width: "85%",
    aspectRatio: 1.15,
    marginBottom: 8,
    alignSelf: "center",
  },
  orangePng: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    resizeMode: "contain",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  tabButton: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#6B3FD8",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: "#6B3FD8",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "SF-Pro-Semibold",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  tabIcon: {
    width: 18,
    height: 18,
    marginLeft: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B3FD8",
    borderRadius: 100,
    width: "100%",
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    ...(Platform.OS === "web" ? { outline: "none" } : {}), // 🔹 это добавит нужное только на Web
  },
  inputIcon: {
    width: 26,
    height: 26,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  placeButton: {
    width: "85%",
    aspectRatio: 4.8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 25,
  },
  
});

export default Case;
