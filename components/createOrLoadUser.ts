import { getUserByTgId, createUser } from "../app/api";

export async function initTelegramUser() {
  try {
    const tg = window.Telegram.WebApp;
    const user = tg?.initDataUnsafe?.user;

    if (!user) throw new Error("Telegram user not found");

    const tg_id = String(user.id);
    const username = user.username ?? "unknown";
    const firstname = user.first_name ?? "User";

    // Проверяем пользователя на бэке
    let existing = await getUserByTgId(tg_id);

    if (existing) {
      console.log("Пользователь найден в базе:", existing);
      return existing;
    }

    // Если нет — создаём
    const created = await createUser({
      tg_id,
      username,
      firstname,
      balance: 0,
      refcount: 0,
      inventory: "[]",
    });

    console.log("Создан новый пользователь:", created);
    return created;

  } catch (err) {
    console.warn("API недоступно, создаём локальные данные");

    return {
      tg_id: "0",
      username: "offline",
      firstname: "Guest",
      balance: 0,
      refcount: 0,
      inventory: "[]",
      offline: true,
    };
  }
}
