const { Telegraf } = require("telegraf");
const TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(TOKEN);
const axios = require('axios');
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, child, get } = require('firebase/database');

const firebaseConfig = {
  databaseURL: "https://routedel-e99a9-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

bot.start((ctx) =>
  ctx.reply(`Привіт, це сервіс OrderFood 😋
Замовляй товари онлайн та отримуй їх у місці де є кур’єр.`)
);

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true)) // ответ на предварительный запрос по оплате

bot.on('successful_payment', async (ctx, next) => {
  let order_id = 0;
  const snapshot = await get(child(ref(database), 'orders/'));
  if(snapshot.exists()){
    const obj = snapshot.val();
    order_id = Object.keys(obj).reverse().find(a => obj[a].user_id === ctx.chat.id)
  }
  await ctx.reply(`Номер замовлення ${order_id}.
Далі просто підійдіть до кур’єра з цим номером та отримайте своє замовлення 😌`)
  .then(get(child(ref(database), `orders/${order_id}`)).then(snapshot => {
    const obj = snapshot.val();
    axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, JSON.stringify({
    'chat_id':'-1001609321370',
    'text':`Номер замовлення: <b>${order_id}</b>
Імʼя: ${obj.user_name},
Замовлення:
   ${obj.goods.map((a, i) => `${a} x${obj.quant[i]} \n   `).join('')}`,
   'parse_mode':'html'
  }), {headers: {'Content-Type':'application/json'}})}))
})

bot.launch();

exports.handler = async (event) => {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: '' };
};