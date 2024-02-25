const { Markup } = require("telegraf");
const chunk = require("chunk");

const { Profits } = require("../../../../database/index");

module.exports = async (ctx) => {
  try {
    const profits = await Profits.findAll({
      where: {
        status: ctx.match[1] == "pay" ? true : false,
      },
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    var kassa = await Profits.sum("eurAmount"),
      kassaNotPay = await Profits.sum("eurAmount", {
        where: {
          status: false,
        },
      }),
      kassaPay = await Profits.sum("eurAmount", {
        where: {
          status: true,
        },
      });

    var profitsCount = await Profits.count(),
      notPay = await Profits.count({
        where: {
          status: false,
        },
      }),
      pay = await Profits.count({
        where: {
          status: true,
        },
      });

    const count = await Profits.count({
      where: {
        status: ctx.match[1] == "pay" ? true : false,
      },
    });

    var buttons = chunk(
      profits.map((v, i) =>
        Markup.callbackButton(
          `${ctx.match[1] == "pay" ? "💰" : "🕓"} ${
            i + 1
          }. € ${v.eurAmount.toFixed(2)} | #${v.workerTag}`,
          `admin_profit_${v.id}`
        )
      )
    );

    if (count == 0)
      return ctx
        .answerCbQuery("🤖 На следующей странице ничего нет", true)
        .catch((err) => err);

    return ctx
      .editMessageText(
        `<b>🗂️ Текущий раздел:</b>
╰ ${ctx.match[1] == "pay" ? "💰" : "🕓"} Панель администратора -> Профиты -> ${
          ctx.match[1] == "pay"
            ? "Выплаченные профиты"
            : "Не выплаченные профиты"
        }

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>

╭ 🏦 <b>Касса:</b> <b>${profitsCount}</b> профитов на сумму <b>€ ${
          kassa == null ? "0.00" : kassa.toFixed(2)
        }</b>
├ 💰 <b>Выплачено:</b> <b>${pay}</b> профитов на сумму <b>€ ${
          kassaPay == null ? "0.00" : kassaPay.toFixed(2)
        }</b>
╰ 🕓 <b>Не выплачено:</b> <b>${notPay}</b> профитов на сумму <b>€ ${
          kassaNotPay == null ? "0.00" : kassaNotPay.toFixed(2)
        }</b>`,
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: Markup.inlineKeyboard([
            ...buttons,
            [Markup.callbackButton("< Назад", "admin_profits")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
};