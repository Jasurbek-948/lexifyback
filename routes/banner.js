const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Rasm yuklash uchun sozlama
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/banners/';
        // Agar papka mavjud bo'lmasa, yaratish
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Fayl nomini unique qilish
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Fayl filter - faqat rasm fayllarini qabul qilish
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllarini yuklash mumkin!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Barcha bannerlarni olish
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .select('imageUrl title description url order isActive');

        res.json({
            success: true,
            banners
        });
    } catch (error) {
        console.error('Bannerlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Bannerlarni yuklashda xatolik'
        });
    }
});

// Yangi banner qo'shish (Admin uchun)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, description, url, order } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Rasm fayli kiritilmagan'
            });
        }

        const banner = new Banner({
            imageUrl: '/uploads/banners/' + req.file.filename,
            title: title || '',
            description: description || '',
            url: url || '',
            order: order || 0,
            isActive: true
        });

        await banner.save();

        res.json({
            success: true,
            message: 'Banner muvaffaqiyatli qo\'shildi',
            banner
        });
    } catch (error) {
        console.error('Banner qo\'shishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Banner qo\'shishda xatolik'
        });
    }
});

// Bannerni yangilash (Admin uchun)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, description, url, order, isActive } = req.body;
        const updateData = { title, description, url, order, isActive };

        // Agar yangi rasm yuklangan bo'lsa
        if (req.file) {
            // Eski rasmni o'chirish
            const oldBanner = await Banner.findById(req.params.id);
            if (oldBanner && oldBanner.imageUrl) {
                const oldImagePath = path.join(__dirname, '..', oldBanner.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = '/uploads/banners/' + req.file.filename;
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Banner muvaffaqiyatli yangilandi',
            banner
        });
    } catch (error) {
        console.error('Banner yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Banner yangilashda xatolik'
        });
    }
});

// Bannerni o'chirish (Admin uchun)
router.delete('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner topilmadi'
            });
        }

        // Rasm faylini o'chirish
        if (banner.imageUrl) {
            const imagePath = path.join(__dirname, '..', banner.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Banner.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Banner muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Banner o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Banner o\'chirishda xatolik'
        });
    }
});

// Barcha bannerlarni olish (Admin paneli uchun)
router.get('/admin/all', async (req, res) => {
    try {
        const banners = await Banner.find()
            .sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            banners
        });
    } catch (error) {
        console.error('Bannerlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Bannerlarni yuklashda xatolik'
        });
    }
});

module.exports = router;