const express = require('express');
const expectationController = require('../controllers/expectationController');

const router = express.Router();

router.get('', expectationController.expectationIndex);
router.get('/create', expectationController.expectationCreateGet);
router.post('/', expectationController.expectationCreatePost);
router.get('/update/:id', expectationController.expectationUpdateGet);
router.post('/update/:id', expectationController.expectationUpdatePost);
router.get('/delete/:id', expectationController.expectationDeleteGet);
router.post('/delete/:id', expectationController.expectationDeletePost);

module.exports = router;