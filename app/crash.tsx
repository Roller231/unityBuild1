// Crash.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Image,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { CrashEngine, CrashEngineState } from "../components/CrashEngine";
import CrashGraph from "../components/CrashGraph";
import Svg, {  Text as SvgText, SvgUri } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

import OrangeBtn from "../components/OrangeBtn";
import * as Font from "expo-font";
import BetItem, { BetItemProps } from "../components/BetItem";
import StarsBackground from "../components/StarsBackground";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import HistoryBar from "../components/HistoryBar";


import { useUser } from "../components/UserContext";
import { apiGet } from "../utils/api";



import BalanceButton from "../components/Buttons/BalanceButton";

import userIcon from "../components/icons/user.svg"; // или user.svg — смотри по проекту

import vzryv from "../components/icons/vzryv.json";
import LottieView from "lottie-react-native";

import lottieWeb from "lottie-web";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { onLanguageChange } from "@/components/languageEvents";

import ava from "../components/icons/AvatarTest.svg";
import Venus from "../components/icons/Venus.svg";
import bliks from "../components/icons/bliks.svg";

import { useCrashSocket } from "../hooks/useCrashSocket";


import giftIcon from "../components/icons/gift.png";
import starIcon from "../components/icons/star.svg";
import tonIcon from "../components/icons/ton.svg";

import CustomBottomSheet from "../components/CustomBottomSheet";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// if (Platform.OS === "web" && typeof window !== "undefined") {
//   const alreadyReloaded = sessionStorage.getItem("crash_reloaded");
//   if (!alreadyReloaded) {
//     sessionStorage.setItem("crash_reloaded", "1");
//     window.location.reload();
//   }
// }
export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
};


type UserInventoryEntry = {
  drop_id: string;
  count: number;
};

type CaseInfo = {
  id: number;
  name: string;
  price: number;
  gradient_colours: string;
  icon: string;
};

