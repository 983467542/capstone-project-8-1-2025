'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'ChatMessages';
    await queryInterface.createTable(options, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'Users',
            schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      originalContent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      deletedContent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deletedBySender: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      deletedByReceiver: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      deletedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    options.tableName = 'ChatMessages';
    return queryInterface.dropTable(options);
  }
};