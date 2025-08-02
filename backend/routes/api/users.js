// backend/routes/api/users.js
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];

// POST /api/users
// Create a new user in the database
router.post('/', validateSignup, async (req, res) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password,
    location,
    locationRadius,
    customLocationRadius,
    availability,
    interests,
    objectives,
    bio
  } = req.body;
  // console.log('POST /api/users req.body', req.body);

  try {
    const hashedPassword = bcrypt.hashSync(password);

    const user = await User.create({
      email,
      username,
      firstName,
      lastName,
      hashedPassword,
      location,
      locationRadius,
      customLocationRadius,
      availability,
      interests,
      objectives,
      bio
    });

    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      email: user.email,
      username: user.username,
      age: user.age,
      ethnicity: user.ethnicity,
      location: user.location,
      locationRadius: user.locationRadius,
      customLocationRadius: user.customLocationRadius,
      availability: user.availability,
      interests: user.interests,
      objectives: user.objectives,
      bio: user.bio
    };

    await setTokenCookie(res, safeUser);
    return res.status(201).json({ user: safeUser });

  } catch (e) {
    console.error('Signup error:', e);

    if (e.name === 'SequelizeUniqueConstraintError') {
      res.status(400);
      return res.json({
        message: "User already exists",
        errors: {
          email: "User with that email already exists",
          username: "User with that username already exists"
        }
      });
    }

    res.status(500).json({ error: 'Signup failed due to server error' });
  }
});

// GET /api/users/profile
// Retrieve the logged-in user's profile

// GET /api/users/details?ids=1,2,3
// Retrieve the logged-in user's fully detailed profile

// POST /api/users
// Create a new user in the database

// PUT /api/users
// Update the logged-in user's profile (e.g., age, ethnicity, location, location radius, interests, objectives, bio, availability)

// DELETE /api/users
// Delete the logged-in user's own account from the system

// POST /api/filter-results
// Filter user connections by age, ethnicity, interests, objectives, location, and/or location radius

// GET /api/users/:id
// Retrieve profile info of a user connection

// GET /api/users
// Get all users (for game partner selection)

// GET /api/users/profile
// Retrieve the logged-in user's profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.unscoped().findByPk(req.user.id, {
      attributes: [
        'id',
        'username',
        'firstName',
        'age',
        'gender',
        'ethnicity',
        'location',
        'locationRadius',
        'customLocationRadius',
        'availability',
        'interests',
        'objectives',
        'bio',
        'sexualOrientation'
      ]
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Error in GET /api/users:', err);
    res.status(500).json({ error: 'Unable to retrieve user profile' });
  }
});

