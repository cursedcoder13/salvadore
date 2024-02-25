const { Markup } = require('telegraf')
const chunk = require("chunk")

const db = require("../../../../database/index")
const Countries = db.countries

module.exports = async (ctx) => {
    try {
        if(ctx.state.settings.work == false) {
            return ctx
            .answerCbQuery(
              `❌ В проекте назначен STOP WORK`
            )
        }
        const countries = await Countries.findAll({
            where: {
                work: true
            }
        })

        var buttons = chunk(
            countries.map((v) =>
                Markup.callbackButton(v.title, `country_${v.code}`)
            )
        )

        if (buttons.length < 1) {
            buttons = [[Markup.callbackButton("Стран нет :(", "none")]];
        }

        return ctx.editMessageText(`🗂️ <b>Текущий раздел:</b>
╰ 🌍 Страны

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>`, {
            parse_mode: "HTML",
            reply_markup: Markup.inlineKeyboard([
                ...buttons,
                // [Markup.callbackButton("🅿️ PayPal", "service_paypal_en")],
                [Markup.callbackButton("< Назад", "menu")]
            ])
        }).catch((err) => err);
    } catch (err) {
        console.log(err)
    }
}