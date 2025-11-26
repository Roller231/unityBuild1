import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { CrashEngine } from "../components/CrashEngine";
import Canvas from "react-native-canvas";
import LottieView from "lottie-react-native";
import lottieWeb from "lottie-web";
import catFly from "../components/icons/catFly.json";

interface CrashGraphProps {
  multiplier: number;
  phase: "idle" | "countdown" | "flight" | "crash";
  active?: boolean;
}


export default function CrashGraph({
  multiplier,
  phase,
  active = true,
}: CrashGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lottieRef = useRef<LottieView>(null);
  const webLottieContainer = useRef<HTMLDivElement | null>(null);
  const lastUpdate = useRef(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // ⚙️ Адаптивные размеры в зависимости от экрана
  const isSmall = screenHeight < 700 || screenWidth < 380;
  const isLarge = screenWidth > 1000;

  const graphWidth = isLarge
    ? 600
    : isSmall
    ? screenWidth * 0.9
    : screenWidth * 0.95;

    const graphHeight = isLarge
    ? 350
    : isSmall
    ? screenHeight * 0.42 // ✅ было 0.32 → теперь выше
    : screenHeight * 0.48;
  

  // 🐱 Размер кота
  const baseCatSize = isLarge
    ? 420
    : isSmall
    ? screenWidth * 0.65
    : screenWidth * 0.45;
  const catSize = Math.min(baseCatSize * 1.5, 480);

  const webCanvasStyle: React.CSSProperties = {
    borderRadius: 12,
    backgroundColor: "transparent",
  };

  // === Основная отрисовка ===
  const renderFrame = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    ctx.clearRect(0, 0, w, h);
  
    const maxM = 10; // что считаем правым краем
    const progress = Math.min(multiplier / maxM, 1);
  
    // Вогнутая экспонента / логарифм
    // y поднимается быстрее в начале и плавно замедляется
    const curveY = Math.pow(progress, 0.65); // 0.65 — идеальный crash-сплайн
  
    const startY = h * 0.75;            // нижняя часть
    const endX = w * progress;          // ВСЕГДА доходит до правого края
    const endY = startY - curveY * (h * 0.55);
  
    // линия
    ctx.beginPath();
    ctx.strokeStyle = "#A57BFF";
    ctx.lineWidth = 4;
    ctx.moveTo(0, startY);
  
    // Точка изгиба: половина X, логическая Y
    const ctrlX = endX * 0.45;
    const ctrlY = startY - curveY * (h * 0.25);
  
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  
    // === ТЕКСТ МНОЖИТЕЛЯ ===
    const text = `x${multiplier.toFixed(2)}`;
    const fontSize = isLarge ? 72 : isSmall ? 44 : 58;
  
    ctx.font = `1000 ${fontSize}px "SF Pro", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  
    const gradient = ctx.createLinearGradient(
      0,
      h / 2 - fontSize,
      0,
      h / 2 + fontSize
    );
    gradient.addColorStop(0, "#FFAF4D");
    gradient.addColorStop(0.35, "#FFF7A7");
    gradient.addColorStop(0.75, "#FFAF4D");
  
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#070908";
  
    const textY = h / 2 - (isLarge ? 137 : isSmall ? 57 : 77);
  
    ctx.strokeText(text, w / 2, textY);
    ctx.fillStyle = gradient;
    ctx.fillText(text, w / 2, textY);
  };
  
  

  // === Canvas (Web) ===
  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = graphWidth * scale;
    canvas.height = graphHeight * scale;
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    let frameId: number;
    let lastDraw = 0;
    const fpsLimit = 30;
    const frameInterval = 1000 / fpsLimit;

    const draw = (time: number) => {
      if (time - lastDraw > frameInterval) {
        lastDraw = time;
        renderFrame(ctx, graphWidth, graphHeight);
      }
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [multiplier, active, graphWidth, graphHeight]);

  // === Canvas (Mobile) ===
  const handleCanvas = (canvas: any) => {
    if (!canvas || Platform.OS === "web" || !active) return;
    const ctx = canvas.getContext("2d");
    let frameId: number;

    const draw = () => {
      renderFrame(ctx, graphWidth, graphHeight);
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  };

  // === Lottie кот ===
  useEffect(() => {
    let anim: any;
    if (Platform.OS === "web") {
      const container = webLottieContainer.current;
      if (!container) return;

      anim = lottieWeb.loadAnimation({
        container,
        renderer: "svg",
        loop: true,
        autoplay: active,
        animationData: catFly,
      });

      anim.setSpeed(0.8);
      if (!active) anim.pause();
    } else if (lottieRef.current) {
      active ? lottieRef.current.play() : lottieRef.current.pause();
    }

    return () => {
      if (anim) anim.destroy();
    };
  }, [active]);

  return (
    <View style={styles.container}>
     {active &&
  (Platform.OS === "web" ? (
    <div
      ref={webLottieContainer}
      style={{
        ...styles.catLottieWeb,
        width: catSize ,     // ⬅️ уменьшили
        height: catSize ,    // ⬅️ уменьшили
        left: "50%",
        top: isLarge ? "63%" : isSmall ? "75%" : "70%",   // ⬅️ опустили ниже
        transform: "translate(-50%, -50%)",
      }}
    />

  ) : (
    <LottieView
      ref={lottieRef}
      source={catFly}
      autoPlay
      loop
      speed={0.8}
      style={[
        styles.catLottieMobile,
        {
          width: catSize,
          height: catSize,
          transform: [{ translateX: -catSize / 2 }],
          top: isLarge ? "52%" : isSmall ? "60%" : "58%",
        },
      ]}
    />
  ))}


      {Platform.OS === "web" ? (
        <canvas
          ref={canvasRef}
          width={graphWidth}
          height={graphHeight}
          style={{
            ...webCanvasStyle,
            width: graphWidth,
            height: graphHeight,
          }}
        />
      ) : (
        <Canvas
          {...({ onCanvasReady: handleCanvas } as any)}
          style={[styles.canvas, { width: graphWidth, height: graphHeight }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    overflow: "visible",
    position: "relative",
  },
  canvas: {
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  catLottieWeb: {
    position: "absolute",
    opacity: 0.9,
    zIndex: 10,
    pointerEvents: "none",
  },
  catLottieMobile: {
    position: "absolute",
    left: "50%",
    opacity: 0.9,
    zIndex: 10,
  },
});