// GET /api/users/details?ids=1,2,3
// Retrieve the logged-in user's fully detailed profile
router.get('/details', async (req, res) => {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) return res.status(400).json({ error: 'No user IDs provided' });

    const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length === 0) return res.status(400).json({ error: 'Invalid user IDs' });

    const users = await User.findAll({
      where: { id: ids },
      attributes: ['id', 'username', 'firstName', 'age', 'ethnicity', 'bio', 'interests', 'objectives']
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users
// Update the logged-in user's profile (e.g., age, ethnicity, location, location radius, interests, objectives, bio, availability)
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const {
      age,
      ethnicity,
      gender,
      location,
      locationRadius: rawLocationRadius,
      customLocationRadius,
      availability,
      interests,
      objectives,
      bio,
      sexualOrientation
    } = req.body;
    // console.log('PUT /api/users req.body', req.body);

    let locationRadius;

    if (rawLocationRadius === 'Other' && customLocationRadius) {
      locationRadius = parseInt(customLocationRadius, 10);
    } else if (typeof rawLocationRadius === 'string') {
      const parsed = parseInt(rawLocationRadius, 10);
      locationRadius = isNaN(parsed) ? null : parsed;
    } else {
      locationRadius = rawLocationRadius;
    }

    const input = {
      age,
      ethnicity,
      gender,
      location,
      locationRadius,
      customLocationRadius,
      availability,
      interests,
      objectives,
      bio,
      sexualOrientation
    };

    const updatedData = {};

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        updatedData[key] = value;
      }
    }

    await user.update(updatedData);

    await user.reload();

    const updatedUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      age: user.age,
      ethnicity: user.ethnicity,
      gender: user.gender,
      location: user.location,
      locationRadius: user.locationRadius,
      customLocationRadius: user.customLocationRadius,
      availability: user.availability,
      interests: user.interests,
      objectives: user.objectives,
      bio: user.bio,
      sexualOrientation: user.sexualOrientation
    };

    // console.log('Updated user from backend:', updatedUser);

    await setTokenCookie(res, updatedUser);

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE /api/users
// Delete the logged-in user's own account from the system
router.delete('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /api/filter-results
// Filter user connections by age, ethnicity, interests, objectives, location, and/or location radius
router.post('/filter-results', requireAuth, async (req, res) => {
  const { age, ethnicity, interests, objectives, location, locationRadius } = req.body;
  // console.log('POST /api/filter-results req.body', req.body);

  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated or invalid user data' });
  }

  try {
    const where = {};
    if (Array.isArray(age)) {
      where.age = { [Op.in]: age.map(Number) };
    } else if (age) {
      where.age = Number(age);
    }

    if (Array.isArray(ethnicity)) {
      where[Op.or] = ethnicity.map(e => ({
        ethnicity: { [Op.iLike]: `%${e}%` }
      }));
    } else if (ethnicity) {
      where.ethnicity = { [Op.iLike]: `%${ethnicity}%` };
    }
    if (interests) {
      where.interests = { [Op.iLike]: `%${interests.toLowerCase()}%` };
    }

    if (objectives) {
      where.objectives = { [Op.iLike]: `%${objectives.toLowerCase()}%` };
    }

    if (location) {
      where.location = { [Op.iLike]: `%${location.toLowerCase()}%` };
    }

    if (locationRadius) {
      where.locationRadius = { [Op.lte]: parseInt(locationRadius) };
    }

    const filteredUsers = await User.findAll({
      where,
      attributes: ['id', 'username', 'location', 'interests', 'objectives', 'age', 'ethnicity']
    });

    return res.json(filteredUsers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
// Retrieve profile info of a user connection
router.get('/:id', requireAuth, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'firstName', 'age', 'gender', 'ethnicity', 'location', 'interests', 'objectives', 'bio', 'sexualOrientation']
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile');
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/users
// Get all users (for game partner selection)
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username'],
      where: {
        id: {
          [Op.ne]: req.user.id
        }
      },
      order: [['username', 'ASC']]
    });

    res.json(users);
  } catch (err) {
    console.error('GET /api/users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Future features
// // Block a user
// router.post('blocks', async (req, res) => {
//   const { blockerId, blockedId } = req.body;

//   if (!blockerId || !blockedId) {
// return res.status(400).json({ error: 'blockerId and blockedId are required' });
// }
// 
//   try {
//   const [block, created] = await UserBlock.findOrCreate({
//     where: { userId: blockerId, blockedUserId: blockedId }
//   });

//   if (!created) {
//   return res.status(200).json({ message: 'User is already blocked', block });
// }

// res.status(201).json(block);
// } catch (error) {
//     console.error('Block error:', err);
//     res.status(500).json({ error: 'Failed to block user' });
//   // res.json({ message: 'User blocked', block });
//   }
// });

// // GET /api/users/:userId/blocked-users
// Retrieve a list of blocked users
// router.get('/:userId/blocked-users', async (req, res) => {
//   try {
//     const blocks = await UserBlock.findAll({
//       where: { userId: req.params.userId },
//       include: [{
//         model: User,
//         as: 'BlockedUser',
//         attributes: ['id', 'username', 'email']
//       }]
//     });

//     res.json(blocks);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch blocked users' });
//   }
// });

// // Report a user
// router.post('/:id/report', async (req, res) => {
//   const reporterId = req.user.id;
//   const reportedId = parseInt(req.params.id, 10);
//   const { reason } = req.body;

//   if (!reason || reason.trim().length < 3) {
//     return res.status(400).json({ error: 'A valid reason is required' });
//   }

//   try {
//
//   await UserReport.create({
//     reporterId,
//     reportedId,
//     reason
//   });
//   console.log(`User ${reporterId} reported ${reportedId}. Reason: ${reason}`);
//   res.status(201).json({ message: 'Report submitted' });
// } catch (err) {
//   console.error('Report error:', err);
//   res.status(500).json({ error: 'Failed to submit report' });
// }
// });

module.exports = router;