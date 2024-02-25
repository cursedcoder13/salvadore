const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  try {
    return ctx
      .editMessageText(
        `🗂️ <b>Текущий раздел:</b>
╰ 🌐 Профиль -> Настройки -> Доступ к сайту

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>

├ ▫️ <b>Статус сайтов:</b> ${ctx.state.user.siteStatus == true ? "🟢 Ваши сайты работают." : "🔴 Ваши сайты выключены."}

ℹ️ <b>Концепция этой функции довольно проста, по этим кнопкам вы можете включить или выключить доступ к сайту вашим 🐘 Мохнатым, если мамонт перейдёт на ссылку а вы выключили сайты то мохнатого отправит на страницу где написано что в данный момент ведутся технические работы.</b>`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton(`${ctx.state.user.siteStatus == true ? "✍️ Выключить сайты" : "✍️ Включить сайты"}`, `siteStatus_${ctx.state.user.siteStatus == true ? "off" : "on"}`)],
            [Markup.callbackButton("< Назад", "settings")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  } 
};