'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GamePlay extends Model {
    static associate(models) {
      GamePlay.belongsTo(models.User, { foreignKey: 'user_1_id', as: 'user1' });
      GamePlay.belongsTo(models.User, { foreignKey: 'user_2_id', as: 'user2' });
      GamePlay.belongsTo(models.User, { foreignKey: 'guesser_id', as: 'guesser' });
    }
  }
  GamePlay.init({
    // id: {
    // type: DataTypes.INTEGER,
    // primaryKey: true,
    // autoIncrement: true,
    // allowNull: false
    // },
    gameSessionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      // allowNull: true,
      unique: true
      ,
      autoIncrement: true
    },
    user_1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    user_2_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    traitCategory: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    traitName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    interactionType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    guessedValue: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    guesser_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    currentPlayerIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    players: {
      type: DataTypes.JSON,
      allowNull: true
    },
    roundNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    usedCards: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    completedTraits: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
      // ,
      // validate: {
      //   isIn: [['active', 'pending', 'started', 'ended', 'completed']]
      // }
    }
  }, {
    sequelize,
    modelName: 'GamePlay',
    tableName: 'GamePlays',
    underscored: false,
    ...(process.env.NODE_ENV === 'production' && {
      schema: process.env.SCHEMA
    }),
    timestamps: true
  });

  return GamePlay;
};