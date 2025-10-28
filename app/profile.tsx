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
  ScrollView,
  TextInput, // ✅ добавлено
} from "react-native";
import CustomBottomSheet from "../components/CustomBottomSheet";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import IconTimeline from "../components/icons/Timeline.svg";

import BalanceButton from "../components/Buttons/BalanceButton";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import * as Font from "expo-font";
import Svg, { Text as SvgText } from "react-native-svg";
import OrangePng from "../components/icons/OrangePng.png"; // ✅ твой PNG-фон кнопки


// ===== Импорт иконок =====
import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import IconGift from "../components/icons/gift.png";
import IconStar from "../components/icons/star.svg";
import IconTon from "../components/icons/ton.svg";
import IconCopy from "../components/icons/copy.svg";

import IconArrow from "../components/icons/arrow.svg"; // добавляем стрелку обратно

import { useLaunchParams } from "@telegram-apps/sdk-react";



const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const Profile = () => {
  
  type InventoryItem = {
    id: string;
    name: string;
    value: string;
  };
  
// === Инвентарь ===
const [showInventorySheet, setShowInventorySheet] = useState(false);
const [inventory, setInventory] = useState<InventoryItem[]>([]);

// === Withdraw BottomSheet ===
const [showWithdrawSheet, setShowWithdrawSheet] = useState(false);
const [withdrawAmount, setWithdrawAmount] = useState("");


  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);

  const [tgName, setTgName] = useState("User");
  const [tgAvatar, setTgAvatar] = useState<string | null>(null);

  const [activeMenu, setActiveMenu] = useState<"deposit" | "stars" | "ton">("deposit");

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;


  const [showBottomSheet, setShowBottomSheet] = useState(false);
const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("TON");
const [tonAmount, setTonAmount] = useState("");
const [starsAmount, setStarsAmount] = useState("");

// === Terms BottomSheet ===
const [showTermsSheet, setShowTermsSheet] = useState(false);


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
  

  // === BottomSheet (панель) ===
  const [openMenu, setOpenMenu] = useState<null | "deposit" | "stars" | "ton">(null);

  const snapPoints = useMemo(() => {
    if (!openMenu) return [];
    return ["80%", "80%"];
  }, [openMenu]);


  const [fontLoaded, setFontLoaded] = useState(false);

useEffect(() => {
  const loadFont = async () => {
    await Font.loadAsync({
      "SF-Pro-Semibold": require("../fonts/SF-Pro-Display-Semibold.otf"),
      "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
      "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
      "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),

    });
    setFontLoaded(true);
  };
  loadFont();
}, []);



// ...

useEffect(() => {
  const user = launchParams?.tgWebAppData?.user;
  if (user) {
    setTgName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
    setTgAvatar(user.photo_url || null);
  } else {
    console.log("⚠️ No user data found in Telegram launchParams");
  }
}, [launchParams]);

  

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

  // === Размер ячеек инвентаря ===
  const ITEM_GAP = 14;
  const H_PADDING = 32;
  const ITEMS_PER_ROW = 3;
  const MAX_ITEM_SIZE = 110;

  const itemSize = useMemo(() => {
    const size =
      (fixedWidth - H_PADDING * 2 - ITEM_GAP * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;
    return Math.min(size, MAX_ITEM_SIZE);
  }, [fixedWidth]);

   // === Адаптивный шрифт ===
   const getFontSize = () => {
    if (screenWidth < 360) return 10; // узкие телефоны
    if (screenWidth < 420) return 13; // обычные телефоны
    if (screenWidth < 768) return 16; // планшеты
    return 18; // desktop
  };

  

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <ScrollView
  contentContainerStyle={[
    styles.scrollContainer,
    { width: fixedWidth, minHeight: screenHeight * 1.2 },
  ]}
  showsVerticalScrollIndicator={false}
  pinchGestureEnabled={false}
  scrollEventThrottle={16}
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

          <BalanceButton     onPress={() => {
      setActiveMenu("ton");
      setSelectedTab("TON");
      setShowBottomSheet(true);
    }} />
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
        <View style={styles.menuRow}>
  {/* Deposit */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      setActiveMenu("deposit");
      setSelectedTab("Gifts");
      setShowBottomSheet(true);
    }}
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
        { fontSize: getFontSize(), lineHeight: getFontSize() * 1.3 },
        activeMenu === "deposit" && styles.menuTextActive,
      ]}
    >
      Deposit
    </Text>
    <Image source={IconGift} style={styles.icon} resizeMode="contain" />
  </TouchableOpacity>

  {/* Stars */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      setActiveMenu("stars");
      setSelectedTab("Stars");
      setShowBottomSheet(true);
    }}
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
        { fontSize: getFontSize(), lineHeight: getFontSize() * 1.3 },
        activeMenu === "stars" && styles.menuTextActive,
      ]}
    >
      Stars
    </Text>
    <Image source={IconStar} style={styles.icon} resizeMode="contain" />
  </TouchableOpacity>

  {/* TON */}
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => {
      setActiveMenu("ton");
      setSelectedTab("TON");
      setShowBottomSheet(true);
    }}
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
        { fontSize: getFontSize(), lineHeight: getFontSize() * 1.3 },
        activeMenu === "ton" && styles.menuTextActive,
      ]}
    >
      TON
    </Text>
    <Image source={IconTon} style={styles.icon} resizeMode="contain" />
  </TouchableOpacity>
