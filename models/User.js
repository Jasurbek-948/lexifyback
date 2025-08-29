const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    username: { type: String, default: 'Foydalanuvchi' },
    photoUrl: { type: String, default: '/default-avatar.png' },
    almaz: { type: Number, default: 0 }, // Boshlang'ich qiymat sifatida 0
    fireA: { type: Number, default: 0 }, // Boshlang'ich qiymat sifatida 0
    level: { type: Number, default: 1 }, // Boshlang'ich qiymat sifatida 1
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);