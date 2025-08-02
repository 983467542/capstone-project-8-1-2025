'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChatMessageRevision extends Model {
        static associate(models) {
            ChatMessageRevision.belongsTo(models.ChatMessage, {
                foreignKey: 'messageId',
                as: 'message',
                onDelete: 'CASCADE'
            });
        }
    }
    ChatMessageRevision.init({
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ChatMessages',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        editedContent: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        editedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        sequelize,
        modelName: 'ChatMessageRevision',
        tableName: 'ChatMessageRevisions',
        underscored: false,
        ...(process.env.NODE_ENV === 'production' && {
            schema: process.env.SCHEMA
        }),
        timestamps: false
    });

    return ChatMessageRevision;
};