</View>


          {/* Инвентарь */}
          <View style={styles.inventoryRow}>
            <Text style={styles.inventoryText}>Inventory (0)</Text>
            <Pressable style={styles.sellButton} onPress={() => setShowInventorySheet(true)}>
            <Text style={styles.sellButtonText}>Sell All</Text>
            </Pressable>
          </View>

          <View style={styles.inventoryGrid}>
  {[1, 2, 3].map((_, i) => (
    <Pressable
  key={i}
  style={[styles.inventoryItem, { width: itemSize, height: itemSize }]}
  onPress={() => setShowInventorySheet(true)}
>

      <View style={styles.giftIconWrapper}>
        {i === 2 ? (
          <Image
            source={IconArrow}
            style={styles.arrow}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={IconGift}
            style={[
              styles.inventoryIcon,
              i === 0 && { tintColor: "rgba(53, 40, 81, 1)" }, // 1 подарок — жёлтый
              i === 1 && { tintColor: "rgba(53, 40, 81, 1)" }, // 2 подарок — красный
            ]}
            resizeMode="contain"
          />
        )}
      </View>
    </Pressable>
  ))}
</View>


        </View>

        {/* Invite friends */}
        <View style={[styles.newMenuContainer, styles.sectionGap]}>
          <View style={styles.inviteTopRow}>
            <Text style={styles.inviteText}>
              Invite friends and earn 10% of their deposits
            </Text>
            <Pressable style={styles.termsButton} onPress={() => setShowTermsSheet(true)}>
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


        {/* 🔹 Баланс и рефералы */}
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

  <Pressable
  style={styles.withdrawButton}
  onPress={() => setShowWithdrawSheet(true)}
>
  <Text style={styles.withdrawText}>Withdraw</Text>
</Pressable>

</View>

      </ScrollView>

      {/* === Bottom Sheet Меню === */}
      <CustomBottomSheet
  visible={showBottomSheet}
  onClose={() => setShowBottomSheet(false)}
  heightRatio={0.8}
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
        { key: "Gifts", label: "Gifts", icon: IconGift },
        { key: "Stars", label: "Stars", icon: IconStar },
        { key: "TON", label: "TON", icon: IconTon },
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
    {/* ✅ Иконка Timeline */}
    <Image
      source={IconTimeline}
      style={styles.timelineIcon}
      resizeMode="contain" // ✅ сохраняет пропорции
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
            source={selectedTab === "Stars" ? IconStar : IconTon}
            resizeMode="contain"
            style={styles.inputIcon}
          />
        </View>

{/* Кнопка DEPOSIT (через OrangeBtn) */}
<TouchableOpacity
  activeOpacity={0.9}
  style={[styles.placeButton, { width: fixedWidth * 1.4 }]}
  onPress={() =>
    console.log(
      `Depositing ${selectedTab === "TON" ? tonAmount : starsAmount} ${selectedTab}`
    )
  }
