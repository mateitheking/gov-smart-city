// bot/src/index.js
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}

const WEBAPP_URL = (process.env.APPS_SCRIPT_WEBAPP_URL || "").trim();
const SHARED_SECRET = (process.env.APPS_SCRIPT_SHARED_SECRET || "").trim();
const SHEET_NAME = process.env.REQUESTS_SHEET_NAME || "Requests";

const bot = new Telegraf(BOT_TOKEN);

bot.use((ctx, next) => {
  const kind =
    ctx.updateType ||
    (ctx.message?.text ? "text" : ctx.message?.location ? "location" : "other");
  console.log("UPDATE:", kind, "from chat", ctx.chat?.id);
  return next();
});

bot.catch((err) => {
  console.error("BOT ERROR:", err);
});

// Hackathon session (in-memory)
const sessions = new Map(); // chatId -> { state, data }
const localStore = new Map(); // chatId -> [requests] (fallback if no backend)

function s(chatId) {
  if (!sessions.has(chatId)) sessions.set(chatId, { state: "idle", data: {} });
  return sessions.get(chatId);
}

function reset(chatId) {
  sessions.set(chatId, { state: "idle", data: {} });
}

function menuKeyboard() {
  return Markup.keyboard([
    ["📨 Отправить новый запрос"],
    ["📋 Мои обращения"],
    ["👤 Профиль"]
  ]).resize();
}

function locationChoiceKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📍 Отправить геолокацию", "loc_geo")],
    [Markup.button.callback("⌨️ Ввести адрес вручную", "loc_addr")],
    [Markup.button.callback("↩️ Назад", "back_to_menu")]
  ]);
}

function skipPhotoKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Пропустить фото", "skip_photo")],
    [Markup.button.callback("↩️ Назад", "back_to_menu")]
  ]);
}

function confirmKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ Подтвердить", "confirm_request")],
    [Markup.button.callback("❌ Отмена", "cancel_request")]
  ]);
}

function formatConfirmCard(d) {
  const lines = [];
  lines.push("✅ Проверьте заявку перед отправкой:");
  lines.push("");
  lines.push(`📝 Описание: ${d.description || "-"}`);
  if (d.address_text) lines.push(`🏠 Адрес: ${d.address_text}`);
  if (d.lat && d.lng) lines.push(`📍 Геолокация: ${d.lat}, ${d.lng}`);
  lines.push(`📷 Фото: ${d.photo_file_id ? "есть" : "нет"}`);
  return lines.join("\n");
}

