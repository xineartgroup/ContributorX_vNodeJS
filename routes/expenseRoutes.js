const express = require('express');
const expenseController = require('../controllers/expenseController');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('', expenseController.expenseIndex);
router.get('/create', expenseController.expenseCreateGet);
router.post('/', upload.single("PaymentReciept"), expenseController.expenseCreatePost);
router.get('/update/:id', expenseController.expenseUpdateGet);
router.post('/update/:id', upload.single("PaymentReciept"), expenseController.expenseUpdatePost);
router.get('/delete/:id', expenseController.expenseDeleteGet);
router.post('/delete/:id', expenseController.expenseDeletePost);

module.exports = router;