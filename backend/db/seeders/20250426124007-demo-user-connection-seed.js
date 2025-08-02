'use strict';

const { User, UserConnection } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username']
      });

      if (users.length < 2) {
        console.error('Not enough users found in the database for seeding connections');
        return;
      }

      const demoUser = users.find(u => u.username === 'Demo-lition') || users[0];
      const user1 = users.find(u => u.username === 'FakeUser1') || users[1];
      const user2 = users.find(u => u.username === 'FakeUser2') || users[2];

      if (!demoUser || !user1 || !user2) {
        console.error('Required seed users not found');
        return;
      }

      await UserConnection.bulkCreate([
        {
          user_1_id: demoUser.id,
          user_2_id: user1.id,
          connectionStatusUser1: 'pending',
          connectionStatusUser2: 'pending',
          // chatEnabled: false,
          meetingStatusUser1: 'pending',
          meetingStatusUser2: 'pending',
          suggestedActivityUser1: 'Coffee chat at local cafe',
          suggestedActivityUser2: 'Coffee chat at local cafe',
          meetingTimeUser1: new Date('2025-05-10T14:00:00Z'),
          meetingTimeUser2: new Date('2025-05-10T14:05:00Z'),
          meetAgainChoiceUser1: null,
          meetAgainChoiceUser2: null
        },
        {
          user_1_id: user1.id,
          user_2_id: user2.id,
          connectionStatusUser1: 'accepted',
          connectionStatusUser2: 'accepted',
          // chatEnabled: true,
          meetingStatusUser1: 'confirmed',
          meetingStatusUser2: 'confirmed',
          suggestedActivityUser1: 'Hiking at local trail',
          suggestedActivityUser2: 'Hiking at local trail',
          meetingTimeUser1: new Date('2025-05-12T09:00:00Z'),
          meetingTimeUser2: new Date('2025-05-12T09:00:00Z'),
          meetAgainChoiceUser1: true,
          meetAgainChoiceUser2: null
        },
        {
          user_1_id: demoUser.id,
          user_2_id: user2.id,
          connectionStatusUser1: 'accepted',
          connectionStatusUser2: 'accepted',
          // chatEnabled: true,
          meetingStatusUser1: 'completed',
          meetingStatusUser2: 'completed',
          suggestedActivityUser1: 'Lunch at local deli',
          suggestedActivityUser2: 'Hiking at local trail',
          meetingTimeUser1: new Date('2025-04-30T12:10:00Z'),
          meetingTimeUser2: new Date('2025-04-30T12:00:00Z'),
          meetAgainChoiceUser1: false,
          meetAgainChoiceUser2: true
        }
      ], { validate: true });
    } catch (error) {
      console.error('Error seeding user connections:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'UserConnections';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      [Op.or]: [
        {
          meetingTimeUser1: new Date('2025-05-10T14:00:00Z'),
          meetingTimeUser2: new Date('2025-05-10T14:05:00Z'),
        },
        {
          meetingTimeUser1: new Date('2025-05-12T09:00:00Z'),
          meetingTimeUser2: new Date('2025-05-12T09:00:00Z'),
        },
        {
          meetingTimeUser1: new Date('2025-04-30T12:10:00Z'),
          meetingTimeUser2: new Date('2025-04-30T12:00:00Z'),
        }
      ]
    }, {});
  }
};