const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');

// Save or update progress
router.post('/', async (req, res) => {
    const { telegramId, gameId, attempt, correctAnswers, incorrectAnswers, progress } = req.body;

    try {
        // Validate input
        if (!telegramId || !gameId || !attempt || progress === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (attempt < 1 || attempt > 3) {
            return res.status(400).json({ error: 'Invalid attempt number' });
        }

        // Check if user exists
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if attempt already exists
        let progressRecord = await Progress.findOne({ telegramId, gameId, attempt });
        if (progressRecord) {
            // Update existing attempt
            progressRecord.correctAnswers = correctAnswers;
            progressRecord.incorrectAnswers = incorrectAnswers;
            progressRecord.progress = progress;
            progressRecord.completed = progress === 100;
            await progressRecord.save();
        } else {
            // Check if user has exceeded attempts
            const attempts = await Progress.countDocuments({ telegramId, gameId });
            if (attempts >= 3) {
                return res.status(400).json({ error: 'Maximum attempts reached' });
            }
            // Create new progress record
            progressRecord = new Progress({
                telegramId,
                gameId,
                attempt,
                correctAnswers,
                incorrectAnswers,
                progress,
                completed: progress === 100
            });
            await progressRecord.save();
        }

        // Award 20 diamonds if 100% progress is achieved
        if (progress === 100) {
            await User.updateOne({ telegramId }, { $inc: { almaz: 20 } });
        }

        res.status(200).json({ message: 'Progress saved', progress: progressRecord });
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get progress for a user and game
router.get('/:telegramId/:gameId', async (req, res) => {
    const { telegramId, gameId } = req.params;

    try {
        const progressRecords = await Progress.find({ telegramId, gameId }).sort({ attempt: 1 });
        if (progressRecords.length === 0) {
            return res.status(200).json({ progress: 0, attempts: 0, completed: false });
        }

        // Get the highest progress
        const highestProgress = progressRecords.reduce((max, record) => Math.max(max, record.progress), 0);
        const attempts = progressRecords.length;
        const completed = progressRecords.some(record => record.completed);

        res.status(200).json({ progress: highestProgress, attempts, completed });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;