type InventoryItemExpanded = {
  uniqueId: string;
  dropId: string;
  name: string;
  price: number;
  image: string;
};
const InventoryImage = ({ uri }: { uri: string }) => {
  if (!uri) return null;

  const isSvg = uri.toLowerCase().endsWith(".svg");

  return isSvg ? (
    <SvgUri uri={uri} width="80%" height="55%" />
  ) : (
    <Image
      source={{ uri }}
      style={{
        width: "100%",
        height: 120,
        borderRadius: 12,
        marginBottom: 10,
      }}
      resizeMode="contain"
    />
  );
};
const Crash: React.FC = () => {


  const { user, setUser } = useUser();

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1B003B", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", opacity: 0.7 }}>Loading…</Text>
      </View>
    );
  }

  const roundIdRef = useRef<number | null>(null);
  
  


  const [inventoryItems, setInventoryItems] = useState<InventoryItemExpanded[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  

  
  useFocusEffect(
    useCallback(() => {
      const loadInventory = async () => {
        if (!user) return;
        console.log("sadsad");
        setIsInventoryLoading(true);
      
        // локальный кэш — не делать повторные запросы на одинаковые drop_id
        const dropCache = new Map<string, CaseInfo>();
      
        try {
          const rawInv = user.inventory as UserInventoryEntry[];
          const expanded: InventoryItemExpanded[] = [];
      
          for (const entry of rawInv) {
            const { drop_id, count } = entry;
      
            let info: CaseInfo;
      
            // ⚡️ если уже был этот drop_id — берём из кэша
            if (dropCache.has(drop_id)) {
              info = dropCache.get(drop_id)!;
            } else {
              // 🛰️ иначе — запрашиваем с бэка и сохраняем в кэш
              info = await apiGet(`/drops/${drop_id}`);
              dropCache.set(drop_id, info);
            }
      
            // разворачиваем каждый drop на `count` штук
            for (let i = 0; i < count; i++) {
              expanded.push({
                uniqueId: `drop_${drop_id}_${i}`,
                dropId: drop_id,
                name: info.name,
                price: info.price,
                image: info.icon,
              });
            }
          }
      
          setInventoryItems(expanded);
        } catch (err) {
          console.warn("❌ Ошибка загрузки инвентаря:", err);
        } finally {
          setIsInventoryLoading(false);
        }
      };
      
  
      loadInventory();
    }, [user?.inventory])
  );
  
  const [myActiveBet, setMyActiveBet] = useState(null); 

  const [graphKey, setGraphKey] = useState(0);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : Math.min(screenWidth, 470);
  const scale = (size: number) => size * (fixedWidth / 390);
  const styles = createStyles(fixedWidth, screenHeight, isDesktop);
  
  const [crashCounter, setCrashCounter] = useState(0);

  const [resetKey, setResetKey] = useState(0);
  const [phase, setPhase] = useState<"idle" | "countdown" | "flight" | "crash">("idle");
  const [count, setCount] = useState(3);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [active, setActive] = useState(true);
  const [engine, setEngine] = useState<CrashEngine | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [pastCoeffs, setPastCoeffs] = useState<number[]>([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("Gifts");


  const [betItems, setBetItems] = useState<BetItemProps[]>([]);
  const usersCache = useRef<Record<number, any>>({});
  

  const [webReady, setWebReady] = useState(Platform.OS !== "web");

  const [serverRoundId, setServerRoundId] = useState<number | null>(null);

  const [autoCashoutGift, setAutoCashoutGift] = useState(false);
  const [autoValueGift, setAutoValueGift] = useState("2.0");
  
  // bottom sheet states
  const [starsAmount, setStarsAmount] = useState("");
  const [tonAmount, setTonAmount] = useState("");
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoValue, setAutoValue] = useState("2.0");

  const rotation = useRef(new Animated.Value(0)).current;

  const [serverMultiplier, setServerMultiplier] = useState(1);
  const [serverPhase, setServerPhase] = useState("idle");
  const [serverCrashPoint, setServerCrashPoint] = useState(null);

  const [showDepositSheet, setShowDepositSheet] = useState(false);
  const [depositTab, setDepositTab] = useState<"Gifts" | "Stars" | "TON">("TON");


  const convertBetToBetItem = (bet: any, user: any): BetItemProps => {
    const amount = Number(bet.amount ?? 0);
    const profit = Number(bet.profit ?? 0);
  
    const isWin = bet.cashout_multiplier !== null && profit > 0;
    const isLose = bet.cashout_multiplier === null && profit < 0;  // ← 🟣 ВАЖНО!
  
    const state = isWin ? "win" : isLose ? "lose" : "active";
  
    let total: number;
  
    if (isWin) {
      total = profit;
    } else if (isLose) {
      total = -amount;
    } else {
      total = 0;
    }
  
    return {
      avatar: user.url_image || require("../components/icons/AvatarTest.svg"),
      username: user.username || user.firstname || "User",
      betAmount: amount,
      multiplier: Number(bet.cashout_multiplier ?? 0),
      total,
      state,
      isGift: bet.gift,
    };
  };
  
  
  useEffect(() => {
    if (phase === "countdown") {
      fetchRoundBets(roundIdRef.current);
    }
  }, [count]);
  

  

  const fetchRoundBets = async (roundId: number | null) => {
    if (!roundId) {
      setBetItems([]);
      return;
    }

    console.log("GEEEETTTDS");
  
    try {
      const ids = [roundId - 1, roundId, roundId + 1];
  
      // запрашиваем ставки всех 3 раундов
      const betSets = await Promise.all(
        ids.map(id =>
          id > 0
            ? apiGet(`/crash-bets/round/${id}`).catch(() => [])
            : Promise.resolve([])
        )
      );
  
      const allBets = betSets.flat();
  
      // === Загружаем всех уникальных юзеров ===
      const uniqUserIds = [...new Set(allBets.map(b => b.user_id))];

      const userMap: Record<number, any> = {};
      
      await Promise.all(
        uniqUserIds.map(async uid => {
          // 1. Проверяем кэш
          if (usersCache.current[uid]) {
            userMap[uid] = usersCache.current[uid];
            return;
          }
      
          // 2. Если uid > 0 → обычный юзер
          if (uid > 0) {
            try {
              const u = await apiGet(`/users/${uid}`);
              const mapped = { ...u, isBot: false };
              usersCache.current[uid] = mapped;
              userMap[uid] = mapped;
              return;
            } catch {}
          }
      
          // 3. Если uid < 0 → бот
          if (uid < 0) {
            try {
              const botId = Math.abs(uid); // ← 🔥 убираем минус
              const bot = await apiGet(`/crash-bots/${botId}`);
      
              const mapped = {
                id: uid,                     // оставляем отрицательный как уникальный
                username: bot.nickname,
                url_image: bot.avatar_url,
                min_bet: bot.min_bet,
                max_bet: bot.max_bet,
                isBot: true,
              };
      
              usersCache.current[uid] = mapped;
              userMap[uid] = mapped;
              return;
            } catch {}
          }
      
          // 4. если не нашли ни юзера ни бота
          console.warn("⚠ Unknown user/bot id:", uid);
          const fallback = {
            id: uid,
            username: "Unknown",
            url_image: null,
            isBot: true,
          };
          usersCache.current[uid] = fallback;
          userMap[uid] = fallback;
        })
      );
      
      
  
      // === Конвертируем ставки в BetItemProps ===
      const items: BetItemProps[] = allBets.map(b =>
        convertBetToBetItem(b, userMap[b.user_id])
      );
  
      setBetItems(items);
    } catch (e) {
      console.warn("❌ Failed loading bets:", e);
      setBetItems([]);
    }
  };
  

  const cashOut = async () => {
    if (!user) return;
  
    // отправляем событие на сервер
    sendWs({
      event: "cashout",
      user_id: user.id
    });
  
    vibrate();
    fetchRoundBets(roundIdRef.current);   // 🔥 обновляем ставки мгновенно
    // ⏳ ДАЁМ серверу 100–150мс применить изменения
    setTimeout(async () => {
      try {
        // 🔥 получаем свежего пользователя
        const fresh = await apiGet(`/users/${user.id}`);
        setUser(fresh);
  
        // 🔥 сбрасываем активную ставку
        setMyActiveBet(null);
  
        console.log("💰 CASHOUT UPDATED USER:", fresh.balance);
  
      } catch (e) {
        console.warn("❌ Failed to refresh user after cashout:", e);
      }
    }, 120);
  };
  
  
  const sanitizeTonInput = (value: string) => {
    // оставить только цифры и точку
    let cleaned = value.replace(/[^0-9.]/g, "");
  
    // не даём начинать с точки — превращаем ".5" → "0.5"
    if (cleaned.startsWith(".")) {
      cleaned = "0" + cleaned;
    }
  
    // удаляем повторные точки
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts[1];
    }
  
    // запрет отрицательных (убрали минус выше) и запрет простого 0 без дробей
    if (cleaned === "0" || cleaned === "00" || cleaned === "000") {
      cleaned = "";
    }
  
    return cleaned;
  };
  const sanitizeAutoCashout = (value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, "");
  
    // превращаем ".5" → "1" (нельзя <1)
    if (cleaned.startsWith(".")) cleaned = "";
  
    // убираем повторные точки
    const parts = cleaned.split(".");
    if (parts.length > 2) cleaned = parts[0] + "." + parts[1];
  
    // если число меньше 1 — ставим 1
    if (cleaned && parseFloat(cleaned) < 1) cleaned = "1";
  
    return cleaned;
  };
  
  const tickCounterRef = useRef(0);

  
  const { send: sendWs, connected } = useCrashSocket((msg) => {
    console.log("WS EVENT:", msg);
  
    switch (msg.event) {
      case "new_round":
        roundIdRef.current = msg.round_id;   // ✅ моментально
        setPhase("countdown");
        setCount(msg.bet_phase_seconds);
        setPhase("countdown");
        setServerRoundId(msg.round_id);   // ✅ запоминаем round_id
        setMyActiveBet(null);             // ✅ на новый раунд своя ставка сначала пустая
        fetchRoundBets(msg.round_id);

        break;
      
        case "round_start":


        
          console.log("ROUND_START: ref =", roundIdRef.current);
        
          const rid = roundIdRef.current;
          if (user && rid) {
            setTimeout(async () => {
              try {
                const bets = await apiGet(`/crash-bets/user/${user.id}`);
        
                const found = bets.find(
                  (b: any) =>
                    b.round_id === rid &&
                    b.profit === null
                );
        
                console.log("FOUND BET:", found);
                setMyActiveBet(found || null);
              } catch (e) {
                console.warn("Failed to fetch bets:", e);
              }
            }, 120);
          }
          fetchRoundBets(roundIdRef.current);

          setPhase("flight");
          break;
        
        
    
  
          case "tick":
            setServerMultiplier(msg.multiplier);
            setPhase("flight");
          
            tickCounterRef.current++;
          
            // 🔥 раз в 10 тик-событий — обновляем ставки
            if (tickCounterRef.current % 10 === 0) {
              fetchRoundBets(roundIdRef.current);
            }
          
            break;
          
      
      case "cashout":
        fetchRoundBets(roundIdRef.current);
        break;
  
        case "crash":
          fetchRoundBets(roundIdRef.current);

          setPhase("crash");

      // при краше подтягиваем свежие данные юзера с бэка
      if (user) {
        (async () => {
          try {
            const freshUser = await apiGet(`/users/${user.id}`);
            setUser(freshUser);
          } catch (e) {
            console.warn("❌ Failed to refresh user on crash:", e);
          }
        })();
      }

      break;

            // запускаем мягкий reset через 2 секунды
        
    }
  });
  
  

  
  

  

  // 🌍 Переводы
