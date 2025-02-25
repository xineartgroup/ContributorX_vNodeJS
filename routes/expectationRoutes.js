const express = require('express');
const expectationController = require('../controllers/expectationController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('', expectationController.expectationIndex);
router.get('/create', expectationController.expectationCreateGet);
router.post('/', expectationController.expectationCreatePost);
router.get('/update/:id', expectationController.expectationUpdateGet);
router.post('/update/:id', expectationController.expectationUpdatePost);
router.get('/delete/:id', expectationController.expectationDeleteGet);
router.post('/delete/:id', expectationController.expectationDeletePost);
router.get('/payment/:id', expectationController.expectationPaymentGet);
router.post('/payment/:id', upload.single("PaymentReciept"), expectationController.expectationPaymentPost);
router.get('/paymentApproval/:id', expectationController.paymentApproval);
router.get('/paymentapprove/:id', expectationController.paymentApprove);
router.get('/paymentreject/:id', expectationController.paymentReject);
router.get('/paymentWriteOff/:id', expectationController.paymentWriteOff);

module.exports = router;