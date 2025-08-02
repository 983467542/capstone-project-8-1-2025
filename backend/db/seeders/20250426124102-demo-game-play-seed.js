'use strict';

const { User, GamePlay } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            function createGamePlaySeed(user1, user2, traitCategory, traitName, guesser) {
                const players = [user1.username, user2.username];
                const guessTargetUsername = guesser.id === user1.id ? user2.username : user1.username;
                const currentPlayerIndex = players.indexOf(guessTargetUsername);

                return {
                    user_1_id: user1.id,
                    user_2_id: user2.id,
                    traitCategory,
                    traitName,
                    interactionType: 'guessing',
                    guesser_id: guesser.id,
                    guessedValue: null,
                    isCorrect: null,
                    status: 'active',
                    currentPlayerIndex,
                    players: players,
                    roundNumber: 1,
                    usedCards: [],
                    completedTraits: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
            const users = await User.findAll({
                attributes: ['id', 'username']
            });

            if (users.length < 6) {
                console.error('Not enough users found in the database for seeding game plays');
                return;
            }

            const user1 = users[0];
            const user2 = users[1];
            const user3 = users[2];
            const user4 = users[3];
            const user5 = users[4];
            const user6 = users[5];

            await GamePlay.bulkCreate([
                createGamePlaySeed(user1, user2, 'Conversation Style and Humor', '', user2),
                createGamePlaySeed(user2, user3, null, null, user3),
                createGamePlaySeed(user3, user4, 'Food and Drink Preferences', '', user4),
                createGamePlaySeed(user5, user6, 'Conversation Style and Humor', '', user5)
            ], { validate: true });
        } catch (error) {
            console.error('Error seeding game plays:', error);
        }
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'GamePlays';
        const Op = Sequelize.Op;
        return queryInterface.bulkDelete(options, {
            [Op.or]: [
                { traitCategory: 'Conversation Style and Humor' },
                { traitCategory: null },
                { traitCategory: 'Food and Drink Preferences' },
                { traitCategory: 'Conversation Style and Humor' }
            ]
        }, {});
    }
};