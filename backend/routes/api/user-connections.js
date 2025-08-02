// backend/routes/api/user-connections.js
const express = require('express');
const { Op } = require('sequelize');
const { requireAuth, restoreUser } = require('../../utils/auth');
const { UserConnection, User } = require('../../db/models');
// const { check } = require('express-validator');
// const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();
router.use(restoreUser);

// GET /api/connections
// Get all connections for the current user

// GET /api/connections/:userId
// Get specific connection between current user and another user

// POST /api/connections
// Create a new connection (e.g., a match or meeting request)

// PUT /api/connections/:connectionId/status
// Update connection status (e.g., "pending" → "accepted")

// PUT /api/connections/:connectionId/meeting
// Update meeting status (e.g., "pending" → "confirmed")

// PUT /api/connections/:connectionId/feedback
// Indicate whether the user wants to meet again

// PUT /api/connections/:id
// Update Suggested Activity and Meeting Time for either user

// DELETE /api/connections/:connectionId
// Remove/cancel a connection

// GET /api/connections
// Get all connections for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await UserConnection.findAll({
      where: {
        [Op.or]: [
          { user_1_id: userId },
          { user_2_id: userId }
        ]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] }
      ],
      order: [['updatedAt', 'DESC']],
    });

    const processedConnections = connections.map(connection => {
      const user1 = connection.user1;
      const user2 = connection.user2;

      return {
        ...connection.toJSON(),
        user1,
        user2,
      };
    });

    res.json(processedConnections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch connections' });
  }
});

// GET /api/connections/:userId
// Get specific connection between current user and another user
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const userId1 = req.user.id;
    const userId2 = req.params.userId;

    // const connection = await UserConnection.findOne({
    //   where: {
    //     [Op.or]: [
    //       { user_1_id: userId1, user_2_id: userId2 },
    //       { user_1_id: userId2, user_2_id: userId1 }
    //     ]
    //   }
    // });
    const connection = await UserConnection.findOne({
      where: {
        // [Op.and]: [
        // {
        [Op.or]: [
          // { user_1_id, user_2_id },
          // { user_1_id: user_2_id, user_2_id: user_1_id }
          { user_1_id: userId1, user_2_id: userId2 },
          { user_1_id: userId2, user_2_id: userId1 }
        ]
        //   //   },
        //   //   { connectionStatus: 'accepted' },
        //   //   { meetingStatus: 'active' }
        //   // ]
        // }
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] }
      ]
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json(connection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to retrieve connection' });
  }
});

// POST /api/connections
// Create a new connection (e.g., a match or meeting request)
router.post('/', requireAuth, async (req, res) => {
  const user1Id = req.user.id;
  const { user2Id,
    suggestedActivityUser1,
    meetingTimeUser1,
    suggestedActivityUser2,
    meetingTimeUser2 } = req.body;

  if (!user2Id) {
    return res.status(400).json({ error: 'Missing required field: user2Id' });
  }

  if (!suggestedActivityUser1 || !meetingTimeUser1) {
    return res.status(400).json({ error: 'Suggested activity and meeting time are required.' });
  }

  try {
    const existingConnection = await UserConnection.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { user_1_id: user1Id, user_2_id: user2Id },
              { user_1_id: user2Id, user_2_id: user1Id }
            ]
          },
          {
            [Op.or]: [
              { connectionStatusUser1: { [Op.notIn]: ['completed', 'declined'] } },
              { connectionStatusUser2: { [Op.notIn]: ['completed', 'declined'] } }
            ]
          }
        ]
      }
    });

    if (existingConnection &&
      (existingConnection.connectionStatusUser1 === 'pending' || existingConnection.connectionStatusUser2 === 'pending')
    ) {
      if (existingConnection.user_1_id === user1Id) {
        if (suggestedActivityUser1) existingConnection.suggestedActivityUser1 = suggestedActivityUser1;
        if (meetingTimeUser1) existingConnection.meetingTimeUser1 = meetingTimeUser1;
      } else {
        if (suggestedActivityUser2) existingConnection.suggestedActivityUser2 = suggestedActivityUser2;
        if (meetingTimeUser2) existingConnection.meetingTimeUser2 = meetingTimeUser2;
      }
      await existingConnection.save();

      const fullConnection = await UserConnection.findByPk(existingConnection.id, {
        include: [
          { model: User, as: 'user1', attributes: ['id', 'username'] },
          { model: User, as: 'user2', attributes: ['id', 'username'] }
        ]
      });

      return res.status(200).json(fullConnection);
    }

    if (existingConnection) {
      return res.status(200).json({ message: "A connection already exists between these users" });
    }

    const newConnection = await UserConnection.create({
      user_1_id: user1Id,
      user_2_id: user2Id,
      connectionStatusUser1: 'pending',
      connectionStatusUser2: 'pending',
      // chatEnabled: false,
      meetingStatusUser1: 'pending',
      meetingStatusUser2: 'pending',
      suggestedActivityUser1,
      meetingTimeUser1,
      suggestedActivityUser2,
      meetingTimeUser2,
    });

    const fullConnection = await UserConnection.findByPk(newConnection.id, {
      include: [
        { model: User, as: 'user1', attributes: ['id', 'username'] },
        { model: User, as: 'user2', attributes: ['id', 'username'] }
      ]
    });

    return res.status(201).json(fullConnection);
  } catch (err) {
    console.error('Error creating connection:', err);
    return res.status(500).json({ error: 'Failed to create connection' });
  }
});