>
  {/* ✅ Градиентный фон из твоего OrangeBtn */}
  <Image
    source={OrangePng}
    style={styles.orangePng}
    resizeMode="contain"
  />

  {/* ✅ Объёмный SVG-текст как в Crash */}
 {/* ✅ Объёмный SVG-текст с идеальным выравниванием */}
<Svg
  height="100%"
  width="100%"
  style={StyleSheet.absoluteFillObject}
  viewBox="0 0 400 100" // 🔹 управляем координатами вручную
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
    y="45%"       // ✅ ключ: смещение на 58% центрирует текст идеально
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



{/* === Bottom Sheet Условий (Terms) === */}
<CustomBottomSheet
  visible={showTermsSheet}
  onClose={() => setShowTermsSheet(false)}
  heightRatio={0.75}
>
  <ScrollView
    contentContainerStyle={styles.bottomSheetContainer}
    showsVerticalScrollIndicator={false}
  >
    <Text style={styles.sheetTitle}>📜 Referral Terms</Text>

    <Text style={styles.sheetText}>
      Invite your friends using your personal link and earn{" "}
      <Text style={{ color: "#B98CFF", fontWeight: "600" }}>10%</Text> of their
      total deposits directly to your balance.
    </Text>

    <Text style={styles.sheetText}>
      You can invite an unlimited number of friends. Rewards are credited
      automatically once your referred user completes a deposit.
    </Text>

    <Text style={styles.sheetText}>
      Abuse or creating multiple accounts is strictly prohibited and may lead
      to referral reward removal.
    </Text>

    <Pressable
      style={[styles.sellButtonSheet, { marginTop: 20, backgroundColor: "#6B3FD8" }]}
      onPress={() => setShowTermsSheet(false)}
    >
      <Text style={[styles.sellButtonText, { color: "#fff" }]}>Got it</Text>
    </Pressable>
  </ScrollView>
</CustomBottomSheet>




{/* === Bottom Sheet Инвентаря === */}
<CustomBottomSheet
  visible={showInventorySheet}
  onClose={() => setShowInventorySheet(false)}
  heightRatio={0.75}
>
  <View style={styles.bottomSheetContainer}>
    <Text style={styles.sheetTitle}>Your Inventory</Text>

    {inventory.length === 0 ? (
      <Text style={{ color: "#aaa", marginTop: 16 }}>No gift cards available</Text>
    ) : (
      <>
        <ScrollView
          style={{ width: "100%", marginTop: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 80 }}
        >
          {inventory.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#1F0248",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
                {item.name}
              </Text>
              <Text style={{ color: "#C4BED4", marginTop: 4 }}>{item.value}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable
          style={[styles.sellButtonSheet, { marginTop: 16, backgroundColor: "#6B3FD8" }]}
          onPress={() => {
            console.log("✅ Sold all gift cards");
            setInventory([]);
            setShowInventorySheet(false);
          }}
        >
          <Text style={[styles.sellButtonText, { color: "#fff" }]}>Sell All</Text>
        </Pressable>
      </>
    )}
  </View>
</CustomBottomSheet>


{/* === Bottom Sheet Withdraw TON === */}
<CustomBottomSheet
  visible={showWithdrawSheet}
  onClose={() => setShowWithdrawSheet(false)}
  heightRatio={0.75}
>
  <ScrollView
    contentContainerStyle={styles.bottomSheetContainer}
    showsVerticalScrollIndicator={false}
  >
    <Text style={styles.sheetTitle}>💸 Withdraw TON</Text>

    <Text style={styles.sheetText}>
      Enter the amount of TON you want to withdraw from your balance.
    </Text>

    {/* Поле ввода TON */}
    <View style={[styles.inputWrapper, { marginTop: 30 }]}>
      <TextInput
        placeholder="0"
        placeholderTextColor="#777"
        style={styles.textInput}
        keyboardType="numeric"
        value={withdrawAmount}
        onChangeText={setWithdrawAmount}
      />
      <Animated.Image
        source={IconTon}
        resizeMode="contain"
        style={styles.inputIcon}
      />
    </View>

    {/* ✅ Адаптивная оранжевая кнопка — как в Deposit */}
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.placeButton, { width: fixedWidth * 1.4, marginTop: 25 }]}
      onPress={() => {
        console.log(`Withdrawing ${withdrawAmount} TON`);
        setShowWithdrawSheet(false);
      }}
    >
      <Image source={OrangePng} style={styles.orangePng} resizeMode="contain" />

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
          WITHDRAW
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
          WITHDRAW
        </SvgText>
      </Svg>
    </TouchableOpacity>
  </ScrollView>
