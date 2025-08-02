'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'GamePlays';
    await queryInterface.createTable('GamePlays', {
      gameSessionId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true
      },
      user_1_id: {
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
      user_2_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'Users',
            schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
          },
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      traitCategory: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      traitName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      interactionType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guesser_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: {
            tableName: 'Users',
            schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
          },
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      guessedValue: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
        // ,
        // validate: {
        //   isIn: [['active', 'pending', 'started', 'ended', 'completed']]
        // }
      },
      currentPlayerIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      players: {
        type: Sequelize.JSON,
        allowNull: true
      },
      roundNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      usedCards: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      completedTraits: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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
    }, options);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'GamePlays';
    return queryInterface.dropTable(options);
  }
};