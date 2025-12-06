const express = require('express');
const { registerUser, loginUser, getProfile, changePassword, forgotPassword, resetPassword, deleteAccount, createTestUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.delete('/delete-account', protect, deleteAccount);
router.post('/create-test-user', createTestUser);

module.exports = router;