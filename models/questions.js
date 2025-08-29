const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// MongoDB schema (agar sizda model bo'lmasa)
const questionSchema = new mongoose.Schema({
    stage1: {
        description: String,
        questionCount: Number,
        timeLimitPerQuestion: Number,
        questions: [{
            id: String,
            text: String,
            options: [String],
            correctAnswer: String,
            difficulty: String,
            points: Number
        }]
    },
    stage2: {
        description: String,
        questionCount: Number,
        timeLimitPerQuestion: Number,
        questions: [{
            id: String,
            text: String,
            options: [String],
            correctAnswer: String,
            difficulty: String,
            points: Number
        }]
    },
    stage3: {
        description: String,
        questionCount: Number,
        timeLimitPerQuestion: Number,
        questions: [{
            id: String,
            text: String,
            options: [String],
            correctAnswer: String,
            difficulty: String,
            points: Number
        }]
    }
});

const Question = mongoose.model('Question', questionSchema);

// Savollarni bosqich bo‘yicha olish
router.get('/questions/:stage', async (req, res) => {
    try {
        const { stage } = req.params;

        // Bosqichni tekshirish
        const validStages = ['stage1', 'stage2', 'stage3'];
        if (!validStages.includes(stage)) {
            return res.status(400).json({ success: false, message: 'Noto‘g‘ri bosqich nomi' });
        }

        // Savollarni olish
        const data = await Question.findOne({ "_id": "68a9773fa292516c2e144c8b" });
        if (!data) {
            return res.status(404).json({
                success: false, message: 'Ma\'lumotlar topilmadi'
            });
        }

        // Berilgan bosqichdagi savollarni olish
        const questions = data[stage].questions;
        const questionCount = data[stage].questionCount;

        // Agar tasodifiy tanlash kerak bo‘lsa (masalan, questionCount dan kamroq savol yuborish uchun)
        // Bu qismni faqat kerak bo‘lsa ishlatasiz
        const shuffledQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, questionCount);

        res.json({
            success: true,
            stage: stage,
            description: data[stage].description,
            questionCount: questionCount,
            timeLimitPerQuestion: data[stage].timeLimitPerQuestion,
            questions: shuffledQuestions
        });
    } catch (error) {
        console.error('Savol olishda xatolik:', error);
        res.status(500).json({ success: false, message: 'Savol olishda xatolik' });
    }
});

module.exports = router;