const token = "8629924462:AAE5SXF0HdxrJy_CjOtq7PvM7nTO7DtAAHU";
const chatId = "6371272028";

const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    parse_mode: "HTML",
    text: `🤖 <b>Smart Bizon AI — подключён!</b>\n\n✅ Бот успешно настроен\n💬 Уведомления о горячих лидах и покупках будут приходить сюда\n\n<i>Запусти анализ вебинара чтобы проверить</i>`,
  }),
});

const data = await res.json();
if (data.ok) {
  console.log("✅ Сообщение отправлено в Telegram!");
} else {
  console.log("❌ Ошибка:", data.description);
}
