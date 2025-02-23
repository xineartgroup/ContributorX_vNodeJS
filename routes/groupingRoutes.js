const express = require('express');
const groupingController = require('../controllers/groupingController');

const router = express.Router();

router.get('', groupingController.groupingIndex);
router.get('/create', groupingController.groupingCreateGet);
router.post('/', groupingController.groupingCreatePost);
router.get('/update/:id', groupingController.groupingUpdateGet);
router.post('/update/:id', groupingController.groupingUpdatePost);
router.get('/delete/:id', groupingController.groupingDeleteGet);
router.post('/delete/:id', groupingController.groupingDeletePost);

module.exports = router;
