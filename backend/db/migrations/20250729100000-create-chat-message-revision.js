'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
    options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({
            tableName: 'ChatMessageRevisions',
            schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
        }, {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            messageId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: {
                        tableName: 'ChatMessages',
                        schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined
                    },
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            editedContent: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            editedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        options.tableName = 'ChatMessageRevisions';
        return queryInterface.dropTable(options);
    }
};