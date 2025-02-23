const express = require('express');
const expenseController = require('../controllers/expenseController');
const router = express.Router();

router.get('', expenseController.expenseIndex);
router.get('/create', expenseController.expenseCreateGet);
router.post('/', expenseController.expenseCreatePost);
router.get('/update/:id', expenseController.expenseUpdateGet);
router.post('/update/:id', expenseController.expenseUpdatePost);
router.get('/delete/:id', expenseController.expenseDeleteGet);
router.post('/delete/:id', expenseController.expenseDeletePost);

module.exports = router;