const translations = {
  ru: {
    enterAmount: "Введите сумму",
    gifts: "Внести",
    stars: "Звёзды",
    ton: "TON",
    amountOfStars: "Количество звёзд",
    amountOfTon: "Количество TON",
    autoCashout: "Авто-вывод",
    placeBet: "СДЕЛАТЬ СТАВКУ",
    inventoryEmpty: "",
    connectWallet: "ПОДКЛЮЧИТЬ КОШЕЛЁК",

    giftStep1: "Перейдите в ",
    giftStep2: "Отправьте любой подарок",
    giftStep3: "Подарок появится в вашем инвентаре",
    giftStep4: "Убедитесь, что подарок отправлен с того же аккаунта Telegram",

    cashOutText: "ВЫВЕСТИ",
    place: "Поставить"
  },
  en: {
    enterAmount: "Enter amount",
    gifts: "Gifts",
    stars: "Stars",
    ton: "TON",
    amountOfStars: "Amount of Stars",
    amountOfTon: "Amount of TON",
    autoCashout: "Auto cashout",
    placeBet: "PLACE BET",
    inventoryEmpty: "",
    connectWallet: "CONNECT WALLET",

    giftStep1: "Go to your profile",
    giftStep2: "Send any gift",
    giftStep3: "The gift will appear in your inventory",
    giftStep4: "Make sure you send the gift from the same Telegram account",

    cashOutText: "CASH OUT",
    place: "Place"

  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof typeof translations["en"];

const useTranslation = (lang: Lang) => (key: TranslationKey) =>
  translations[lang][key];




// ...

const [language, setLanguage] = useState<"ru" | "en">("ru");
const t = useTranslation(language);



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

const placeTonBet = async () => {
  if (!user) return;

  const amount = parseFloat(tonAmount);

  // 🔥 Проверка перед отправкой на сервер
  if (!amount || amount <= 0) return;
  if (amount > user.balance) {
    setTonAmount(user.balance.toString());
    return;
  }

  sendWs({
    event: "bet",
    user_id: user.id,
    amount,
    gift: false,
    gift_id: null,
    auto_cashout_x: autoCashout ? parseFloat(autoValue) : null,
  });

  fetchRoundBets(roundIdRef.current);

  setUser((prev: any) => ({ ...prev, balance: prev.balance - amount }));
  setTonAmount("");
  setShowBottomSheet(false);
};




  useFocusEffect(
    useCallback(() => {
      const spin = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        })
      );
      spin.start();
      return () => {
        spin.stop();
        rotation.setValue(0);
      };
    }, [rotation])
  );

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
        "SF-Pro-Semibold": require("../fonts/SF-Pro-Display-Semibold.otf"),
        "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
        "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
        "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
  
    const handleReady = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setWebReady(true);
        }, 120); // можно увеличить до 200–250 мс, если надо
      });
    };
  
    if (document.readyState === "complete") {
      handleReady();
    } else {
      window.addEventListener("load", handleReady);
      return () => window.removeEventListener("load", handleReady);
    }
  }, []);
  

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => {
        setActive(false);
        setPhase("idle");
        setEngine(null);
        setCount(5);
      };
    }, [])
  );

  useEffect(() => {
    if (!active || phase !== "countdown") return;

    if (count > 0) {
      const timer = setTimeout(() => setCount(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase("flight");
      
    }
    
  }, [count, phase, active]);


  // 🔁 Автоматический цикл краша при загрузке страницы



  useEffect(() => {
    if (Platform.OS === "web") {
      localStorage.setItem("crash_history", JSON.stringify(pastCoeffs));
    }
  }, [pastCoeffs]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const saved = localStorage.getItem("crash_history");
      if (saved) setPastCoeffs(JSON.parse(saved));
    }
  }, []);



