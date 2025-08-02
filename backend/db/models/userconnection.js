'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserConnection extends Model {
    static associate(models) {
      UserConnection.belongsTo(models.User, { foreignKey: 'user_1_id', as: 'user1' });
      UserConnection.belongsTo(models.User, { foreignKey: 'user_2_id', as: 'user2' });
    }
  }
  UserConnection.init({
    user_1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    user_2_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    connectionStatusUser1: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['active', 'pending', 'accepted', 'declined', 'inactive']]
      }
    },
    connectionStatusUser2: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['active', 'pending', 'accepted', 'declined', 'inactive']]
      }
    },
    meetingStatusUser1: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['active', 'pending', 'accepted', 'confirmed', 'canceled', 'completed', 'inactive']]
      }
    },
    meetingStatusUser2: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['active', 'pending', 'accepted', 'confirmed', 'canceled', 'completed', 'inactive']]
      }
    },
    // chatEnabled: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false
    // },
    suggestedActivityUser1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    suggestedActivityUser2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    meetingTimeUser1: {
      type: DataTypes.DATE,
      allowNull: true
    },
    meetingTimeUser2: {
      type: DataTypes.DATE,
      allowNull: true
    },
    meetAgainChoiceUser1: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    meetAgainChoiceUser2: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserConnection',
    tableName: 'UserConnections',
    underscored: false,
    ...(process.env.NODE_ENV === 'production' && {
      schema: process.env.SCHEMA
    }),
    timestamps: true
  });

  return UserConnection;
};