function short(s, n = 60) {
  if (!s) return "";
  const t = String(s).trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function hasLocation(d) {
  const hasGeo = Number.isFinite(d.lat) && Number.isFinite(d.lng);
  const hasAddr = typeof d.address_text === "string" && d.address_text.trim().length > 0;
  return hasGeo || hasAddr;
}

// ---------------------- Backend calls (Apps Script) ----------------------

async function createRequestViaWebApp(payload) {
  // POST WEBAPP_URL with JSON body
  const res = await axios.post(WEBAPP_URL, payload, { timeout: 20000 });
  return res.data;
}

async function getMyRequestsViaWebApp(chatId) {
  // GET WEBAPP_URL?action=getByChatId&secret=...&chat_id=...
  const res = await axios.get(WEBAPP_URL, {
    timeout: 20000,
    params: {
      action: "getByChatId",
      secret: SHARED_SECRET,
      chat_id: chatId
    }
  });
  return res.data;
}

// ---------------------- Bot Handlers ----------------------

bot.start(async (ctx) => {
  reset(ctx.chat.id);
  await ctx.reply(
    "Здравствуйте! Smart Citizen бот.\nВыберите действие:",
    menuKeyboard()
  );
});

bot.action("back_to_menu", async (ctx) => {
  await ctx.answerCbQuery();
  reset(ctx.chat.id);
  await ctx.reply("Главное меню:", menuKeyboard());
});

bot.hears("📨 Отправить новый запрос", async (ctx) => {
  const ses = s(ctx.chat.id);
  ses.state = "await_description";
  ses.data = {};
  await ctx.reply("Опишите проблему (одним сообщением):");
});

bot.hears("📋 Мои обращения", async (ctx) => {
  const chatId = ctx.chat.id;

  // If backend configured -> read from Sheets via Apps Script
  if (WEBAPP_URL && SHARED_SECRET) {
    try {
      const out = await getMyRequestsViaWebApp(chatId);
      if (!out || !out.ok) {
        return ctx.reply(`Ошибка получения заявок: ${(out && out.error) || "UNKNOWN"}`);
      }

      const items = out.items || [];
      if (items.length === 0) {
        return ctx.reply("У вас пока нет обращений.");
      }

      const lines = [];
      lines.push("📋 Ваши обращения:");
      for (const it of items.slice(0, 10)) {
        lines.push(
          `• ${it.request_id} — ${it.status}` +
          (it.category ? ` (${it.category})` : "") +
          `\n  ${short(it.description)}`
        );
        if (it.public_comment) lines.push(`  💬 ${short(it.public_comment)}`);
      }

      return ctx.reply(lines.join("\n"));
    } catch (e) {
      return ctx.reply(`Ошибка связи с Apps Script: ${e.message}`);
    }
  }

  // Fallback: local memory
  const arr = localStore.get(chatId) || [];
  if (arr.length === 0) return ctx.reply("У вас пока нет обращений (backend ещё не подключён).");

  const lines = ["📋 Ваши обращения (локально):"];
  for (const r of arr.slice(0, 10)) {
    lines.push(`• ${r.request_id} — ${r.status}\n  ${short(r.description)}`);
  }
  return ctx.reply(lines.join("\n"));
});

bot.hears("👤 Профиль", async (ctx) => {
  await ctx.reply(
    "👤 Профиль (MVP): пока не обязателен.\n" +
    "Если нужно — добавим имя/телефон и будем прикреплять к обращению.\n\n" +
    "Пока используем Telegram ID автоматически."
  );
});

bot.on("text", async (ctx) => {
  const ses = s(ctx.chat.id);
  const text = (ctx.message.text || "").trim();

  if (ses.state === "await_description") {
    if (!text) return ctx.reply("Описание не может быть пустым. Введите ещё раз:");
    ses.data.description = text;
    ses.state = "await_location_choice";
    return ctx.reply("Укажите место (выберите вариант):", locationChoiceKeyboard());
  }

  if (ses.state === "await_address") {
    if (!text) return ctx.reply("Адрес не может быть пустым. Введите ещё раз:");
    ses.data.address_text = text;
    ses.state = "await_photo";
    return ctx.reply("Загрузите фото (по желанию) или нажмите «Пропустить».", skipPhotoKeyboard());
  }

  // ignore other texts
});

bot.action("loc_geo", async (ctx) => {
  await ctx.answerCbQuery();
  const ses = s(ctx.chat.id);
  ses.state = "await_geo";
  await ctx.reply("Отправьте геолокацию (скрепка → Геопозиция).");
});

bot.action("loc_addr", async (ctx) => {
  await ctx.answerCbQuery();
  const ses = s(ctx.chat.id);
  ses.state = "await_address";
  await ctx.reply("Введите адрес (город/посёлок, улица, дом). Можно добавить ориентир:");
});

bot.on("location", async (ctx) => {
  const ses = s(ctx.chat.id);
  if (ses.state !== "await_geo") return;

  const { latitude, longitude } = ctx.message.location;
  ses.data.lat = latitude;
  ses.data.lng = longitude;

  ses.state = "await_photo";
  await ctx.reply("Загрузите фото (по желанию) или нажмите «Пропустить».", skipPhotoKeyboard());
});

bot.on("photo", async (ctx) => {
  const ses = s(ctx.chat.id);
  if (ses.state !== "await_photo") return;

  const photos = ctx.message.photo || [];
  const best = photos[photos.length - 1];
  ses.data.photo_file_id = best.file_id;

  ses.state = "await_confirm";
  await ctx.reply(formatConfirmCard(ses.data), confirmKeyboard());
});

bot.action("skip_photo", async (ctx) => {
  await ctx.answerCbQuery();
  const ses = s(ctx.chat.id);
  if (ses.state !== "await_photo") return;

  ses.state = "await_confirm";
  await ctx.reply(formatConfirmCard(ses.data), confirmKeyboard());
});

bot.action("cancel_request", async (ctx) => {
  await ctx.answerCbQuery();
  reset(ctx.chat.id);
  await ctx.reply("Заявка отменена. Главное меню:", menuKeyboard());
});

bot.action("confirm_request", async (ctx) => {
  await ctx.answerCbQuery();
  const chatId = ctx.chat.id;
  const ses = s(chatId);

  // Validate
  if (!ses.data.description || !hasLocation(ses.data)) {
    reset(chatId);
    return ctx.reply("Ошибка: нужно описание и место (адрес или геолокация). Начните заново.", menuKeyboard());
  }

  // If backend not configured -> local accept for now
  if (!WEBAPP_URL || !SHARED_SECRET) {
    const reqId = `SC-${String(Date.now()).slice(-6)}`;
    const item = {
      request_id: reqId,
      description: ses.data.description,
      status: "New",
      created_at: new Date().toISOString()
    };
    const arr = localStore.get(chatId) || [];
    arr.unshift(item);
    localStore.set(chatId, arr);

    reset(chatId);
    return ctx.reply(
      `✅ Заявка принята (локально, backend ещё не подключён).\nID: ${reqId}\nСтатус: New`,
      menuKeyboard()
    );
  }

  // Send to Apps Script
  try {
    const payload = {
      secret: SHARED_SECRET,
      chat_id: chatId,
      telegram_user_id: ctx.from.id,
      user_name: ctx.from.first_name || "",
      description: ses.data.description,
      lat: ses.data.lat,
      lng: ses.data.lng,
      address_text: ses.data.address_text,
      photo_file_id: ses.data.photo_file_id,
      sheet_name: SHEET_NAME // optional hint (Apps Script may ignore)
    };

    const out = await createRequestViaWebApp(payload);

    reset(chatId);

    if (out && out.ok) {
      return ctx.reply(
        `✅ Заявка отправлена!\nID: ${out.request_id}\nСтатус: New`,
        menuKeyboard()
      );
    }

    return ctx.reply(
      `Ошибка при отправке: ${(out && out.error) || "UNKNOWN"}`,
      menuKeyboard()
    );
  } catch (e) {
    reset(chatId);
    return ctx.reply(`Ошибка связи с Apps Script: ${e.message}`, menuKeyboard());
  }
});

// Start bot
bot.launch();
console.log("Bot started (long polling).");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));