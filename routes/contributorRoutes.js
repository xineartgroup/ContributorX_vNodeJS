const express = require('express');
const contributorController = require('../controllers/contributorController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('', contributorController.contributorIndex);
router.get('/detail/:id', contributorController.contributorDetailGet);
router.post('/detail/:id', contributorController.contributorDetailPost);
router.get('/update/:id', contributorController.contributorUpdateGet);
router.post('/update/:id', upload.single("Picture"), contributorController.contributorUpdatePost);
router.post('/update1', contributorController.contributorUpdate1);
router.get('/create', upload.single("Picture"), contributorController.contributorCreateGet);
router.post('/', contributorController.contributorCreatePost);
router.get('/delete/:id', contributorController.contributorDeleteGet);
router.post('/delete/:id', contributorController.contributorDeletePost);

module.exports = router;