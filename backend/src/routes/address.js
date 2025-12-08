const express = require('express');
const { getAddresses, addAddress, deleteAddress } = require('../controllers/addressController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAddresses);
router.post('/', addAddress);
router.delete('/:id', deleteAddress);

module.exports = router;

