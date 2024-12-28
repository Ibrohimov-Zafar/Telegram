const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TELEGRAM_TOKEN = '7550488165:AAFbGgECgQ8sY6d0keNBeIMoxbqm7gXss-c';
const REMOVE_BG_API_KEY = 'f3wsmXDf3mBhabgk3tSrAYxd';

const bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: true });

// Express serverni ishga tushirish
const app = express();
app.use(express.json());

// Webhook endpoint
const PORT = process.env.PORT || 3000;
const URL = 'YOUR_VERCEL_DEPLOYED_URL'; // Vercelga joylashtirilgandan keyin URLni kiriting

bot.setWebHook(`${URL}/bot${TELEGRAM_TOKEN}`);

app.post(`/bot${TELEGRAM_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body); // Telegramdan kelgan xabarni qayta ishlash
    res.sendStatus(200);
});

// Webhook uchun xabarlarni qayta ishlash
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;

        try {
            const file = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

            const response = await axios.post('https://api.remove.bg/v1.0/removebg', {
                image_url: fileUrl,
                size: 'auto',
            }, {
                headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
                responseType: 'arraybuffer',
            });

            const outputPath = `/tmp/${fileId}-no-bg.png`;
            require('fs').writeFileSync(outputPath, response.data);

            await bot.sendPhoto(chatId, outputPath);
            require('fs').unlinkSync(outputPath);
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "Xatolik yuz berdi.");
        }
    } else {
        bot.sendMessage(chatId, "Iltimos, rasm yuboring!");
    }
});

// Express serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ${PORT} portda ishga tushdi`);
});
