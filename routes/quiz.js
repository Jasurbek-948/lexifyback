// routes/quiz.js
const express = require('express');
const router = express.Router();
const QuizParticipant = require('../models/QuizParicipant');
const axios = require('axios');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8376648015:AAHTun9NkRJIn-zWtz9IKoAlpaq4V_05fMI';

const CHANNELS = {
    LEXIFY_DICTIONARY: '-1002911738519',
    LEXIFY_LESSONS: '-1002868128394'
};

// Viktorinaga qatnashish
router.post('/register', async (req, res) => {
    try {
        const { telegramId, firstName, lastName, username } = req.body;

        // Foydalanuvchi allaqachon ro'yxatdan o'tganligini tekshirish
        const existingParticipant = await QuizParticipant.findOne({ telegramId });

        if (existingParticipant) {
            return res.json({
                success: false,
                message: 'Siz allaqachon viktorinaga qatnashgansiz'
            });
        }

        // Yangi qatnashchi yaratish
        const newParticipant = new QuizParticipant({
            telegramId,
            firstName,
            lastName,
            username
        });

        await newParticipant.save();

        res.json({
            success: true,
            message: 'Viktorinaga muvaffaqiyatli qatnashdingiz'
        });
    } catch (error) {
        console.error('Viktorinaga qatnashish xatosi:', error);

        if (error.code === 11000) {
            return res.json({
                success: false,
                message: 'Siz allaqachon viktorinaga qatnashgansiz'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urunib ko\'ring'
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const participantsCount = await QuizParticipant.countDocuments();
        res.json({
            success: true,
            participantsCount
        });
    } catch (error) {
        console.error('Statistika olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Statistika olishda xatolik'
        });
    }
});

// Foydalanuvchi ro'yxatdan o'tganligini tekshirish
router.get('/check/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        const participant = await QuizParticipant.findOne({ telegramId: parseInt(telegramId) });

        res.json({
            success: true,
            registered: !!participant
        });
    } catch (error) {
        console.error('Ro\'yxatni tekshirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Ro\'yxatni tekshirishda xatolik'
        });
    }
});

const checkTelegramSubscription = async (telegramId, username) => {
    try {
        // Foydalanuvchi ma'lumotlarini olish
        const userResponse = await axios.get(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`,
            {
                params: {
                    chat_id: CHANNELS.LEXIFY_DICTIONARY,
                    user_id: telegramId
                }
            }
        );

        const dictionaryStatus = userResponse.data.result.status;

        const userResponse2 = await axios.get(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember`,
            {
                params: {
                    chat_id: CHANNELS.LEXIFY_LESSONS,
                    user_id: telegramId
                }
            }
        );

        const lessonsStatus = userResponse2.data.result.status;

        // "member", "administrator", yoki "creator" bo'lsa a'zo hisoblanadi
        const isSubscribedToDictionary = ['member', 'administrator', 'creator'].includes(dictionaryStatus);
        const isSubscribedToLessons = ['member', 'administrator', 'creator'].includes(lessonsStatus);

        return {
            lexifydictionary: isSubscribedToDictionary,
            lexifylessons: isSubscribedToLessons
        };
    } catch (error) {
        console.error('Telegram a\'zolik tekshirish xatosi:', error.response?.data || error.message);

        // Agar kanalga kirish huquqi bo'lmasa yoki boshqa xatolik bo'lsa, mock ma'lumot qaytaramiz
        return {
            lexifydictionary: false,
            lexifylessons: false
        };
    }
};

router.post('/check-subscription', async (req, res) => {
    try {
        const { telegramId, username } = req.body;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                message: 'Telegram ID kiritilmagan'
            });
        }

        const subscribed = await checkTelegramSubscription(telegramId, username);

        res.json({
            success: true,
            subscribed
        });
    } catch (error) {
        console.error('A\'zolikni tekshirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'A\'zolikni tekshirishda xatolik'
        });
    }
});
router.get('/ratings', async (req, res) => {
    try {
        const participants = await QuizParticipant.find()
            .sort({ score: -1, completedAt: 1 })
            .limit(100);

        // O'rinlarni hisoblash
        const participantsWithPosition = participants.map((participant, index) => ({
            ...participant.toObject(),
            position: index + 1
        }));

        res.json({
            success: true,
            participants: participantsWithPosition
        });
    } catch (error) {
        console.error('Reytinglarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Reytinglarni olishda xatolik'
        });
    }
});

// Joriy foydalanuvchi ma'lumotlarini olish
router.get('/current-user/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;

        const participant = await QuizParticipant.findOne({ telegramId: parseInt(telegramId) });

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        // Umumiy reytingda o'rinni aniqlash
        const allParticipants = await QuizParticipant.find().sort({ score: -1, completedAt: 1 });
        const position = allParticipants.findIndex(p => p.telegramId === parseInt(telegramId)) + 1;

        res.json({
            success: true,
            user: {
                ...participant.toObject(),
                position
            }
        });
    } catch (error) {
        console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Foydalanuvchi ma\'lumotlarini olishda xatolik'
        });
    }
});

module.exports = router;