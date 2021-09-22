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
* @apiDescription shop confirmation of the receipt
* @apiGroup receipt
* @apiParam {varchar} receiptId receiptId
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



// /**
// * @api {get} /api/user/v1/order/ get orders 
// * @apiVersion 1.0.0
// * @apiName getOrders
// * @apiDescription get orders : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
// * @apiGroup order
// * @apiParam {varchar} customerName customer family (" ")
// * @apiParam {varchar} customerMobile customer mobile number ("0")
// * @apiParam {varchar} startDate get orders from this date ("1900-01-01T05:42:13.845Z")
// * @apiParam {varchar} endDate get orders to this date ("1900-01-01T05:42:13.845Z")
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "سفارشات با موفقیت ارسال شد",
// *      data: [...{
// *          active: true,
// *          id: "60b72a70e353f0385c2fe5af",
// *          products: [...{
// *              _id: "60b72a70e353f0385c2fe5af",
// *              name: "لاته",
// *              quantity: 2,
// *              sellingPrice: "30000"
// *          }],
// *          customer: {
// *              _id: "7465148754878",
// *              family: "مصطفایی",
// *              mobile: "09152631225",
// *              createdAt: "2021-06-01T06:54:01.691Z"
// *          },
// *         createdAt: "2021-06-01T06:54:01.691Z",
// *         updatedAt: "2021-06-01T06:54:01.691Z"
// *      }]
// * }
// */
// router.get('/:customerName/:customerMobile/:startDate/:endDate', ReceiptController.getOrders.bind(ReceiptController));


// /**
// * @api {get} /api/user/v1/order/v1 get orders 
// * @apiVersion 1.1.0
// * @apiName getOrders
// * @apiDescription get orders : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
// * @apiGroup order
// * @apiParam {varchar} orderStatus get order or set status 3 to get order sale opprotunity
// * @apiParam {varchar} customerName customer family (" ")
// * @apiParam {varchar} customerMobile customer mobile number ("0")
// * @apiParam {varchar} startDate get orders from this date ("1900-01-01T05:42:13.845Z")
// * @apiParam {varchar} endDate get orders to this date ("1900-01-01T05:42:13.845Z")
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "سفارشات با موفقیت ارسال شد",
// *      data: [...{
// *          active: true,
// *          id: "60b72a70e353f0385c2fe5af",
// *          products: [...{
// *              _id: "60b72a70e353f0385c2fe5af",
// *              name: "لاته",
// *              quantity: 2,
// *              sellingPrice: "30000"
// *          }],
// *          customer: {
// *              _id: "7465148754878",
// *              family: "مصطفایی",
// *              mobile: "09152631225",
// *              createdAt: "2021-06-01T06:54:01.691Z"
// *          },
// *         createdAt: "2021-06-01T06:54:01.691Z",
// *         updatedAt: "2021-06-01T06:54:01.691Z"
// *      }]
// * }
// */
// router.get('/v1/:status/:customerName/:customerMobile/:startDate/:endDate', ReceiptController.getOrdersV1.bind(ReceiptController));



// /**
// * @api {put} /api/user/v1/order/status edit order status
// * @apiVersion 1.0.0
// * @apiName editOrderStatus
// * @apiDescription edit order status, in status : send 0 for normal order , send 2 to cancele the order
// * @apiGroup order
// * @apiParam {int} status order status
// * @apiParam {varchar} orderId order id
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "وضعیت سفارش با موفقیت ویرایش شد"
// * }
// */
// router.put('/status', ReceiptController.editOrderStatus.bind(ReceiptController));



// /**
// * @api {put} /api/user/v1/order/price edit order price
// * @apiVersion 1.0.0
// * @apiName editOrderPrice
// * @apiDescription edit order price of one of it's products
// * @apiGroup order
// * @apiParam {int} status order status
// * @apiParam {varchar} orderId order id
// * @apiParam {varchar} productId product id
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "قیمت سفارش با موفقیت ویرایش شد"
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "سفارش موجود نیست"
// * }
// */
// router.put('/product/price', ReceiptController.editOrderPrice.bind(ReceiptController));



// /**
// * @api {put} /api/user/v1/order/price edit order quantity
// * @apiVersion 1.0.0
// * @apiName editOrderQuantity
// * @apiDescription edit order quantity of one of it's products
// * @apiGroup order
// * @apiParam {int} status order status
// * @apiParam {varchar} orderId order id
// * @apiParam {varchar} productId product id
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "تعداد سفارش با موفقیت ویرایش شد"
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "سفارش موجود نیست"
// * }
// */
// router.put('/product/quantity', ReceiptController.editOrderQuantity.bind(ReceiptController));

// /**
// * @api {delete} /api/user/v1/order/ delete order 
// * @apiVersion 1.0.0
// * @apiName deleteOrder
// * @apiDescription delete order product
// * @apiGroup order
// * @apiParam {varchar} orderId order id
// * @apiParam {varchar} productId product id
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "سفارش با موفقیت حذف شد"
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "سفارش موجود نیست"
// * }
// */
// router.delete('/product', ReceiptController.deleteProdcutOrder.bind(ReceiptController));

