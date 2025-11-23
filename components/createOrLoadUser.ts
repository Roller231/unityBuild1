import { getUserByTgId, createUser } from "../utils/api";
import { isTMA, useLaunchParams } from "@telegram-apps/sdk-react";

export async function initTelegramUser() {
  try {
    // Проверяем, что мы в Telegram Mini App
    const isMiniApp = await isTMA();
    if (!isMiniApp) throw new Error("Not in Telegram Mini App");

    // --- Безопасный вызов useLaunchParams(), как у тебя в Profile ---
    const lp = (() => {
      try {
        return useLaunchParams();
      } catch (e) {
        console.warn("⚠ useLaunchParams(): not available outside Telegram", e);
        return null;
      }
    })();

    const tgUser = lp?.tgWebAppData?.user;

    if (!tgUser) throw new Error("LaunchParams: user not found");

    // --- Данные Telegram ---
    const tg_id = String(tgUser.id);
    const username = tgUser.username ?? "unknown";
    const firstname = tgUser.first_name ?? "User";

    // --- Проверяем пользователя в БД ---
    let existing = await getUserByTgId(tg_id);

    if (existing) {
      console.log("Пользователь найден:", existing);
      return existing;
    }

    // --- Создаём, если нет ---
    const created = await createUser({
      tg_id,
      username,
      firstname,
      balance: 0,
      refcount: 0,
      inventory: [], // МАССИВ — правильно!
    });

    console.log("Создан новый пользователь:", created);
    return created;

  } catch (err) {
    console.warn("⚠ Offline mode:", err);

    // --- Fallback профиля в DEV, на локалхосте, в браузере ---
    return {
      tg_id: "0",
      username: "offline",
      firstname: "Guest",
      balance: 0,
      refcount: 0,
      inventory: [],
      offline: true,
    };
  }
}