// === взрыв и перезапуск ===
// === взрыв и перезапуск ===
useEffect(() => {
  if (phase !== "crash") return;

  // === Счётчик крашей ===
setCrashCounter(prev => {
  const next = prev + 1;

  // 🔥 Каждый 10-й crash → мягкий перезапуск компонента
  if (next >= 5) {
    console.warn("⚠️ Soft reset after 10 crash cycles");

    setTimeout(() => {
      setResetKey(k => k + 1);   // 🔥 Пересоздание компонента
      setCrashCounter(0);        // сброс счётчика
      setPhase("idle");
    }, 300); // небольшая задержка
  }

  return next;
});


  const final = Number(lastMultiplier.toFixed(2));

  // 🟣 сохраняем множитель в историю
  if (final > 1) {
    setPastCoeffs((prev) => {
      const next = [...prev, final];
      return next.slice(-12);
    });
  }

  // 💥 Останавливаем движок
  if (engine) {
    cancelAnimationFrame((engine as any)._frameId);
    engine.state = CrashEngineState.Over;
    engine.destroy?.();
    setEngine(null);
  }

  // 💣 Очищаем анимацию взрыва
  if (Platform.OS === "web") {
    const vz = document.getElementById("vzryv-container");
    if (vz) vz.innerHTML = "";
  }

  // ⚡ Перезапуск после короткой паузы
// ⚡ Мягкий перезапуск без пересоздания компонентов
const reloadTimer = setTimeout(() => {
  // 1. Останавливаем текущий движок
  if (engine) {
    engine.destroy?.();
    setEngine(null);
  }

  // 2. Сбрасываем только игровые параметры
  setCurrentMultiplier(1);
  setLastMultiplier(1);

  // 3. Запускаем новый отсчёт
  setPhase("countdown");
  setCount(5);
}, 2000);



  return () => clearTimeout(reloadTimer);
}, [phase]);


  

  
  useFocusEffect(
    useCallback(() => {
      // При фокусе — активируем, как сейчас
      setActive(true);
  
      return () => {
        // 🔁 Когда пользователь УХОДИТ со страницы:
        // сбрасываем всё как при “перезагрузке”
        setActive(false);
        setPhase("idle");
        setCount(3);
        setEngine(null);
        setCurrentMultiplier(1);
        setLastMultiplier(1);
        setPastCoeffs([]);
        setShowBottomSheet(false);
        setResetKey((k) => k + 1); // 🔥 заставит компонент обновиться полностью
      };
    }, [])
  );
  

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (phase !== "crash" || !active) return;
    const container = document.getElementById("vzryv-container");
    if (!container) return;
    const anim = lottieWeb.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: vzryv,
    });
    anim.setSpeed(1.4);
    anim.addEventListener("complete", () => anim.destroy());
    return () => anim.destroy();
  }, [phase, active]);

  // Подход: прямой вызов, без requestAnimationFrame
  const handleStart = () => {
    setShowBottomSheet(true);
  };

  if (!fontLoaded) return null;

  const bottomSheetHeightRatio = isDesktop ? 0.8 : 0.8;

  return (
    <View key={resetKey} style={{ flex: 1, backgroundColor: "#1B003B" }}>
      <View
        style={[
          styles.container,
          isDesktop && { width: fixedWidth, borderRadius: 25, overflow: "hidden" },
        ]}
      >
        <StarsBackground />
{/* === Верхняя панель: Онлайн + Баланс === */}
{/* === Верхняя панель: Онлайн + Баланс === */}
<View style={styles.topBar}>
  {/* Онлайн капсула */}
{/* Онлайн кнопка в стиле баланса */}
<View style={styles.onlineOuterGlow}>
  <View style={styles.onlineContainer}>
  <Image
          source={require("../components/icons/user.svg")}
          style={styles.userIcon}
          resizeMode="contain"
        />
    <Text style={styles.onlineText}>234</Text>
  </View>
</View>



  {/* Баланс справа */}
  <BalanceButton 
  onPress={() => {
    setDepositTab("TON");
    setShowDepositSheet(true);
    vibrate();
  }} 
/>

</View>


        {/* вращающаяся планета */}
        <Animated.Image
          source={Venus}
          style={[
            styles.planetBackground,
            isDesktop
              ? { top: 30, left: 30, width: 130, height: 130 }
              : {
                  top: screenHeight * 0.04,
                  left: screenWidth * 0.07,
                  width: screenWidth * 0.25,
                  height: screenWidth * 0.25,
                },
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
          resizeMode="contain"
        />

        {/* === Отдельный контейнер для CrashGraph === */}
<View style={styles.graphContainer}>
{phase === "flight" && (
  <CrashGraph
    multiplier={serverMultiplier}
    phase={phase}
    active={true}
  />
)}


</View>


{/* Краш-граф поверх всех слоёв */}




        {/* === ВЕРХНЯЯ ЧАСТЬ === */}
<View style={styles.topSection}>
  {/* === Счётчик перед полётом === */}
  {phase === "countdown" && (
    <View style={styles.centered}>
      <Animated.Image
        source={bliks}
        resizeMode="contain"
        style={{
          position: "absolute",
          opacity: 0.15,
          transform: [{ rotate: rotateInterpolate }],
          top: "50%",
          left: "50%",
          width: isDesktop
            ? 650
            : screenHeight < 700
            ? screenWidth * 1.0
            : screenWidth * 1.2,
          height: isDesktop
            ? 650
            : screenHeight < 700
            ? screenWidth * 1.0
            : screenWidth * 1.2,
          marginLeft: isDesktop
            ? -325
            : screenHeight < 700
            ? -(screenWidth * 0.5)
            : -(screenWidth * 0.6),
          marginTop: isDesktop
            ? -325
            : screenHeight < 700
            ? -(screenWidth * 0.5)
            : -(screenWidth * 0.6),
        }}
      />
      <Text
        style={{
          ...(styles.countdownText as any),
          background:
            "linear-gradient(180deg, #FFAF4D 24.49%, #FFF7A7 57.14%, #FFAF4D 77.55%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "SF-Pro-Heavy",
          fontSize: isDesktop
            ? 180
            : screenHeight < 700
            ? screenWidth * 0.22
            : screenWidth * 0.3,
          zIndex: 5,
        }}
      >
        {count}
      </Text>
    </View>
  )}

  {/* === Полёт === */}
  {phase === "flight" && (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        transform: [
          {
            scale:
              isDesktop
                ? 1
                : screenHeight < 700
                ? 0.75
                : screenHeight < 850
                ? 0.9
                : 1,
          },
        ],
      }}
    >



    </View>
  )}

  {/* === Взрыв === */}
  {phase === "crash" && (
    <View style={styles.centered}>
      {Platform.OS === "web" ? (
        <div
          id="vzryv-container"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            height: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9999,
            background: "transparent",
          }}
        />
      ) : (
        <LottieView
          source={vzryv}
          autoPlay
          loop={false}
          style={{
            width: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            height: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: [
              { translateX: -200 },
              { translateY: -200 },
            ],
            backgroundColor: "transparent",
            zIndex: 9999,
          }}
        />
      )}
    </View>
  )}
