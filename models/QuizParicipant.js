// models/QuizParticipant.js
const mongoose = require('mongoose');

const quizParticipantSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    username: { type: String, default: '' },
    registeredAt: { type: Date, default: Date.now },
    hasParticipated: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    completedAt: { type: Date }
});

// Har bir foydalanuvchi faqat bir marta ro'yxatdan o'tishi uchun
quizParticipantSchema.index({ telegramId: 1 }, { unique: true });

module.exports = mongoose.model('QuizParticipant', quizParticipantSchema);