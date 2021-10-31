const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const ReceiptController = require(`${userController}/v1/ReceiptController`)



/**
 * @api {post} /api/user/v1/receipt add receipt 
 * @apiVersion 1.1.0
 * @apiName addReceipt
 * @apiDescription add order: customer companyname, notes , birthday and reminder are optional.all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.birthday flag is "1900-01-01T05:42:13.845Z".reminder flag and duration flag are -1.address flag is " ". for set order to sale opprotunity send status 3 otherwise don't send status.
 * @apiGroup receipt
 * @apiParam {Object[]} stock supplier stock
 * @apiParam {Object} note receipt note
 * @apiParam {Object} supplier supplier information
 * @apiParam {varchar} address receipt address
 * @apiParamExample {json} Request-Example:
 *  {
 *     stock: [...{
 *          _id: "60b72a70e353f0385c2fe5af",
 *          quantity: 2,
 *          sellingPrice: "30000"
 *      }],
 *     notes: {
 *          text: "شکر هفته دیگه شارژ میشه",
 *          createdAt : "2020-05-31T05:42:13.845Z",
 *     },
 *     supplier: {
 *          family: "شکوهی",
 *          mobile: "09307580142",
 *          company: "تیم ایکس"
 *      },
 *      address: "معلم 24"
 *  }
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "فاکتور شما با موفقیت ثبت شد"
 * }
 */
router.post('/', ReceiptController.addReceipt.bind(ReceiptController));



/**
* @api {post} /api/user/v1/order/confirm/shop confirmation shop 
* @apiVersion 1.0.0
* @apiName confirmShop
* @apiDescription shop confirmation of the receipt. for 'status' enter 1 for approving and 2 for dening
* @apiGroup receipt
* @apiParam {varchar} receiptId receiptId
* @apiParam {varchar} status receipt status [1, 2]
* @apiSuccessExample {json} Success-Response:
* {
*       success: true,
*       message: "فاکتور تایید خرید شد",
        data: {
            status: true
        }
* }
* @apiErrorExample {json} Error-Response:
* {
*       success: true,
*       message: "خطا در تایید خرید فاکتور",
        data: {
            status: false
        }
* }
*/
router.post('/confirm/shop', ReceiptController.confirmShop.bind(ReceiptController));



/**
* @api {put} /api/user/v1/receipt/note/status edit note status
* @apiVersion 1.0.0
* @apiName editStatusNotes
* @apiDescription edit note status, in status : send 0 to public note, send 1 to private the note
* @apiGroup receipt
* @apiParam {int} status note privacy status
* @apiParam {String} receiptId receipt id
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "وضعیت یادداشت با موفقیت ویرایش شد"
* }
*/
router.put('/note/status', ReceiptController.editStatusNotes.bind(ReceiptController));




/**
* @api {get} /api/user/v1/receipt  get receipts
* @apiVersion 1.0.0
* @apiName getReceipts
* @apiDescription get receipts : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
* @apiGroup receipt
* @apiParam {varchar} supplierName supplier family (" ")
* @apiParam {varchar} supplierMobile supplier mobile number ("0")
* @apiParam {varchar} startDate get receipt from this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} endDate get receipt to this date ("1900-01-01T05:42:13.845Z")
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "فاکتور ها با موفقیت ارسال شد",
*      data: [...{
*          active: true,
*          id: "60b72a70e353f0385c2fe5af",
*          products: [...{
*              _id: "60b72a70e353f0385c2fe5af",
*              name: "لاته",
*              quantity: 2,
*              sellingPrice: "30000"
*          }],
*          customer: {
*              _id: "7465148754878",
*              family: "مصطفایی",
*              mobile: "09152631225",
*              createdAt: "2021-06-01T06:54:01.691Z"
*          },
*         createdAt: "2021-06-01T06:54:01.691Z",
*         updatedAt: "2021-06-01T06:54:01.691Z"
*      }]
* }
*/
router.get('/:supplierName/:supplierMobile/:startDate/:endDate', ReceiptController.getReceipts.bind(ReceiptController));



/**
* @api {put} /api/user/v1/receipt/status edit receipt status
* @apiVersion 1.0.0
* @apiName editReceiptStatus
* @apiDescription edit receipt status, in status : send 0 for normal receipt , send 2 to cancele the receipt
* @apiGroup receipt
* @apiParam {int} status receipt status
* @apiParam {varchar} receiptId receipt id
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "وضعیت فاکتور با موفقیت ویرایش شد"
* }
*/
router.put('/status', ReceiptController.editReceiptStatus.bind(ReceiptController));

/**
* @api {put} /api/user/v1/receipt/edit edit receipt 
* @apiVersion 1.0.0
* @apiName editReceipt 
* @apiDescription edit receipt  
* @apiGroup receipt
* @apiParam {varchar} receiptId receipt id
* @apiParam {Object[]} stocks array of stocks objects 
* @apiParam {varchar} address supplier address receipt
* @apiParamExample {json} Request-Example:
*  {
*    receiptId : "60f2c37d4ca7f01d68ad6daf",
*      stocks: [...{
*          _id: "60b72a70e353f0385c2fe5af",
*          quantity: 2,
*          price: "30000"
*      }],
*      address: "معلم 24"
*  }
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "فاکتور با موفقیت ویرایش شد"
* }
* @apiErrorExample {json} Error-Response:
* {
*      success: false,
*      message: "فاکتور موجود نیست"
* }
*/
router.put('/edit', ReceiptController.editReceipt.bind(ReceiptController));


module.exports = router;