'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });

      ChatMessage.belongsTo(models.User, {
        foreignKey: 'receiverId',
        as: 'receiver'
      });

      ChatMessage.belongsTo(models.User, {
        foreignKey: 'deletedByUserId',
        as: 'deletedBy'
      });

      ChatMessage.hasMany(models.ChatMessageRevision, {
        foreignKey: 'messageId',
        as: 'revisions',
        onDelete: 'CASCADE'
      });
    }
  }
  ChatMessage.init({
    senderId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    originalContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedBySender: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    deletedByReceiver: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    deletedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'ChatMessages',
    underscored: false,
    ...(process.env.NODE_ENV === 'production' && {
      schema: process.env.SCHEMA
    }),
    timestamps: true
  });

  return ChatMessage;
};