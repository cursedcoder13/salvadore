const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  try {
    return ctx
      .editMessageText(
        `🗂️ <b>Текущий раздел:</b>
╰ ⚙️ Профиль -> Настройки

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>

├ ▫️ <b>Тип ТП:</b> ${ctx.state.user.supportType == "bot" ? "Через бота" : "Smartsupp"}`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.callbackButton("#️⃣ TAG", "changeTag"),
              Markup.callbackButton("📶 ТП", "typeSupport")
            ],
            [Markup.callbackButton("🌐 Доступ к сайту", "siteStatus")],
            [Markup.callbackButton("< Назад", "profile")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  } 
};