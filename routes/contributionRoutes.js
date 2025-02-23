const express = require('express');
const contributionController = require('../controllers/contributionController');
const router = express.Router();

router.get('', contributionController.contributionIndex);
router.get('/create', contributionController.contributionCreateGet);
router.post('/', contributionController.contributionCreatePost);
router.get('/update/:id', contributionController.contributionUpdateGet);
router.post('/update/:id', contributionController.contributionUpdatePost);
router.get('/delete/:id', contributionController.contributionDeleteGet);
router.post('/delete/:id', contributionController.contributionDeletePost);

module.exports = router;