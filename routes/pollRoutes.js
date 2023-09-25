const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.post('/create', pollController.createPoll);
router.post('/:pollId/questions', pollController.addQuestionSet);
router.get('/list', pollController.getAllPolls);
router.put('/:pollId', pollController.updatePoll);
router.get('/user/:userId/polls', pollController.getUserPolls);
router.post('/:pollId/submit', pollController.submitPoll);
router.patch('/:pollId/questions/:questionId', pollController.updateQuestionSet);

module.exports = router;
