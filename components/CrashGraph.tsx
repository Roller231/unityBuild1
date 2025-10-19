import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { CrashEngine } from "../components/CrashEngine";
import Canvas from "react-native-canvas";
import LottieView from "lottie-react-native";
import lottieWeb from "lottie-web";
import catFly from "../components/icons/catFly.json";

interface CrashGraphProps {
  engine: CrashEngine | null;
  active?: boolean;
  onMultiplierChange?: (multiplier: number) => void;
}

export default function CrashGraph({
  engine,
  active = true,
  onMultiplierChange,
}: CrashGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lottieRef = useRef<LottieView>(null);
  const webLottieContainer = useRef<HTMLDivElement | null>(null);
  const lastUpdate = useRef(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const graphWidth = screenWidth * 0.95;
  const graphHeight =
    Platform.OS === "web" ? screenHeight * 0.45 : screenHeight * 0.5;

  const webCanvasStyle: React.CSSProperties = {
    borderRadius: 12,
    backgroundColor: "transparent",
  };

  // === Основная отрисовка ===
  const renderFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offsetY: number
  ) => {
    if (!engine) return;
    engine.onResize(width, height);
    engine.tick();

    // ⚡ обновление множителя — не чаще 120мс и не ниже x1.01
    const now = Date.now();
    const multiplier = engine.multiplier;
    if (
      onMultiplierChange &&
      now - lastUpdate.current > 120 &&
      multiplier > 1.01 &&
      isFinite(multiplier)
    ) {
      lastUpdate.current = now;
      onMultiplierChange(multiplier);
    }

    ctx.clearRect(0, 0, width, height);
    const startY = engine.plotHeight;
    const mid = engine.getElapsedPosition(engine.elapsedTime * 0.5);
    const end = engine.getElapsedPosition(engine.elapsedTime);

    ctx.beginPath();
    ctx.strokeStyle = "#A57BFF";
    ctx.lineWidth = 3;
    ctx.moveTo(0, startY);
    ctx.quadraticCurveTo(mid.x, mid.y + offsetY, end.x, end.y);
    ctx.stroke();

    const text = `x${multiplier.toFixed(2)}`;
    const fontSize = 64;
    ctx.font = `1000 ${fontSize}px "SF Pro", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const gradient = ctx.createLinearGradient(
      0,
      height / 2 - fontSize,
      0,
      height / 2 + fontSize
    );
    gradient.addColorStop(0, "#FFAF4D");
    gradient.addColorStop(0.35, "#FFF7A7");
    gradient.addColorStop(0.75, "#FFAF4D");

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#070908";
    const textY = height / 2 - 60;
    ctx.strokeText(text, width / 2, textY);
    ctx.fillStyle = gradient;
    ctx.fillText(text, width / 2, textY);
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
        renderFrame(ctx, graphWidth, graphHeight, 25);
      }
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [engine, active]);

  // === Canvas (Mobile) ===
  const handleCanvas = (canvas: any) => {
    if (!canvas || Platform.OS === "web" || !active) return;
    const ctx = canvas.getContext("2d");
    let frameId: number;

    const draw = () => {
      renderFrame(ctx, graphWidth, graphHeight, 15);
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  };

  // === Lottie кот ===
  useEffect(() => {
    if (Platform.OS === "web") {
      const container = webLottieContainer.current;
      if (!container) return;

      const anim = lottieWeb.loadAnimation({
        container,
        renderer: "svg",
        loop: true,
        autoplay: active,
        animationData: catFly,
      });

      anim.setSpeed(0.8);
      if (!active) anim.pause();
      return () => anim.destroy();
    } else if (lottieRef.current) {
      active ? lottieRef.current.play() : lottieRef.current.pause();
    }
  }, [active]);

  return (
    <View style={styles.container}>
      {active &&
        (Platform.OS === "web" ? (
          <div ref={webLottieContainer} style={styles.catLottieWeb as any} />
        ) : (
          <LottieView
            ref={lottieRef}
            source={catFly}
            autoPlay
            loop
            speed={0.8}
            style={styles.catLottieMobile}
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  canvas: {
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  catLottieWeb: {
    position: "absolute",
    top: "44%",
    left: "42%",
    transform: "translate(-100px, 0)",
    width: 280,
    height: 280,
    opacity: 0.9,
    zIndex: 10,
    pointerEvents: "none",
  },
  catLottieMobile: {
    position: "absolute",
    top: "47%",
    left: "50%",
    transform: [{ translateX: -100 }],
    width: 200,
    height: 200,
    opacity: 0.9,
    zIndex: 10,
  },
});