</View>


        {/* === НИЖНЯЯ ЧАСТЬ === */}
        <View style={styles.bottomSection}>
        <HistoryBar
  phase={phase}
  currentMultiplier={serverMultiplier}
/>





<TouchableOpacity
  activeOpacity={0.9}
  style={[styles.placeButton, { width: fixedWidth * 0.9 }]}
  onPress={() => {
    if (myActiveBet) {
      cashOut();
    } else {
      handleStart();
      
    }
  }}
>

            <OrangeBtn
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject as any}
            />
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
              <SvgText
                fill="none"
                stroke="#D35100"
                strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                fontFamily="SF‑Pro‑Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={3}
              >
                                      {myActiveBet ? t("cashOutText") : t("placeBet")}

              </SvgText>
              <SvgText
                fill="#FFF"
                fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                                fontFamily="SF‑Pro‑Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={3}
              >
                                      {myActiveBet ? t("cashOutText") : t("placeBet")}

              </SvgText>
            </Svg>
          </TouchableOpacity>

          <View style={[styles.betsContainer, { width: fixedWidth * 0.9 }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.betsScrollContainer,
                { width: fixedWidth * 0.9, minHeight: screenHeight * 1 },
              ]}
            >
              {betItems.map((item, i) => (
  <BetItem key={i} {...item} />
))}

            </ScrollView>
          </View>
        </View>
      </View>


      <CustomBottomSheet
  visible={showDepositSheet}
  onClose={() => setShowDepositSheet(false)}
  heightRatio={0.8}
>
  <ScrollView
    contentContainerStyle={styles.bottomSheetContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    nestedScrollEnabled
  >
    <Text style={styles.sheetTitle}>{t("enterAmount")}</Text>

    {/* Вкладки Gifts / Stars / TON */}
    <View style={{
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: scale(20),
      flexWrap: "nowrap",
      width: fixedWidth,
      alignSelf: "center",
    }}>
      {[
        { key: "Gifts", label: t("gifts"), icon: giftIcon },
        { key: "Stars", label: t("stars"), icon: starIcon },
        { key: "TON", label: t("ton"), icon: tonIcon },
      ].map(({ key, label, icon }) => {
        const active = depositTab === key;
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.9}
            onPress={() => setDepositTab(key as "Gifts" | "Stars" | "TON")}

            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: scale(2),
              borderColor: "#6B3FD8",
              borderRadius: 100,
              backgroundColor: active ? "#6B3FD8" : "transparent",
              paddingVertical: scale(10),
              paddingHorizontal: scale(16),
              marginHorizontal: scale(6),
              minWidth: scale(90),
            }}
          >
            <Text style={{
              color: "#fff",
              fontSize: scale(14),
              fontFamily: "SF-Pro-Semibold",
              letterSpacing: 0.2,
              fontWeight: active ? "700" : "500",
              marginRight: scale(5),
            }}>
              {label}
            </Text>
            <Image source={icon} resizeMode="contain" style={{ width: scale(18), height: scale(18) }} />
          </TouchableOpacity>
        );
      })}
    </View>

    {depositTab === "Gifts" && (
  <View style={styles.giftStepsWrapper}>
    {/* === Вертикальная линия (градиент) === */}
    <LinearGradient
      colors={["#59AACC", "rgba(89, 170, 204, 0)"]}
      style={styles.verticalLine}
    />

    {/* === Содержимое шагов === */}
    <View style={styles.giftStepsContainer}>
      {/* === Шаг 1 === */}
      <View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepNumber}>1</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>


    {t("giftStep1")} <Text
  style={[
    styles.stepHighlight,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>@GiftUpRelayer</Text>
  </Text>
</View>

<View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepNumber}>2</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep2")}</Text>
</View>

<View style={styles.stepRow}>
  <View style={[styles.stepCircle, styles.stepCirclePurple]}>
    <Image
      source={require("../components/icons/gift.png")}
      style={styles.stepGiftIcon}
      resizeMode="contain"
    />
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep3")}</Text>
</View>

<View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepAlert}>!</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep4")}</Text>
</View>


      {/* === Кнопка CONNECT WALLET === */}
     {/* === Кнопка CONNECT WALLET === */}
<View style={{ width: "100%", alignItems: "center", marginTop: 0 }}>
<TouchableOpacity
                activeOpacity={0.9}
                style={[styles.placeButton, { width: fixedWidth * 0.95 }]}
              >
                <OrangeBtn
                  width="100%"
                  height="100%"
                  style={StyleSheet.absoluteFillObject as any}
                />
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                  <SvgText
                    fill="none"
                    stroke="#D35100"
                    strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                    fontSize={fixedWidth * 0.047}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("connectWallet")}
                  </SvgText>
                  <SvgText
                    fill="#FFF"
                    fontSize={fixedWidth * 0.047}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("connectWallet")}
                  </SvgText>
                </Svg>
              </TouchableOpacity>
