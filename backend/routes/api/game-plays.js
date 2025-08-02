// backend/routes/api/game-plays.js
const express = require('express');
const { Op } = require('sequelize');
const { requireAuth } = require('../../utils/auth');
// const { handleValidationErrors } = require('../../utils/validation');
// const { validateGamePlays } = require('../../utils/post-validators');
const { GamePlay, UserConnection, User } = require('../../db/models');

const router = express.Router();

// GET /api/game-plays/:user1Id/:user2Id
// Get game between two specific users

// GET /api/game-plays/:gamePlayId
// Get specific game round (if meeting is active)

// GET /api/game-plays
// Get all game rounds involving the user (active meetings only)

// POST /api/game-plays
// Start a new game round (requires active meeting)

// // PUT /api/game-plays/:gamePlayId/add-user
// // Add a second user

// PUT /api/game-plays/:gamePlayId/trait
// Update the trait information for a game

// PUT /api/game-plays/:gamePlayId/correctness
// Update whether a guess was correct or not

// PUT /api/game-plays/:id/guessed-value
// Update a guessed value

// PUT /api/game-plays/:gamePlayId/interaction-type
// Update the interaction type (guessing, roasts, talk-about)

// PUT /api/game-plays/:gamePlayId/prompt
// Update the "talk-about" or "roast" prompt post-guess

// PUT /api/game-plays/:gamePlayId/end
// Ends the game

// PUT /api/game-plays/:gameSessionId/reset
// Resets the game

// PUT /api/game-plays/:gameSessionId
// Updates the game state

// DELETE /api/game-plays
// Automatically deletes all game rounds after the meeting ends (batch delete)