// PUT /api/connections/:connectionId/status
// Update connection status (e.g., "pending" → "accepted")
router.put('/:connectionId/status', requireAuth, async (req, res) => {
  const { connectionId } = req.params;
  const { connectionStatusUser1, connectionStatusUser2 } = req.body;

  try {
    const connection = await UserConnection.findByPk(connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    const validStatuses = ['active', 'pending', 'accepted', 'declined', 'inactive'];
    if (connectionStatusUser1 && !validStatuses.includes(connectionStatusUser1)) {
      return res.status(400).json({ error: 'Invalid connectionStatusUser1' });
    }

    if (connectionStatusUser2 && !validStatuses.includes(connectionStatusUser2)) {
      return res.status(400).json({ error: 'Invalid connectionStatusUser2' });
    }

    if (connectionStatusUser1 && req.user.id === connection.user_1_id) {
      connection.connectionStatusUser1 = connectionStatusUser1;
    }

    if (connectionStatusUser2 && req.user.id === connection.user_2_id) {
      connection.connectionStatusUser2 = connectionStatusUser2;
    }

    await connection.save();

    res.json(connection);
  } catch (err) {
    console.error('Error updating connection status:', err);
    res.status(500).json({ error: 'Failed to update connection status', details: err.message });
  }
});

// PUT /api/connections/:connectionId/meeting
// Update meeting status (e.g., "pending" → "confirmed")
router.put('/:connectionId/meeting', requireAuth, async (req, res) => {
  const { connectionId } = req.params;
  const { meetingStatusUser1, meetingStatusUser2 } = req.body;
  const userId = req.user.id;

  try {
    const connection = await UserConnection.findByPk(connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    const validStatuses = ['active', 'pending', 'accepted', 'confirmed', 'canceled', 'completed', 'inactive'];
    if ('meetingStatusUser1' in req.body) {
      if (userId !== connection.user_1_id) {
        return res.status(403).json({ error: 'Not authorized to update meetingStatusUser1' });
      }
      if (!validStatuses.includes(meetingStatusUser1)) {
        return res.status(400).json({ error: 'Invalid meetingStatusUser1' });
      }
      connection.meetingStatusUser1 = meetingStatusUser1;
    }

    if ('meetingStatusUser2' in req.body) {
      if (userId !== connection.user_2_id) {
        return res.status(403).json({ error: 'Not authorized to update meetingStatusUser2' });
      }
      if (!validStatuses.includes(meetingStatusUser2)) {
        return res.status(400).json({ error: 'Invalid meetingStatusUser2' });
      }
      connection.meetingStatusUser2 = meetingStatusUser2;
    }

    await connection.save();

    res.json(connection);
  } catch (err) {
    console.error('Error updating meeting status:', err);
    res.status(500).json({ error: 'Failed to update meeting status', details: err.message });
  }
});

// PUT /api/connections/:connectionId/feedback
// Indicate whether the user wants to meet again
router.put('/:connectionId/feedback', requireAuth, async (req, res) => {
  const { connectionId } = req.params;
  const userId = req.user.id;

  try {
    const connection = await UserConnection.findByPk(connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    let updateData = {};

    if ('meetAgainChoiceUser1' in req.body) {
      if (userId !== connection.user_1_id) {
        return res.status(403).json({ error: 'Not authorized to update meetAgainChoiceUser1' });
      }
      updateData.meetAgainChoiceUser1 = req.body.meetAgainChoiceUser1;
    } else if ('meetAgainChoiceUser2' in req.body) {
      if (userId !== connection.user_2_id) {
        return res.status(403).json({ error: 'Not authorized to update meetAgainChoiceUser2' });
      }
      updateData.meetAgainChoiceUser2 = req.body.meetAgainChoiceUser2;
    } else if ('meetAgain' in req.body) {
      const { meetAgain } = req.body;
      if (userId === connection.user_1_id) {
        updateData.meetAgainChoiceUser1 = meetAgain;
      } else if (userId === connection.user_2_id) {
        updateData.meetAgainChoiceUser2 = meetAgain;
      } else {
        return res.status(403).json({ error: 'Not authorized to give feedback on this connection' });
      }
    } else {
      return res.status(400).json({ error: 'Missing meetAgain or meetAgainChoiceUser1/2 in request body' });
    }

    const updatedConnection = await connection.update(updateData);
    res.json(updatedConnection);
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback', details: err.message });
  }
});

// PUT /api/connections/:id
// Update Suggested Activity and Meeting Time for either user
router.put('/:id', requireAuth, async (req, res) => {
  const connectionId = parseInt(req.params.id, 10);
  if (isNaN(connectionId)) {
    return res.status(400).json({ error: 'Invalid connection ID' });
  }
  // const connection = await UserConnection.findByPk(req.params.id);
  const connection = await UserConnection.findByPk(connectionId);

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  if (![connection.user_1_id, connection.user_2_id].includes(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to update this connection' });
  }

  const {
    suggestedActivityUser1,
    meetingTimeUser1,
    suggestedActivityUser2,
    meetingTimeUser2,
    connectionStatusUser1,
    connectionStatusUser2
  } = req.body;

  const validStatuses = ['pending', 'active', 'accepted', 'declined', 'inactive'];

  if (suggestedActivityUser1 !== undefined)
    connection.suggestedActivityUser1 = suggestedActivityUser1;

  if (meetingTimeUser1 !== undefined)
    connection.meetingTimeUser1 = meetingTimeUser1;

  if (suggestedActivityUser2 !== undefined)
    connection.suggestedActivityUser2 = suggestedActivityUser2;

  if (meetingTimeUser2 !== undefined)
    connection.meetingTimeUser2 = meetingTimeUser2;

  if (connectionStatusUser1 !== undefined) {
    if (req.user.id !== connection.user_1_id) {
      return res.status(403).json({ error: 'Not authorized to update connectionStatusUser1' });
    }
    if (!validStatuses.includes(connectionStatusUser1)) {
      return res.status(400).json({ error: 'Invalid connectionStatusUser1' });
    }
    connection.connectionStatusUser1 = connectionStatusUser1;
  }

  if (connectionStatusUser2 !== undefined) {
    if (req.user.id !== connection.user_2_id) {
      return res.status(403).json({ error: 'Not authorized to update connectionStatusUser2' });
    }
    if (!validStatuses.includes(connectionStatusUser2)) {
      return res.status(400).json({ error: 'Invalid connectionStatusUser2' });
    }
    connection.connectionStatusUser2 = connectionStatusUser2;
  }

  await connection.save();
  return res.json(connection);
});

// DELETE /api/connections/:connectionId
// Remove/cancel a connection
router.delete('/:connectionId', requireAuth, async (req, res) => {
  const { connectionId } = req.params;

  try {
    const connection = await UserConnection.findByPk(connectionId);
    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    await connection.destroy();
    res.json({ message: 'Connection removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
});

module.exports = router;