</View>

    </View>
  </View>
)}


    {(depositTab === "Stars" || depositTab === "TON") && (
      <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
        <Text style={styles.inputLabel}>
          {depositTab === "Stars" ? t("amountOfStars") : t("amountOfTon")}
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="0"
            placeholderTextColor="#777"
            style={styles.textInput}
            keyboardType="numeric"
          />
          <Image source={depositTab === "Stars" ? starIcon : tonIcon}
            style={styles.inputIcon}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.placeButton, { width: fixedWidth * 0.9 }]}

              >
                <OrangeBtn
                  width="100%"
                  height="100%"
                  style={StyleSheet.absoluteFillObject as any}
                />
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                  <SvgText
                    fill="none"
                    stroke="#D35100"
                    strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                    fontSize={fixedWidth * 0.047}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("connectWallet")}
                  </SvgText>
                  <SvgText
                    fill="#FFF"
                    fontSize={fixedWidth * 0.047}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("connectWallet")}
                  </SvgText>
                </Svg>
              </TouchableOpacity>
      </View>
    )}
  </ScrollView>
</CustomBottomSheet>


      <CustomBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        heightRatio={bottomSheetHeightRatio}
      >
        <ScrollView
          contentContainerStyle={styles.bottomSheetContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
<Text style={styles.sheetTitle}>{t("enterAmount")}</Text>

          {/* Tabs */}
         {/* === Три вкладки Gifts / Stars / TON === */}
{/* === Три вкладки Gifts / Stars / TON — 1в1 с Profile === */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(20),
    flexWrap: "nowrap",
  }}
>
  {[
    { key: "Gifts", label: t("gifts"), icon: giftIcon },
    
    { key: "TON", label: t("ton"), icon: tonIcon },
  ].map(({ key, label, icon }) => {
    const activeTab = selectedTab === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.9}
        onPress={() => setSelectedTab(key as "Gifts" | "Stars" | "TON")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: scale(2),
          borderColor: "#6B3FD8",
          borderRadius: 100,
          backgroundColor: activeTab ? "#6B3FD8" : "transparent",
          paddingVertical: scale(10),
          paddingHorizontal: scale(16),
          marginHorizontal: scale(6),
          minWidth: scale(90),
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: scale(14),
            fontFamily: "SF-Pro-Semibold",
            letterSpacing: 0.2,
            fontWeight: activeTab ? "700" : "500",
            marginRight: scale(5),
          }}
        >
          {label}
        </Text>
        <Animated.Image
          source={icon}
          resizeMode="contain"
          style={{ width: scale(18), height: scale(18) }}
        />
      </TouchableOpacity>
    );
  })}
</View>



          {/* Content */}
          {selectedTab === "Gifts" && (
  <View style={{ width: "100%", marginTop: 10, paddingHorizontal: 10 }}>
    
    {(!user?.inventory || user.inventory?.length === 0) && (
  <Text>{t("inventoryEmpty")}</Text>
)}


    <ScrollView
      style={{ width: "100%", marginTop: 10 }}
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingBottom: 100,
        rowGap: 12,
      }}
    >

<View style={styles.autoRow}>
  <TouchableOpacity
    style={[styles.checkbox, autoCashoutGift && styles.checkboxActive]}
    onPress={() => setAutoCashoutGift((prev) => !prev)}
  />
  <Text style={styles.autoLabel}>{t("autoCashout")}</Text>

  <View style={styles.autoValueRow}>
    <TouchableOpacity
      onPress={() =>
        setAutoValueGift((prev) =>
          Math.max(1, parseFloat(prev) - 0.1).toFixed(1)
        )
      }
    >
      <Text style={styles.autoControl}>−</Text>
    </TouchableOpacity>
    <TextInput
      style={styles.autoInput}
      value={autoValueGift}
      keyboardType="numeric"
      onChangeText={(text) => setAutoValueGift(sanitizeAutoCashout(text))}
    />
    <TouchableOpacity
      onPress={() =>
        setAutoValueGift((prev) => (parseFloat(prev) + 0.1).toFixed(1))
      }
    >
      <Text style={styles.autoControl}>＋</Text>
    </TouchableOpacity>
  </View>
