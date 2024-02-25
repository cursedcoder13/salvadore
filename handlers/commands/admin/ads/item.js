const { Markup } = require("telegraf");

const { items, services } = require("../../../../database/index")

module.exports = async (ctx, page = 1) => {
  try {
    const item = await items.findOne({
        where: {
            id: ctx.match[1]
        }
    })
      
    const serivce = await services.findOne({
        where: {
            code: item.serviceCode
        }
    })


    return ctx
      .editMessageText(
        `<b>🗂️ Текущий раздел:</b>
╰ 🧾 Панель администратора -> Объявления -> Список объявлений -> #${item.id}

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>

╭ ▫️ <b>Сервис:</b> ${serivce.title}
├ ▫️ <b>Название:</b> ${item.title}
╰ ▫️ <b>Стоимость:</b> ${item.currency} ${item.price}`,
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: Markup.inlineKeyboard([
            [Markup.urlButton("🌐 Перейти", `https://${serivce.domain}/pay/order/${item.id}`)],
            [
              Markup.callbackButton("💶 Цена", `admin_changePrice_${item.id}`),
              Markup.callbackButton("♻️ Удалить", `admin_destroyAd_${item.id}`),
            ],
            [Markup.callbackButton("< Назад", "admin_items_list")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
};