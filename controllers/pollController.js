const query = require('../config/database');
const Poll = require('../models/Poll');
const db = require('../config/database');
const Question = require('../models/Question');
const Option = require('../models/Option');
const query = require('../config/database');
const db = require('../config/database')
// Controller method to fetch all created polls
exports.getAllPolls = async (req, res) => {
  try {
    // Define the SQL query to fetch the required data
    const sql = `
      SELECT
        p.id AS poll_id,
        p.title AS poll_title,
        p.category AS poll_category,
        p.start_date AS poll_start_date,
        p.end_date AS poll_end_date,
        COUNT(DISTINCT uv.user_id) AS total_votes,
        COUNT(DISTINCT q.id) AS num_question_sets
      FROM polls AS p
      LEFT JOIN user_votes AS uv ON p.id = uv.poll_id
      LEFT JOIN questions AS q ON p.id = q.poll_id
      GROUP BY p.id
    `;

    // Execute the SQL query
    const polls = await query(sql);

    // Check if there are no polls
    if (polls.length === 0) {
      return res.status(404).json({ message: 'No polls found' });
    }

    // Sample query to fetch details of one question from each poll
    const questions = await query(`
      SELECT id AS question_id, text AS question_text, poll_id
      FROM questions
      WHERE poll_id IN (${polls.map((poll) => poll.poll_id).join(',')})
      GROUP BY poll_id
    `);

    // Combine poll data with questions
    const pollsWithQuestions = polls.map((poll) => ({
      ...poll,
      questions: questions.filter((question) => question.poll_id === poll.poll_id),
    }));

    return res.status(200).json(pollsWithQuestions);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new poll
exports.createPoll = async (req, res) => {
  try {
    const {
      title,
      category,
      startDate,
      endDate,
      minReward,
      maxReward,
    } = req.body;

    // Create the poll in the database
    const poll = await Poll.create({
      title,
      category,
      startDate,
      endDate,
      minReward,
      maxReward,
    });

    res.status(201).json({ message: 'Poll created successfully', poll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Poll Details
exports.updatePoll = async (req, res) => {
  const pollId = req.params.pollId;
  const { title, category, minReward, maxReward, startDate, endDate } = req.body;

  try {
    const updateQuery = `
      UPDATE polls
      SET 
        title = ?,
        category = ?,
        min_reward = ?,
        max_reward = ?,
        start_date = ?,
        end_date = ?
      WHERE id = ?;
    `;
    const result = await db(updateQuery, [title, category, minReward, maxReward, startDate, endDate, pollId]);

    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Poll details updated successfully' });
    } else {
      res.status(404).json({ error: 'Poll not found' });
    }
  } catch (error) {
    console.error('Error updating poll details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add a question set to a poll
exports.addQuestionSet = async (req, res) => {
  try {
    const pollId = req.params.pollId;

    // Find the poll by its ID
    const poll = await Poll.findByPk(pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Extract question set data from the request body
    const { questionType, questionText, options } = req.body;

    // Validate question set data
    if (!questionType || !questionText || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: 'Invalid question set data' });
    }

    // Create a new question set
    const question = await Question.create({
      questionType,
      questionText,
      PollId: pollId, 
    });

    // Create options for the question set
    const optionPromises = options.map((optionText) => {
      return Option.create({ optionText, QuestionId: question.id });
    });

    await Promise.all(optionPromises);

    return res.status(201).json({ message: 'Question set added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit a Poll
exports.submitPoll = async (req, res) => {
  const { userId, selectedOption } = req.body;
  const { pollId } = req.params;

  try {
    // Check if the user and poll exist
    const [user] = await query('SELECT * FROM User WHERE id = ?', [userId]);
    const [poll] = await query('SELECT * FROM Poll WHERE id = ?', [pollId]);

    if (!user || !poll) {
      return res.status(404).json({ message: 'User or Poll not found' });
    }

    // Check if the user has already completed this poll
    const userPoll = await query('SELECT * FROM UserPoll WHERE userId = ? AND pollId = ?', [userId, pollId]);
    if (userPoll.length > 0) {
      return res.status(400).json({ message: 'User has already completed this poll' });
    }

    // Get the question associated with the poll
    const [question] = await query('SELECT * FROM Question WHERE pollId = ?', [pollId]);

    // Check if the selected option is valid for the question
    const validOptions = await query('SELECT * FROM Option WHERE questionId = ?', [question.id]);
    const validOptionIds = validOptions.map(option => option.id);

    if (!validOptionIds.includes(selectedOption)) {
      return res.status(400).json({ message: 'Invalid option selected for the question' });
    }

    // Calculate reward amount within the specified range (minReward and maxReward)
    const minReward = poll.minReward;
    const maxReward = poll.maxReward;
    const rewardAmount = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

    // Update user's data to indicate completion of the question
    await query('INSERT INTO UserPoll (userId, pollId) VALUES (?, ?)', [userId, pollId]);

    // Update poll analytics
    await query('UPDATE Poll SET totalVotes = totalVotes + 1 WHERE id = ?', [pollId]);
    await query('UPDATE Option SET voteCount = voteCount + 1 WHERE id = ?', [selectedOption]);

    res.status(200).json({ rewardAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update a particular question set in a poll
exports.updateQuestionSet = async (req, res) => {
  const { pollId, questionId } = req.params;
  const { questionText, options, questionType } = req.body;

  try {
    // Check if the poll exists
    const pollExistsQuery = 'SELECT * FROM Polls WHERE id = ?';
    const [pollRows] = await db(pollExistsQuery, [pollId]);

    if (pollRows.length === 0) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if the question set exists within the poll
    const questionExistsQuery = 'SELECT * FROM Questions WHERE id = ? AND pollId = ?';
    const [questionRows] = await db(questionExistsQuery, [questionId, pollId]);

    if (questionRows.length === 0) {
      return res.status(404).json({ message: 'Question set not found in the poll' });
    }

    // Update the question set if valid parameters are provided
    const updateQuery = 'UPDATE Questions SET questionText = ?, options = ?, questionType = ? WHERE id = ?';
    await db(updateQuery, [questionText, JSON.stringify(options), questionType, questionId]);

    res.status(200).json({ message: 'Question set updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