</View>

    
      {inventoryItems.map((item) => (
        <View
          key={item.uniqueId}
          style={{
            width: "48%",
            backgroundColor: "#1F0248",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          {/* Картинка подарка */}
          <InventoryImage uri={item.image} />

          {/* Имя */}
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              width: "100%",
            }}
          >
            {item.name}
          </Text>

          {/* Цена */}
          <Text
            style={{
              color: "#C4BED4",
              marginTop: 4,
              marginBottom: 12,
              textAlign: "center",
              width: "100%",
            }}
          >
            {item.price.toFixed(2)} TON
          </Text>

          

          {/* === КНОПКА ПОСТАВИТЬ === */}
          <TouchableOpacity
            style={{
              width: "100%",
              height: 42,
              borderRadius: 10,
              backgroundColor: "#6B3FD8",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              // === 1) Локально скрываем один подарок ===
              setInventoryItems((prev) =>
                prev.filter((x) => x.uniqueId !== item.uniqueId)
              );
            
              // === 2) Отправляем ставку на сервер ===
              sendWs({
                event: "bet",
                user_id: user.id,
                gift: true,
                gift_id: item.dropId,
                amount: item.price,
                auto_cashout_x: autoCashoutGift ? parseFloat(autoValueGift) : null,
              });
            
              vibrate();
              setShowBottomSheet(false);
            }}
            
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {t("place")}
            </Text>
          </TouchableOpacity>

        </View>
      ))}
    </ScrollView>

  </View>
)}


          {(selectedTab === "Stars" || selectedTab === "TON") && (
            <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
<Text style={styles.inputLabel}>
  {selectedTab === "Stars" ? t("amountOfStars") : t("amountOfTon")}
</Text>


              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#777"
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={selectedTab === "Stars" ? starsAmount : tonAmount}
                  onChangeText={(text) => {
                    const cleaned = sanitizeTonInput(text);
                    const numeric = parseFloat(cleaned) || 0;
                  
                    if (numeric > user.balance) {
                      setTonAmount(user.balance.toString());
                    } else {
                      setTonAmount(cleaned);
                    }
                  }}
                  
                  
                />
                <Animated.Image
                  source={selectedTab === "Stars" ? starIcon : tonIcon}
                  resizeMode="contain"
                  style={styles.inputIcon}
                />
              </View>

              <View style={styles.autoRow}>
                <TouchableOpacity
                  style={[styles.checkbox, autoCashout && styles.checkboxActive]}
                  onPress={() => setAutoCashout((prev) => !prev)}
                />
<Text style={styles.autoLabel}>{t("autoCashout")}</Text>

                <View style={styles.autoValueRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setAutoValue((prev) =>
                        Math.max(1, parseFloat(prev) - 0.1).toFixed(1)
                      )
                    }
                  >
                    <Text style={styles.autoControl}>−</Text>
                  </TouchableOpacity>
                  <TextInput
  style={styles.autoInput}
  value={autoValue}
  keyboardType="numeric"
  onChangeText={(text) => setAutoValue(sanitizeAutoCashout(text))}
/>

                  <TouchableOpacity
                    onPress={() =>
                      setAutoValue((prev) => (parseFloat(prev) + 0.1).toFixed(1))
                    }
                  >
                    <Text style={styles.autoControl}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
  activeOpacity={0.9}
  style={[styles.placeButton, { width: fixedWidth * 0.85 }]}
  onPress={() => {
    if (selectedTab === "TON") {
      placeTonBet();
      vibrate();
    }
  }}
>

                <OrangeBtn
                  width="100%"
                  height="100%"
                  style={StyleSheet.absoluteFillObject as any}
                />
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                  <SvgText
                    fill="none"
                    stroke="#D35100"
                    strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                    fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("placeBet")}
                  </SvgText>
                  <SvgText
                    fill="#FFF"
                    fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("placeBet")}
                  </SvgText>
                </Svg>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
};

