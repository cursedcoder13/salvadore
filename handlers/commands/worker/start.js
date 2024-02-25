const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  try {
    if (ctx.state.req == true || ctx.state.user.status == 0) {
      return ctx.replyWithHTML(
        `💁🏻‍♂️ <b>Привет,</b> ${ctx.from.first_name}<b>!</b>
🦋 <b>Перед тем, как продолжить использование бота тебе надо подать заявку!</b>`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("🔹 Подать заявку! 🔹", "sendRequest")],
          ]),
        }
      );
    }

    await ctx.deleteMessage().catch((err) => err);

    return ctx
      .replyWithHTML(
        `🗂️ <b>Текущий раздел:</b>
╰ 🔆 Главное меню

╭ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Hidden ID:</b> <code>#${ctx.state.user.tag}</code>`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("🌏 Страны", "createLink")],
            [
              Markup.callbackButton("👩‍🏫 Наставники", "mentors"),
              Markup.callbackButton("💁🏼‍♂️ Мой профиль", "profile"),
            ],
            [Markup.callbackButton("✍️ Сообщить о проблеме", "report")],
            ...(ctx.state.user.admin == true
              ? [[Markup.callbackButton(`💻 Админ-панель`, `admin`)]]
              : []),
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
};