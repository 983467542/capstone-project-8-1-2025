// backend/routes/api/chat-messages.js
const express = require('express');
const { requireAuth } = require('../../utils/auth');
// const { handleValidationErrors } = require('../../utils/validation');
const { ChatMessage, ChatMessageRevision, User } = require('../../db/models');
// const { check } = require('express-validator');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/chat-messages/conversations
// Get chat history between current user and all other users

// GET /api/chat-messages/:userId
// Get chat history between current user and user2

// PUT /api/chat-messages/:messageId
// Edit a message (only by sender)

// POST /api/chat-messages
// Send a message between two users

// DELETE /api/chat-messages/:messageId
// Only the sender can delete their own message permanently

// GET /api/chat-messages/conversations
// Get chat history between current user and all other users
router.get('/conversations', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const messages = await ChatMessage.findAll({
    where: {
      [Op.or]: [
        { senderId: userId },
        { receiverId: userId },
      ]
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username'] },
      { model: User, as: 'receiver', attributes: ['id', 'username'] },
    ],
    order: [['createdAt', 'DESC']]
  });

  const conversationsMap = new Map();
  for (const msg of messages) {
    const data = msg.toJSON();

    const otherUser = data.senderId === userId ? data.receiver : data.sender;

    let contentPreview = data.deleted
      ? '[message deleted]'
      : data.editedContent || data.content;

    delete data.originalContent;
    delete data.deletedContent;
    delete data.editedContent;

    if (!conversationsMap.has(otherUser.id)) {
      conversationsMap.set(otherUser.id, {
        user: otherUser,
        latestMessage: {
          id: data.id,
          content: contentPreview,
          createdAt: data.createdAt,
          senderId: data.senderId,
          receiverId: data.receiverId
        }
      });
    }
  }

  return res.json(Array.from(conversationsMap.values()));
});

// GET /api/chat-messages/:userId
// Get chat history between current user and another user
router.get('/:userId2', requireAuth, async (req, res) => {
  const userId1 = req.user.id;
  const userId2 = parseInt(req.params.userId2);

  if (isNaN(userId2)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
        { model: User, as: 'deletedBy', attributes: ['id', 'username'] },
        {
          model: ChatMessageRevision,
          as: 'revisions',
          separate: true,
          order: [['editedAt', 'DESC']],
        }
      ],
    });

    const sanitizedMessages = messages.map(msg => {
      const data = msg.toJSON();

      if (data.revisions && data.revisions.length > 0) {
        data.content = data.revisions[0].editedContent;
      }

      data.revisions = data.revisions.map(rev => {
        const { id, editedAt } = rev;
        return { id, editedAt };
      });

      delete data.originalContent;
      delete data.deletedContent;
      delete data.editedContent;

      if (data.deleted) data.content = '[message deleted]';

      return data;
    });

    res.json(sanitizedMessages);
  } catch (err) {
    console.error(`[GET] Error fetching messages between users ${userId1} and ${userId2}:`, err);
    res.status(500).json({ error: 'Unable to fetch chat history' });
  }
});

// PUT /api/chat-messages/:messageId
// Edit a message (only by sender)
router.put('/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { editedContent: newEditedContent } = req.body;

  if (!newEditedContent || typeof newEditedContent !== 'string') {
    return res.status(400).json({ error: 'editedContent is required and must be a string' });
  }

  try {
    const message = await ChatMessage.findByPk(messageId);

    if (!message) {
      console.warn(`[PUT] Message ${messageId} not found`);
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== req.user.id) {
      console.warn(`[PUT] User ${req.user.id} is not the sender of message ${messageId}`);
      return res.status(403).json({ error: 'Unauthorized to edit this message' });
    }

    await ChatMessageRevision.create({
      messageId: message.id,
      editedContent: newEditedContent,
      editedAt: new Date()
    });

    message.editedContent = newEditedContent;
    message.editedAt = new Date();
    await message.save();

    const messageWithUsers = await ChatMessage.findByPk(messageId, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
        { model: User, as: 'deletedBy', attributes: ['id', 'username'] }
      ]
    });

    const data = messageWithUsers.toJSON();

    const latestRevision = await ChatMessageRevision.findOne({
      where: { messageId: message.id },
      order: [['editedAt', 'DESC']],
    });

    if (latestRevision?.editedContent) {
      data.content = latestRevision.editedContent;
    }

    delete data.originalContent;
    delete data.deletedContent;
    delete data.editedContent;

    if (data.deleted) data.content = '[message deleted]';

    res.json(data);
  } catch (err) {
    console.error(`[PUT] Error editing message ${messageId}:`, err);
    res.status(500).json({ error: 'Something went wrong while editing the message' });
  }
});

// POST /api/chat-messages
// Send a message between two users
router.post('/', requireAuth, async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    console.warn(`[POST] Missing receiver or content in message from user ${senderId}`);
    return res.status(400).json({ error: 'Receiver and content are required' });
  }

  if (senderId === receiverId) {
    console.warn(`[POST] User ${senderId} attempted to message themselves`);
    return res.status(400).json({ error: "Sender and receiver cannot be the same" });
  }

  try {
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      console.warn(`[POST] Receiver with ID ${receiverId} not found`);
      return res.status(404).json({ error: 'Receiver not found.' });
    }

    const newMessage = await ChatMessage.create({
      senderId,
      receiverId,
      content,
      originalContent: content
    });

    const messageWithUsers = await ChatMessage.findByPk(newMessage.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
        { model: User, as: 'deletedBy', attributes: ['id', 'username'] }
      ]
    });

    const data = messageWithUsers.toJSON();
    delete data.originalContent;
    delete data.deletedContent;
    delete data.editedContent;
    if (data.deleted) delete data.content;

    res.status(201).json(data);
  } catch (err) {
    console.error(`[POST] Error sending message from user ${senderId} to ${receiverId}:`, err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// DELETE /api/chat-messages/:messageId
// Only the sender can delete their own message permanently
router.delete('/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await ChatMessage.findByPk(messageId);

    if (!message) {
      console.warn(`[DELETE] Message ${messageId} not found`);
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      console.warn(`[DELETE] Unauthorized delete attempt: User ${userId} is not sender of message ${messageId}`);
      return res.status(403).json({ error: 'Only the sender can delete this message' });
    }

    const latestRevision = await ChatMessageRevision.findOne({
      where: { messageId: message.id },
      order: [['editedAt', 'DESC']],
    });

    message.deletedContent = latestRevision?.editedContent || message.editedContent || message.content;
    message.deleted = true;
    message.deletedByUserId = userId;
    message.deletedAt = new Date();
    message.content = '[message deleted]';

    await message.save();

    const updatedMessage = await ChatMessage.findByPk(messageId, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
        { model: User, as: 'deletedBy', attributes: ['id', 'username'] }
      ]
    });

    const data = updatedMessage.toJSON();
    delete data.originalContent;
    delete data.deletedContent;
    delete data.editedContent;
    if (data.deleted) delete data.content;

    return res.json(data);
  } catch (err) {
    console.error(`[DELETE] Error deleting message ${messageId} by user ${userId}:`, err);
    return res.status(500).json({ error: 'Failed to delete the message' });
  }
});

module.exports = router;