const createStyles = (fixedWidth: number, screenHeight: number, isDesktop: boolean) =>
  StyleSheet.create({
    textInput: {
      flex: 1,
      color: "#fff",
      fontSize: fixedWidth * 0.045,
      textAlign: "center",
      ...(Platform.OS === "web" ? { } : {}),
    } as any,

    autoInput: {
      color: "#fff",
      fontSize: fixedWidth * 0.04,
      width: fixedWidth * 0.1,       // 🔥 автоадаптация
      minWidth: 40,                  // 🔥 не меньше 40 px
      textAlign: "center",
    },
    

    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderColor: "#6B3FD8",
      borderWidth: 2,
      borderRadius: 100,
      width: fixedWidth * 0.8,
      height: 50,
      paddingHorizontal: 16,
      marginBottom: 20,
    },

    tabRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: fixedWidth * 0.04,
      marginBottom: 14,
      gap: 8,
    },
    
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 100,
      borderWidth: 2,
      borderColor: "#6B3FD8",
      backgroundColor: "transparent",
      paddingVertical: screenHeight * 0.012,

    },
    
    tabButtonActive: {
      backgroundColor: "#6B3FD8",
      borderColor: "#6B3FD8",
    },
    
    tabText: {
      color: "#C4BED4",
      fontFamily: "SF-Pro-Semibold",
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    
    tabTextActive: {
      color: "#fff",
    },
    
    tabIcon: {
      width: fixedWidth * 0.05,
      height: fixedWidth * 0.05,
      marginLeft: 4,
    },
    

    

    tabContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

   


    inputIcon: {
      width: fixedWidth * 0.06,
      height: fixedWidth * 0.06,
      marginLeft: 8,
    },

    inputLabel: { color: "#fff", fontSize: 18, marginBottom: 8 },

    autoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start", // ближе друг к другу
      width: fixedWidth * 0.8,
      marginTop: 12,
      marginBottom: 16,
    },
    

    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: "#6B3FD8",
      marginRight: 8,
    },

    checkboxActive: { backgroundColor: "#6B3FD8" },
    autoLabel: { color: "#fff", fontSize: 16, flex: 1 },
    autoValueRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#2B1B59",
      borderRadius: 100,
      paddingHorizontal: 6,
      height: 34,
      minWidth: fixedWidth * 0.1,   // 🔥 адаптивно
      justifyContent: "space-between",
      marginLeft: 4,
    },
    
    autoControl: {
      color: "#fff",
      fontSize: fixedWidth * 0.05,
      paddingHorizontal: 6,
      minWidth: 20,                  // 🔥 фиксируем размеры
      textAlign: "center",
    },
    
    placeButton: {
      height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
      borderRadius: 32,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "rgba(17, 13, 45, 0.3)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 10,
      alignSelf: "center",
      marginTop: 20,
    },

    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 20,
    },
    bottomSheetContainer: { flex: 1, padding: 10, alignItems: "center" },
    betsScrollContainer: {
      alignItems: "center",
      justifyContent: "flex-start",
      paddingBottom: 120,
    },
    planetBackground: { position: "absolute", opacity: 0.6, zIndex: 0 },
    container: {
      flex: 1,
      backgroundColor: "#1B003B",
      alignItems: "center",
      alignSelf: "center",
      maxWidth: fixedWidth,
    },
    graphOverlay: {
      position: "absolute",
      top: screenHeight * 0.20, // 🔹 граф теперь ниже топ-бара
      left: 0,
      width: "100%",
      height: screenHeight * 0.35,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
      pointerEvents: "none",
    },
    
    
    
    topSection: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      // 🔹 адаптация под экран
      height: isDesktop
        ? screenHeight * 0.45
        : screenHeight < 700
        ? screenHeight * 0.3
        : screenHeight * 0.4,
    },
    
    centered: { alignItems: "center", justifyContent: "center", width: "100%" },
    bottomSection: {
      height: screenHeight * 0.5,
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 5,
    },
    countdownText: { fontSize: 150, fontWeight: "900", textAlign: "center" },
    betButton: {
      height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
      borderRadius: 32,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    betsContainer: {
      borderRadius: 16,
      borderColor: "rgba(255,255,255,0.15)",
      backgroundColor: "transparent",
      flex: 1,
      overflow: "hidden",
    },




    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    
      // 🔹 адаптация отступа сверху по высоте экрана
      marginTop: 100,
    
      marginBottom: screenHeight < 750 ? 0 : 0,
      paddingHorizontal:  20,
      width: "100%",
      alignSelf: "center",
      zIndex: 10,
    },
    
    
    
    // 🔸 Онлайн-капсула — как в HTML-примере
    onlineCapsule: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#52288C",
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingVertical: 4,
      justifyContent: "center",
      gap: 8,
      height: 32,
    },
    
    onlineIcon: {
      width: 16,
      height: 16,
      position: "relative",
      overflow: "hidden",
    },
    graphContainer: {
      position: "absolute",
      top: isDesktop
        ? screenHeight * 0.19 // ✅ было 0.2 → поднимаем граф выше
        : screenHeight < 700
        ? screenHeight * 0.16 // 🔹 на айфонах поднимаем сильнее
        : screenHeight * 0.12,
      left: 0,
      width: "100%",
      height: isDesktop
        ? screenHeight * 0.38 // чуть меньше — пропорционально сцене
        : screenHeight < 700
        ? screenHeight * 0.36
        : screenHeight * 0.38,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      zIndex: 4,
      pointerEvents: "none",
    },
    
    
    

    onlineOuterGlow: {
      borderRadius: 100,
      padding: 0.7,
      backgroundColor: "rgba(255,255,255,0.25)",
      shadowColor: "#ffffff",
      shadowOpacity: 0.6,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 0 },
    },
    onlineContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      height: 38, // 🔹 увеличена высота капсулы
      borderRadius: 100,
      backgroundColor: "rgba(120, 60, 200, 0.4)",
      overflow: "hidden",
      gap: 6,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#52288C",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    icon: {
      width: "100%",
      height: "100%",
    },
    plusCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#2B174B",
      justifyContent: "center",
      alignItems: "center",
    },
    onlineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#3AE85C",
    },
    onlineText: {
      color: "#76DA19",
      fontWeight: "700",
      fontSize: 18,
      marginHorizontal: 6,
      fontFamily: "SF-Pro-Bold",
    },
    
    
    onlineLineTop: {
      position: "absolute",
      width: 5.33,
      height: 5.33,
      left: 5.33,
      top: 1.33,
      backgroundColor: "#76DA19",
    },
    
    onlineLineBottom: {
      position: "absolute",
      width: 10.67,
      height: 6,
      left: 2.67,
      top: 8.67,
      backgroundColor: "#76DA19",
    },
    

    orangePng: {
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0,
      resizeMode: "contain",
    },
    
    userIcon: {
      width: 18,
      height: 18,
      marginRight: 6,
    },
    
    giftStepsWrapper: {
      width: "100%",
      position: "relative",
      alignItems: "center",
      marginTop: 30,
      paddingHorizontal: 10,
    },
    verticalLine: {
      position: "absolute",
      left: 37,
      top: 22,
      width: 10,
      height: "60%",
      borderRadius: 2,
      zIndex: 0,
    },
    giftStepsContainer: {
      width: "100%",
      paddingHorizontal: 10,
      marginTop: 20,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 32,
    },
    stepCircle: {
      width: 44,
      height: 44,
      borderRadius: 30,
      backgroundColor: "#240058",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    stepCirclePurple: { backgroundColor: "#6B3FD8" },
    stepNumber: {
      color: "white",
      fontSize: 18,
      fontFamily: "SF-Pro-Heavy",
      fontWeight: "800",
    },
    stepGiftIcon: { width: 22, height: 22, tintColor: "white" },
    stepAlert: { color: "#FF005C", fontSize: 22, fontWeight: "900" },
    stepText: {
      color: "#C4BED4",
      fontSize: 18,
      fontFamily: "SF-Pro-Medium",
      lineHeight: 22,
      flexShrink: 1,
    },
    stepHighlight: {
      color: "#A07BFF",
      fontSize: 18,
      fontFamily: "SF-Pro-Medium",
    },
    

    
  });

export default Crash;
