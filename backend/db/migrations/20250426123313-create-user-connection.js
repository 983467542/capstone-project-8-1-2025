'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'UserConnections';
    await queryInterface.createTable('UserConnections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      connectionStatusUser1: {
        type: Sequelize.STRING,
        allowNull: false
      },
      connectionStatusUser2: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // chatEnabled: {
      //   type: Sequelize.BOOLEAN,
      //   allowNull: false,
      //   defaultValue: false
      // },
      meetingStatusUser1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingStatusUser2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      suggestedActivityUser1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      suggestedActivityUser2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingTimeUser1: {
        type: Sequelize.DATE,
        allowNull: true
      },
      meetingTimeUser2: {
        type: Sequelize.DATE,
        allowNull: true
      },
      meetAgainChoiceUser1: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      meetAgainChoiceUser2: {
        type: Sequelize.BOOLEAN,
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
      },
    }, options);
  },
  async down(queryInterface, Sequelize) {
    options.tableName = 'UserConnections';
    return queryInterface.dropTable(options);
  }
};