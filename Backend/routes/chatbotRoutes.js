const express = require('express');
const { body } = require('express-validator');
const { chat } = require('../controllers.js/chatbotController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot router is working. Use POST /api/chatbot with a Bearer token to chat.',
    example_body: {
      message: "What is today's water supply status?",
      language: 'en',
      speak: false,
    },
  });
});

router.post(
  '/',
  authenticate,
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('language').optional().isString().isLength({ min: 2, max: 20 }),
    body('speak').optional().isBoolean().withMessage('speak must be true or false'),
    body('voice').optional().isString().isLength({ min: 2, max: 30 }),
  ],
  validate,
  chat
);

module.exports = router;
