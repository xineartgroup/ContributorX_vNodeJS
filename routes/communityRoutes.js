const express = require('express');
const communityController = require('../controllers/communityController');

const router = express.Router();

router.get('', communityController.communityIndex);
router.get('/create', communityController.communityCreateGet);
router.post('/', communityController.communityCreatePost);
router.get('/update/:id', communityController.communityUpdateGet);
router.post('/update/:id', communityController.communityUpdatePost);
router.get('/delete/:id', communityController.communityDeleteGet);
router.post('/delete/:id', communityController.communityDeletePost);

module.exports = router;