// GET /api/game-plays/:user1Id/:user2Id
// Get game between two specific users
router.get('/:user1Id/:user2Id', requireAuth, async (req, res) => {
  const { user1Id, user2Id } = req.params;
  const currentUserId = req.user.id;

  try {
    if (![parseInt(user1Id), parseInt(user2Id)].includes(currentUserId)) {
      return res.status(403).json({ error: 'You are not authorized to view this game' });
    }

    const game = await GamePlay.findOne({
      attributes: [
        'gameSessionId',
        'user_1_id',
        'user_2_id',
        'traitCategory',
        'traitName',
        'guessedValue',
        'guesser_id',
        'interactionType',
        'isCorrect',
        'status',
        'roundNumber',
        'currentPlayerIndex',
        'players',
        'usedCards',
        'completedTraits',
        'createdAt',
        'updatedAt'
      ],
      where: {
        [Op.or]: [
          { user_1_id: user1Id, user_2_id: user2Id },
          { user_1_id: user2Id, user_2_id: user1Id }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!game) {
      return res.status(404).json({
        error: `No game found between users ${user1Id} and ${user2Id}`
      });
    }

    res.json(game);
  } catch (err) {
    console.error('GET /api/game-plays/:user1Id/:user2Id error', err);
    res.status(500).json({ error: 'Failed to retrieve game' });
  }
});

// GET /api/game-plays/:gamePlayId
// Get specific game round (if meeting is active)
router.get('/:gamePlayId', requireAuth, async (req, res) => {
  const { gamePlayId } = req.params;

  try {
    //   const game = await GamePlay.findOne({
    // where: { gameSessionId: gamePlayId },
    // include: [
    //   { model: User, as: 'user1', attributes: ['id', 'username'] },
    //   { model: User, as: 'user2', attributes: ['id', 'username'] },
    //   { model: User, as: 'guesser', attributes: ['id', 'username'] }
    // const game = await GamePlay.findByPk(gamePlayId, {
    //   include: [
    //     { model: User, as: 'user1', attributes: ['id', 'username'] },
    //     { model: User, as: 'user2', attributes: ['id', 'username'] }
    //     // ,
    //     // { model: User, as: 'guesser', attributes: ['id', 'username'] }
    //   ]
    // });
    const game = await GamePlay.findByPk(gamePlayId, {
      attributes: [
        // 'id',
        'gameSessionId',
        'user_1_id',
        'user_2_id',
        'traitCategory',
        'traitName',
        'guessedValue',
        'guesser_id',
        'interactionType',
        'isCorrect',
        'status',
        'roundNumber',
        'currentPlayerIndex',
        'players',
        'usedCards',
        'completedTraits',
        'createdAt',
        'updatedAt'
      ],
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] }
        // ,
        // { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    if (!game || game.status !== 'active') {
      return res.status(404).json({ error: 'Active game round not found' });
    }

    res.json(game);
  } catch (err) {
    console.error('GET /api/game-plays/:gamePlayId error', err);
    res.status(500).json({ error: 'Failed to retrieve game round' });
  }
});

// GET /api/game-plays
// Get all game rounds involving the user (active meetings only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // const games = await GamePlay.findAll({
    //   where: {
    //     status: 'active',
    //     [Op.or]: [
    //       { user_1_id: userId }
    //       ,
    //       { user_2_id: userId },
    //       { guesser_id: userId }
    //     ]
    //   },
    //   include: [
    //     { model: User, as: 'user1', attributes: ['id', 'username'] },
    //     { model: User, as: 'user2', attributes: ['id', 'username'] },
    //     { model: User, as: 'guesser' }
    //   ],
    //   order: [['createdAt', 'DESC']]
    // });
    const games = await GamePlay.findAll({
      attributes: [
        // 'id',
        'gameSessionId',
        'user_1_id',
        'user_2_id',
        'traitCategory',
        'traitName',
        'guessedValue',
        'guesser_id',
        'interactionType',
        'isCorrect',
        'status',
        'roundNumber',
        'currentPlayerIndex',
        'players',
        'usedCards',
        'completedTraits',
        'createdAt',
        'updatedAt'
      ],
      where: {
        status: 'active',
        [Op.or]: [
          { user_1_id: userId },
          { user_2_id: userId },
          { guesser_id: userId }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        {
          model: User,
          as: 'guesser',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(games);
  } catch (err) {
    console.error('GET /api/game-plays error', err);
    res.status(500).json({ error: 'Failed to fetch game rounds' });
  }
});

// POST /api/game-plays
// Start a new game round (requires active meeting)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_1_id, user_2_id, traitCategory, traitName, interactionType } = req.body;

    const currentPlayerIndex = userId === user_1_id ? 0 : 1;
    const guesser_id = currentPlayerIndex === 0 ? user_2_id : user_1_id;

    if (![user_1_id, user_2_id].includes(userId)) {
      return res.status(403).json({ error: 'You are not part of this meeting' });
    }

    const existingGame = await GamePlay.findOne({
      where: {
        [Op.or]: [
          { user_1_id, user_2_id },
          { user_1_id: user_2_id, user_2_id: user_1_id }
        ],
        status: 'active'
      }
    });

    const meeting = await UserConnection.findOne({
      where: {
        [Op.or]: [
          { user_1_id: user_1_id, user_2_id: user_2_id },
          { user_1_id: user_2_id, user_2_id: user_1_id }
        ],
        meetingStatusUser1: 'confirmed',
        meetingStatusUser2: 'confirmed',
      }
    });

    if (!meeting) {
      return res.status(400).json({ error: 'No confirmed meeting found between the users' });
    }

    if (existingGame) {
      return res.json(existingGame);
    }

    const user1 = await User.findByPk(user_1_id, { attributes: ['username'] });
    const user2 = await User.findByPk(user_2_id, { attributes: ['username'] });

    const newGame = await GamePlay.create({
      user_1_id,
      user_2_id,
      guesser_id,
      traitCategory,
      traitName,
      interactionType: interactionType || "guessing",
      status: 'active',
      players: [user1.username, user2.username],
      currentPlayerIndex,
      roundNumber: 1,
      usedCards: [],
      completedTraits: []
    });

    const gameWithUsers = await GamePlay.findByPk(newGame.gameSessionId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.status(201).json(gameWithUsers);
  } catch (err) {
    console.error('Game creation error:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to start game round' });
  }
});

// PUT /api/game-plays/:gamePlayId/add-user
// Add a second user
router.put('/:gamePlayId/add-user', requireAuth, async (req, res) => {
  const { userIdToAdd } = req.body;
  const game = await GamePlay.findOne({ where: { gameSessionId: req.params.gamePlayId } });
  // const game = await GamePlay.findByPk(req.params.gamePlayId);

  if (!game) return res.status(404).json({ message: "Game not found" });

  game.user_2_id = userIdToAdd;
  await game.save();

  res.json(game);
});

// PUT /api/game-plays/:gamePlayId/trait
// Update the trait information for a game
router.put('/:gamePlayId/trait', requireAuth, async (req, res) => {
  const { gamePlayId } = req.params;
  // const { traitCategory, traitName } = req.body;
  const { traitCategory, traitName, guessedValue } = req.body;

  try {
    // const game = await GamePlay.findOne({ where: { gameSessionId: gamePlayId } });
    const game = await GamePlay.findByPk(gamePlayId);

    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (game.user_1_id !== req.user.id && game.user_2_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to update this game' });
    }

    if (traitCategory !== undefined) {
      game.traitCategory = traitCategory;
    }
    if (traitName !== undefined) {
      game.traitName = traitName;
    }
    if (guessedValue !== undefined) {
      game.guessedValue = guessedValue;
    }

    await game.save();

    const updatedGame = await GamePlay.findByPk(gamePlayId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.json(updatedGame);
  } catch (err) {
    console.error('PUT /api/game-plays/:gamePlayId/trait error', err);
    res.status(500).json({ error: 'Failed to update game trait' });
  }
});

// PUT /api/game-plays/:gamePlayId/correctness
// Update whether a guess was correct or not
router.put('/:gamePlayId/correctness', requireAuth, async (req, res) => {
  const { gamePlayId } = req.params;
  const { isCorrect } = req.body;

  try {
    const game = await GamePlay.findByPk(gamePlayId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.user_1_id !== req.user.id && game.user_2_id !== req.user.id) {
      // if (game.user_1_id !== req.user.id) {
      return res.status(403).json({
        error: 'You are not authorized to update this game'
      });
    }

    game.isCorrect = isCorrect;
    await game.save();

    const updatedGame = await GamePlay.findByPk(gamePlayId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.json(updatedGame);
  } catch (err) {
    console.error('PUT /api/game-plays/:gamePlayId/correctness error:', err);
    res.status(500).json({ error: 'Failed to update game correctness' });
  }
});

// PUT /api/game-plays/:id/guessed-value
// Update a guessed value
router.put('/:gamePlayId/guessed-value', requireAuth, async (req, res) => {
  try {
    const { gamePlayId } = req.params;
    const { guessedValue } = req.body;

    const game = await GamePlay.findOne({ where: { gameSessionId: gamePlayId } });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.user_1_id !== req.user.id && game.user_2_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to update this game' });
    }
    await game.update({ guessedValue, isCorrect: null });

    const updatedGame = await GamePlay.findByPk(gamePlayId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.json(updatedGame);
  } catch (err) {
    console.error('PUT api/game-plays/:gamePlayId/guessed-value error', err);
    res.status(500).json({ error: 'Failed to update guessed value' });
  }
});

// PUT /api/game-plays/:gamePlayId/interaction-type
// Update the interaction type (guessing, roasts, talk-about)
router.put('/:gamePlayId/interaction-type', requireAuth, async (req, res) => {
  const { gamePlayId } = req.params;
  const { interactionType } = req.body;

  const validInteractionTypes = ['guessing', 'roasts', 'talk-about'];
  if (!validInteractionTypes.includes(interactionType)) {
    return res.status(400).json({
      error: 'Invalid interaction type. Must be one of: guessing, roasts, talk-about'
    });
  }

  try {
    // const game = await GamePlay.findOne({ where: { gameSessionId: gamePlayId } });
    const game = await GamePlay.findByPk(gamePlayId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.user_1_id !== req.user.id && game.user_2_id !== req.user.id) {
      // if (game.user_1_id !== req.user.id) {
      return res.status(403).json({
        error: 'You are not authorized to update this game'
      });
    }

    game.interactionType = interactionType;
    await game.save();

    const updatedGame = await GamePlay.findByPk(gamePlayId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.json(updatedGame);
  } catch (err) {
    console.error('PUT /api/game-plays/:gamePlayId/interaction-type error:', err);
    res.status(500).json({ error: 'Failed to update interaction type' });
  }
});

// PUT /api/game-plays/:gamePlayId/prompt
// Update the "talk-about" or "roast" prompt post-guess
router.put('/:gamePlayId/prompt', requireAuth, async (req, res) => {
  const { gamePlayId } = req.params;
  const { promptText, guesser_id } = req.body;

  try {
    const game = await GamePlay.findByPk(gamePlayId);

    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.promptText = promptText;
    game.guesser_id = guesser_id;
    game.status = 'completed';
    await game.save();

    const updatedGame = await GamePlay.findByPk(gamePlayId, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    res.json(updatedGame);
  } catch (err) {
    console.error('PUT /api/game-plays/:gamePlayId/prompt error', err);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// PUT /api/game-plays/:gamePlayId/end
// Ends the game
router.put('/:gamePlayId/end', requireAuth, async (req, res) => {
  try {
    const { gamePlayId } = req.params;

    const game = await GamePlay.findByPk(gamePlayId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    game.status = 'ended';
    await game.save();

    await game.destroy();

    res.json(game);
  } catch (err) {
    console.error('Failed to end game:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/game-plays
// Automatically deletes all game rounds after the meeting ends (batch delete)
router.delete('/', requireAuth, async (req, res) => {
  const { user_1_id, user_2_id } = req.body;
  // const { user_1_id} = req.body;

  const currentUserId = req.user.id;
  if (![user_1_id, user_2_id].includes(currentUserId)) {
    // if (![user_1_id].includes(currentUserId)) {
    return res.status(403).json({ error: 'Unauthorized to delete these game rounds' });
  }

  try {
    await GamePlay.destroy({
      where: {
        [Op.or]: [
          // { user_1_id, user_2_id },
          // { user_1_id: user_2_id, user_2_id: user_1_id }
          { user_1_id },
          { user_1_id: user_2_id, user_2_id: user_1_id }
        ]
      }
    });

    res.json({ message: 'Game rounds deleted after meeting end' });
  } catch (err) {
    console.error('DELETE /api/game-plays error', err);
    res.status(500).json({ error: 'Failed to delete game rounds' });
  }
});

// PUT /api/game-plays/:gameSessionId
// Updates the game state
router.put('/:gameSessionId', requireAuth, async (req, res) => {
  const { gameSessionId } = req.params;
  const allowedFields = [
    'players', 'currentPlayerIndex', 'guesser_id', 'interactionType',
    'traitCategory', 'traitName', 'status', 'roundNumber', 'usedCards',
    'completedTraits', 'guessedValue', 'isCorrect'
  ];

  // const updates = req.body;
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  try {
    const game = await GamePlay.findOne({ where: { gameSessionId } });
    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (![game.user_1_id, game.user_2_id].includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not authorized to update this game' });
    }

    if (updates.currentPlayerIndex !== undefined) {
      updates.guesser_id = updates.currentPlayerIndex === 0
        ? game.user_2_id
        : game.user_1_id;
    }

    await game.update(updates);

    const updatedGame = await GamePlay.findOne({
      where: { gameSessionId },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    return res.json(updatedGame);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update game', error: err.message });
  }
});

// PUT /api/game-plays/:gameSessionId/reset
// Resets the game
router.put('/:gameSessionId/reset', requireAuth, async (req, res) => {
  try {
    const { gameSessionId } = req.params;

    const game = await GamePlay.findOne({ where: { gameSessionId } });
    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (![game.user_1_id, game.user_2_id].includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not authorized to reset this game' });
    }

    const currentPlayerIndex = req.user.id === game.user_1_id ? 0 : 1;
    const guesser_id = currentPlayerIndex === 0 ? game.user_2_id : game.user_1_id;

    await game.update({
      guessedValue: null,
      guesser_id,
      interactionType: 'guessing',
      isCorrect: null,
      traitCategory: '',
      traitName: '',
      status: 'active',
      currentPlayerIndex,
      roundNumber: 1,
      completedTraits: [],
      usedCards: []
    });

    const updatedGame = await GamePlay.findOne({
      where: { gameSessionId },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] },
        { model: User, as: 'guesser', attributes: ['id', 'username'] }
      ]
    });

    return res.json(updatedGame);
  } catch (err) {
    console.error('Reset game error:', err);
    return res.status(500).json({ message: 'Failed to reset game' });
  }
});

module.exports = router;