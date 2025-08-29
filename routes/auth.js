const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Foydalanuvchi ro'yxatdan o'tkazish
router.post('/register', async (req, res) => {
    const { telegramId, firstName, lastName, username, photoUrl } = req.body;

    try {
        // Foydalanuvchi allaqachon mavjudligini tekshirish
        let user = await User.findOne({ telegramId });

        if (user) {
            return res.status(400).json({ success: false, message: 'Foydalanuvchi allaqachon ro\'yxatdan o\'tgan' });
        }

        // Yangi foydalanuvchi yaratish
        user = new User({
            telegramId,
            firstName,
            lastName,
            username,
            photoUrl,
            almaz: 0, // Boshlang'ich qiymat
            fire: 0,  // Boshlang'ich qiymat
            level: 1, // Boshlang'ich qiymat
        });

        await user.save();
        res.status(201).json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi: ' + error.message });
    }
});

// Foydalanuvchi ma'lumotlarini olish
router.get('/user/:telegramId', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi: ' + error.message });
    }
});

// Foydalanuvchi ballarini yangilash (almaz, fire, level)
router.put('/user/:telegramId/update-scores', async (req, res) => {
    const { almaz, fire, level } = req.body;

    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }

        // Faqat o'zgaruvchan maydonlarni yangilash
        if (almaz !== undefined) user.almaz = almaz;
        if (fire !== undefined) user.fire = fire;
        if (level !== undefined) user.level = level;

        await user.save();
        res.status(200).json({ success: true, message: 'Ballar muvaffaqiyatli yangilandi', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi: ' + error.message });
    }
});

module.exports = router;