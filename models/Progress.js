const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true },
    gameId: { type: Number, required: true },
    attempt: { type: Number, required: true, min: 1, max: 3 },
    correctAnswers: [{ type: Number }], // Indices of correctly answered questions
    incorrectAnswers: [{ type: Number }], // Indices of incorrectly answered questions
    progress: { type: Number, required: true, min: 0, max: 100 }, // Percentage
    completed: { type: Boolean, default: false }, // True if 100% achieved
    createdAt: { type: Date, default: Date.now }
});

// Ensure unique progress per user, game, and attempt
progressSchema.index({ telegramId: 1, gameId: 1, attempt: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);