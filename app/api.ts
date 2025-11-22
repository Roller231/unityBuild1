const API_URL = "https://ggcat.org";

// --- базовые методы ---
export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return await res.json();
}

export async function apiPost(path: string, data: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return await res.json();
}

export async function apiPatch(path: string, data: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return await res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return true;
}

// --- расширенные функции ---
// Получить пользователя по Telegram ID
export async function getUserByTgId(tgId: string) {
  try {
    return await apiGet(`/users/tg/${tgId}`);
  } catch {
    return null;
  }
}

// Создать нового пользователя
export async function createUser(data: any) {
  return await apiPost("/users/", data);
}

// Обновить одно поле
export async function updateUserField(userId: number, field: string, value: any) {
  return await apiPatch(`/users/${userId}`, { [field]: value });
}

// Изменить баланс (+ или -)
export async function changeUserBalance(userId: number, amount: number) {
  return await apiPatch(`/users/${userId}`, { balance: amount });
}


export async function getDropById(id: number | string) {
  console.log("📦 FETCHING DROP:", id);

  try {
    const drop = await apiGet(`/drops/${id}`);

    console.log("📦 DROP RESULT:", drop);

    return drop;
  } catch (err) {
    console.log("❌ DROP FETCH ERROR:", err);
    return null;
  }
}

export async function updateInventory(userId: number, newInventory: number[]) {
  return await apiPatch(`/users/${userId}`, { inventory: newInventory });
}
