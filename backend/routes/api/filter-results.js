// backend/routes/api/filter-results.js
const { User } = require('../../db/models');
const { Op, Sequelize } = require('sequelize');
const { requireAuth } = require('../../utils/auth');

const router = require('express').Router();

// GET /api/filter-results/current
// Get current filtered results for the authenticated user

// POST /api/filter-results
// Filter connection results

// POST /api/filter-results/reset
// Clear filtered connection results

// GET /api/filter-results/current
// Get current filtered results for the authenticated user
router.get('/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const allUsers = await User.findAll({
      where: {
        id: { [Op.ne]: userId }
      },
      attributes: ['id', 'username', 'firstName', 'age', 'ethnicity', 'interests', 'objectives', 'bio']
    });

    return res.json(allUsers);
  } catch (err) {
    console.error('Error fetching current filtered results:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/filter-results
// Filter connection results
router.post('/', requireAuth, async (req, res) => {
  const { 'age-ranges': selectedAges, ethnicity, gender, interests, objectives, location, locationRadius, sexualOrientation, matchType, userId } = req.body;
  const parsedUserId = parseInt(userId);

  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  const filters = [];

  if (Array.isArray(selectedAges) && selectedAges.length > 0) {
    const ageFilters = [];
    for (let age of selectedAges) {
      const ageInt = parseInt(age);
      if (!isNaN(ageInt) && ageInt >= 18 && ageInt <= 100) {
        ageFilters.push({ age: ageInt });
      }
    }
    if (ageFilters.length > 0) {
      filters.push({ [Op.or]: ageFilters });
    }
  }

  if (Array.isArray(ethnicity) && ethnicity.length > 0) {
    filters.push({
      [Op.or]: ethnicity.map(e =>
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('ethnicity')),
          { [Op.like]: `%${e.toLowerCase()}%` }
        )
      )
    });
  }

  if (typeof gender === 'string' && gender.trim().length > 0) {
    filters.push(
      Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('gender')),
        gender.trim().toLowerCase()
      )
    );
  }

  if (Array.isArray(interests) && interests.length > 0) {
    filters.push({
      [Op.or]: interests.map(i =>
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('interests')),
          { [Op.like]: `%${i.toLowerCase()}%` }
        )
      )
    });
  }

  if (Array.isArray(objectives) && objectives.length > 0) {
    filters.push({
      [Op.or]: objectives.map(o =>
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('objectives')),
          { [Op.like]: `%${o.toLowerCase()}%` }
        )
      )
    });
  }

  if (Array.isArray(sexualOrientation) && sexualOrientation.length > 0) {
    filters.push({
      [Op.or]: sexualOrientation.map(orientation =>
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('sexualOrientation')),
          { [Op.like]: `%${orientation.toLowerCase()}%` }
        )
      )
    });
  }

  if (typeof location === 'string' && location.trim().length > 0) {
    filters.push(
      Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('location')),
        { [Op.like]: `%${location.toLowerCase()}%` }
      )
    );
  }

  if (locationRadius && locationRadius !== '') {
    let radiusInt = parseInt(locationRadius);
    if (!isNaN(radiusInt)) {
      if (radiusInt === 10) {
        filters.push({ locationRadius: { [Op.gte]: 10, [Op.lte]: 14 } });
      } else if (radiusInt === 15) {
        filters.push({ locationRadius: { [Op.gte]: 15, [Op.lte]: 19 } });
      } else if (radiusInt === 20) {
        filters.push({ locationRadius: { [Op.gte]: 20, [Op.lte]: 24 } });
      } else if (radiusInt === 25) {
        filters.push({ locationRadius: { [Op.gte]: 25 } });
      } else {
        filters.push({ locationRadius: { [Op.lte]: radiusInt } });
      }
    }
  }

  try {
    let where = {};

    if (filters.length === 0) {
      where = { id: { [Op.ne]: parsedUserId } };
    } else {
      switch (Array.isArray(matchType) ? matchType[0] : matchType) {
        case 'any':
          where = {
            [Op.and]: [
              { id: { [Op.ne]: parsedUserId } },
              { [Op.or]: filters }
            ]
          };
          break;

        case 'all':
          where = {
            [Op.and]: [
              { id: { [Op.ne]: parsedUserId } },
              ...filters
            ]
          };
          break;

        case 'some': {
          const allUsers = await User.findAll({
            where: { id: { [Op.ne]: parsedUserId } },
            attributes: ['id', 'username', 'firstName', 'location', 'age', 'ethnicity', 'interests', 'objectives', 'locationRadius', 'bio', 'gender', 'sexualOrientation']
          });

          const matchingUsers = allUsers.filter(user => {
            let matchCount = 0;
            if (Array.isArray(selectedAges) && selectedAges.length > 0) {
              if (selectedAges.includes(user.age?.toString())) matchCount++;
            }

            if (Array.isArray(ethnicity) && ethnicity.length > 0) {
              const userEthnicity = user.ethnicity?.toLowerCase() || '';
              if (ethnicity.some(e => userEthnicity.includes(e.toLowerCase()))) matchCount++;
            }

            if (gender && gender.trim().length > 0) {
              if (user.gender?.toLowerCase() === gender.toLowerCase()) matchCount++;
            }

            if (Array.isArray(interests) && interests.length > 0) {
              const userInterests = user.interests?.toLowerCase() || '';
              if (interests.some(i => userInterests.includes(i.toLowerCase()))) matchCount++;
            }

            if (Array.isArray(objectives) && objectives.length > 0) {
              const userObjectives = user.objectives?.toLowerCase() || '';
              if (objectives.some(o => userObjectives.includes(o.toLowerCase()))) matchCount++;
            }

            if (Array.isArray(sexualOrientation) && sexualOrientation.length > 0) {
              const userOrientation = user.sexualOrientation?.toLowerCase() || '';
              if (sexualOrientation.some(so => userOrientation.includes(so.toLowerCase()))) matchCount++;
            }

            if (location && location.trim().length > 0) {
              const userLocation = user.location?.toLowerCase() || '';
              if (userLocation.includes(location.toLowerCase())) matchCount++;
            }

            return matchCount >= 2;
          });

          return res.json(matchingUsers.map(user => ({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            age: user.age,
            ethnicity: user.ethnicity,
            interests: user.interests,
            objectives: user.objectives,
            bio: user.bio
          })));
        }

        default:
          where = {
            [Op.and]: [
              { id: { [Op.ne]: parsedUserId } },
              ...filters
            ]
          };
      }
    }

    const filteredUsers = await User.findAll({
      where,
      attributes: ['id', 'username', 'firstName', 'age', 'ethnicity', 'interests', 'objectives', 'bio']
    });

    return res.json(filteredUsers);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/filter-results/reset
// Clear filtered connection results
router.post('/reset', requireAuth, async (req, res) => {
  const { userId } = req.body;
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    const user = await User.findByPk(parsedUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json([]);
  } catch (err) {
    console.error('Error resetting filter results:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;