</CustomBottomSheet>


    </LinearGradient>
  );
};

// ===== Стили =====
const styles = StyleSheet.create({


  sellButtonSheet: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    backgroundColor: "#1F0248",
    width: "100%",
    height: 60,
  },

  bottomSheetContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  timelineIcon: {
    width: "85%",          // адаптивная ширина
    aspectRatio: 1.15,      // сохраняет пропорции (чуть вытянут по горизонтали)
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
    aspectRatio: 4.8, // 🔥 сохраняет пропорции картинки автоматически
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 25,
  },
  depositText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 2,
  },
  




  scrollContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,        // отступ сверху
    paddingBottom: 200,    // отступ снизу
    gap: 2,               // равномерный вертикальный промежуток между всеми секциями
  },
  

  tonIcon: { width: 24, height: 24 },
  emptyMenuContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "90%", alignSelf: "center", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#352851", paddingVertical: 16, paddingHorizontal: 12, gap: 20, },

  balanceLeft: { flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 6, }, 
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 6, }, 
  balanceLabel: { color: "#C4BED4", fontSize: 18, fontWeight: "500", lineHeight: 23.4, fontFamily: "SF-Pro-regular" }, 
  balanceValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "200", fontFamily: "SF-Pro-regular" },

  withdrawButton: { height: 56, justifyContent: "center", alignItems: "center", flex: 1, borderRadius: 100, backgroundColor: "#6B3FD8", }, 

  withdrawText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", fontFamily: "SF-Pro-Semibold" },

  background: { flex: 1, alignItems: "center" },
  wrapper: { flex: 1, alignSelf: "center" },
  sectionGap: { marginTop: 20 },
  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    alignSelf: "center",
  },
  arrow: {
    width: 36,
    height: 36,
    tintColor: "#A07BFF", // фиолетовая стрелка
    opacity: 0.9,
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
  userName: { color: "#fff", fontWeight: "700", fontSize: 24, marginTop: 10, lineHeight: 31.20, fontFamily: "SF-Pro-Semibold" },
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
  menuText: {
    color: "#fff",
    fontWeight: "600",
    opacity: 0.85,
    fontFamily: "SF-Pro-Semibold",
    letterSpacing: 1,
  },
  
  menuTextActive: { opacity: 1, fontWeight: "700" },
  icon: { width: 18, height: 18, marginLeft: 1 },
  inventoryRow: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  inventoryText: { color: "#C4BED4", fontSize: 18, fontWeight: "500", opacity: 0.8, fontFamily: "SF-Pro-Regular", lineHeight: 23.40 },
  sellButton: {

    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    backgroundColor: "#1F0248",
  },
  sellButtonText: { color: "#B98CFF", fontSize: 15, fontWeight: "600",  },
  inventoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 6,
    paddingHorizontal: 16,
  },
  inventoryItem: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#1F0248",
  },
  giftIconWrapper: { justifyContent: "center", alignItems: "center" },
  inventoryIcon: { width: 36, height: 36, opacity: 0.9 },
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
    fontSize: 19,
    fontWeight: "500",
    lineHeight: 23.4,
     fontFamily: "SF-Pro-Regular"
  },
  termsButton: {
    height: 34,
    width: "18%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: "#1F0248",
  },
  termsText: { color: "#B98CFF", fontSize: 15, fontWeight: "600"  
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
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
  },
  inviteButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 19, fontFamily: "SF-Pro-Semibold" },
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
  sheetBackground: {
    backgroundColor: "#352851",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sheetHandle: { backgroundColor: "#6B3FD8", width: 60 },
  sheetContent: { padding: 20, alignItems: "center" },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  sheetText: { color: "#C4BED4", fontSize: 16, textAlign: "center", marginBottom: 12 },
  modalButton: {
    backgroundColor: "#6B3FD8",
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 6,
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default Profile;
