const express = require('express');
const groupController = require('../controllers/groupController');

const router = express.Router();

router.get('', groupController.groupIndex);
router.get('/create', groupController.groupCreateGet);
router.post('/', groupController.groupCreatePost);
router.get('/update/:id', groupController.groupUpdateGet);
router.post('/update/:id', groupController.groupUpdatePost);
router.get('/delete/:id', groupController.groupDeleteGet);
router.post('/delete/:id', groupController.groupDeletePost);

module.exports = router;