// /**
// * @api {put} /api/user/v1/order/ edit product order 
// * @apiVersion 1.0.0
// * @apiName editeProductOrder
// * @apiDescription edit product order 
// * @apiGroup order
// * @apiParam {varchar} orderId order id
// * @apiParam {varchar} productId product id
// * @apiParam {Object[]} products array of product objects 
// * @apiParam {varchar} address user address order
// * @apiParamExample {json} Request-Example:
// *  {
// *    orderId : "60f2c37d4ca7f01d68ad6daf",
// *      products: [...{
// *          _id: "60b72a70e353f0385c2fe5af",
// *          quantity: 2,
// *          sellingPrice: "30000"
// *      }],
// *      address: "معلم 24"
// *  }
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "سفارش با موفقیت ویرایش شد"
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "سفارش موجود نیست"
// * }
// */
// router.put('/product', ReceiptController.editProductOrder.bind(ReceiptController));


// /**
// * @api {get} /api/user/v1/order/notes get notes of order 
// * @apiVersion 1.0.0
// * @apiName getNotes
// * @apiDescription get notes : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
// * @apiGroup order
// * @apiParam {varchar} orderId  orderId to get that order's notes
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "یادداشت ها با موفقیت ارسال شد",
// *      data: {    
// *         isPrivate : true,
// *         data:[...{
// *            text: "خواستار همکاری های بیشتر بود فقط کمی با قیمت مشکل داشت",
// *            writtenBy: "محمد جواد حیدری",
// *            createdAt: "2021-06-01T06:54:01.691Z"
// *         }]
// *      }
// * }
// */
// router.get('/notes/:orderId', ReceiptController.getOrdersNotes.bind(ReceiptController));


// /**
// * @api {put} /api/user/v1/order/notes add Notes to order 
// * @apiVersion 1.0.0
// * @apiName addNotes
// * @apiDescription add notes : all params are necessary.
// * @apiGroup order
// * @apiParam {varchar} orderId  orderId
// * @apiParam {Object} notes notes information
// * @apiParamExample {json} Request-Example:
// *  {
// *     orderId : "60b72a70e353f0385c2fe5af",
// *     notes: [...{
// *          text: "مشتری خواهان کالاست",
// *          createdAt : "2020-05-31T05:42:13.845Z",
// *     }]
// *  }
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "یادداشت با موفقیت اضافه شد",
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "سفارش موجود نیست"
// * }
// */
// router.put('/notes', ReceiptController.addOrdersNotes.bind(ReceiptController));


// /**
// * @api {put} /api/user/v1/order/notes/status edit status notes 
// * @apiVersion 1.0.0
// * @apiName editstatusnotes
// * @apiDescription edit status notes : all params are necessary.
// * @apiGroup order
// * @apiParam {varchar} orderId  orderId
// * @apiParam {varchar} status  status Should be '0' as false Or '1' as true 
// * @apiParamExample {json} Request-Example:
// *  {
// *     orderId : "60b72a70e353f0385c2fe5af",
// *     status : 1
// *  }
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "یادداشت با موفقیت ویرایش شد",
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "یادداشت موجود نیست"
// * }
// */
// router.put('/notes/status', ReceiptController.editStatusNotes.bind(ReceiptController));



// /**
//  * @api {post} /api/user/v1/order/delivery/sms send delivery sms
//  * @apiVersion 1.0.0
//  * @apiName sendDeliverySms
//  * @apiDescription send delivery sms, 
//  * @apiGroup order
//  * @apiParam {varchar} mobile delivery mobile
//  * @apiParam {varchar} orderId order id
//  * @apiSuccessExample {json} Success-Response:
//  * {
//  *      success: true,
//  *      message: "وضعیت سفارش با موفقیت ویرایش شد"
//  */
// router.post('/delivery/sms', ReceiptController.sendDeliverySms.bind(ReceiptController));



// /**
//  * @api {get} /api/user/v1/order/details/orderId/keylink get orderDetails
//  * @apiVersion 1.0.0
//  * @apiName getOrderDetails
//  * @apiDescription get order details, 
//  * @apiGroup order
//  * @apiParam {varchar} orderId order id
//  * @apiSuccessExample {json} Success-Response:
//  * {
//  *      success: true,
//  *      message: "فاکتور سفارش با موفقیت ارسال شد",
//  *      data: [...{
//  *          active: true,
//  *          id: "60b72a70e353f0385c2fe5af",
//  *          products: [...{
//  *              _id: "60b72a70e353f0385c2fe5af",
//  *              name: "لاته",
//  *              quantity: 2,
//  *              sellingPrice: "30000"
//  *          }],
//  *          customer: {
//  *              _id: "7465148754878",
//  *              family: "مصطفایی",
//  *              mobile: "09152631225",
//  *              createdAt: "2021-06-01T06:54:01.691Z"
//  *          },
//  *         createdAt: "2021-06-01T06:54:01.691Z",
//  *         updatedAt: "2021-06-01T06:54:01.691Z"
//  *      }]
//  * } 
//  */
// router.get('/details/:orderId/:keylink', ReceiptController.orderDetails.bind(ReceiptController));



// /**
// * @api {post} /api/user/v1/order/details/sharelink/orderId create share link
// * @apiVersion 1.0.0
// * @apiName createShareLink
// * @apiDescription create share link for order.
// * @apiGroup order
// * @apiParam {varchar} orderId  orderId
// * @apiSuccessExample {json} Success-Response:
// * {
// *      success: true,
// *      message: "لینک اشتراک گذاری با موفقیت ارسال شد",
// *      data:{
// *          orderId:"5435435435865419685",
// *          keyLink:"KTH7527AIC8QB"    
// *          } 
// * }
// * @apiErrorExample {json} Error-Response:
// * {
// *      success: false,
// *      message: "خطا در ایجاد لینک"
// * }
// */
// router.post('/details/sharelink', ReceiptController.createShareLink.bind(ReceiptController));



module.exports = router;