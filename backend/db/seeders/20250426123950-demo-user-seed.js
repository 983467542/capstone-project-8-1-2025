'use strict';

const { User } = require('../models');
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await User.bulkCreate([
      {
        firstName: 'John',
        lastName: 'Smith',
        age: 29,
        email: 'demo@user.io',
        username: 'Demo-lition',
        hashedPassword: bcrypt.hashSync('password'),
        location: 'New York City, New York, United States',
        locationRadius: 25,
        customLocationRadius: null,
        availability: 'Weekends, 7PM-2AM',
        interests: 'Technology, Music, Hiking',
        objectives: 'Networking, Skill Development',
        bio: 'I\'m new in town, looking for new friends.'
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        age: 38,
        email: 'user1@user.io',
        username: 'FakeUser1',
        hashedPassword: bcrypt.hashSync('password2'),
        location: 'Los Angeles, California, United States',
        locationRadius: 30,
        customLocationRadius: null,
        availability: 'Weekends, 10AM-2PM',
        interests: 'Cooking, Traveling, Photography',
        objectives: 'Personal Growth, Meeting New People',
        bio: 'Searching for more friends who better fit my lifestyle.'
      },
      {
        firstName: 'Ashley',
        lastName: 'Rodriguez',
        age: 33,
        email: 'user2@user.io',
        username: 'FakeUser2',
        hashedPassword: bcrypt.hashSync('password3'),
        location: 'Chicago, Illinois, United States',
        locationRadius: 20,
        customLocationRadius: null,
        availability: 'Weekends, 10AM-2PM',
        interests: 'Fitness, Reading, Volunteering',
        objectives: 'Meeting New People',
        bio: 'Who wants to try out restaurants?'
      },
      {
        firstName: 'Michael',
        lastName: 'Taylor',
        age: 35,
        email: 'user3@user.io',
        username: 'FakeUser3',
        hashedPassword: bcrypt.hashSync('password4'),
        location: 'New York City, New York, United States',
        locationRadius: 35,
        customLocationRadius: null,
        availability: 'Weekdays, 9AM-5PM',
        interests: 'Art, Hiking, Food, Technology',
        objectives: 'Networking, Personal Growth',
        bio: 'Want to play video games with new people.'
      },
      {
        firstName: 'Samantha',
        lastName: 'Lee',
        age: 39,
        email: 'user4@user.io',
        username: 'FakeUser4',
        hashedPassword: bcrypt.hashSync('password5'),
        location: 'Austin, Texas, United States',
        locationRadius: 30,
        customLocationRadius: null,
        availability: 'Weekends, 9AM-12PM',
        interests: 'Yoga, Cooking, Photography',
        objectives: 'Building Connections',
        bio: 'Let\'s do yoga.'
      },
      {
        firstName: 'David',
        lastName: 'Johnson',
        age: 32,
        email: 'user5@user.io',
        username: 'FakeUser5',
        hashedPassword: bcrypt.hashSync('password6'),
        location: 'Miami, Florida, United States',
        locationRadius: 25,
        customLocationRadius: null,
        availability: 'Evenings, 5PM-10PM',
        interests: 'Technology, Reading, Traveling',
        objectives: 'Skill Development, Meeting New People',
        bio: 'Who is hosting a book club?'
      }
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['Demo-lition', 'FakeUser1', 'FakeUser2', 'FakeUser3', 'FakeUser4', 'FakeUser5'] }
    }, {});
  }
};