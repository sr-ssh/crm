const express = require("express");
const upload = require("../../middleware/upload");
const router = express.Router();

// controllers
const { user: userController } = config.path.controllers;
const OrderController = require(`${userController}/v1/OrderController`);

//middlewares
const uploadMiddleware = require("../../middleware/upload");

/**
 * @api {post} /api/user/v1/order add order 
 * @apiVersion 1.1.0
 * @apiName addOrder
 * @apiDescription add order
 * @apiGroup order
 * @apiParam {Object[]} products array of product objects
 * @apiParam {Object[]} [notes] array of notes objects
 * @apiParam {Object} customer customer information
 * @apiParam {Object} [seller] seller information
 * @apiParam {int} [reminder] number of days for reminding
 * @apiParam {String} [duration] order duration in ISO type
 * @apiParam {String} [address] number of days for reminding
 * @apiParam {int} [mobile] customer guest mobile 
 * @apiParam {int} force it will be checked if there are a number of products in stock. if you do not want to be checked set force to 1. default 0.
 * @apiParamExample {json} Request-Example:
 *  {
 *      
        "force":1,
        "products": [
            {
            "_id": "6183d40ae31477609c9ae820",
            "name":"A4",
            "quantity": 3,
            "sellingPrice": "10000",
            "ingredients":[],
            "checkWareHouse":true
            },{
            "_id":"6181364e7bc0343e6ede593c",
            "name":"مداد رنگی",
            "quantity":1,
            "sellingPrice":"25000",
            "ingredients":[{"amount":1,"stock":{"amount":0,"_id":"618144e37bc0343e6ee1e45c"}}],
            "checkWareHouse":true
            }
        ],
        "notes": [...{
 *          text: "مشتری خواهان کالاست",
 *          createdAt : "2020-05-31T05:42:13.845Z",
 *     }],
        "customer": {
            "family": "محمد جواد حیدری",
            "phoneNumber": "05136045232",
            "company":"مجید"
        },
        "seller": {
            "family": "محمد جواد حیدری",
            "mobile": "05136045232"
        },
        "address": "معلم 24",
        "reminder": -1,
        "duration":"2021-11-08T07:28:50.413Z",
        "mobile": "09307580140"
 *  }
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارش شما با موفقیت ثبت شد"
 * }
 */
router.post("/", OrderController.addOrder.bind(OrderController));


/**
* @api {get} /api/user/v1/order/failurereasons get failure reasons
* @apiVersion 1.0.0
* @apiName getFailureReasons
* @apiDescription get failure reasons
* @apiGroup order
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "دلایل ناموفق فرصت فروش ارسال شد",
*      data: [...{
*         id: 1, 
*         text: "مشتری از قیمت کالا ناراضی بود"
*      }]
* }
*/
router.get(
  "/failurereasons",
  OrderController.getFailureReasons.bind(OrderController)
);

/**
 * @api {post} /api/user/v1/order/ add order
 * @apiVersion 1.0.0
 * @apiName addOrder
 * @apiDescription add order: customer birthday and reminder are optional.all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.birthday flag is "1900-01-01T05:42:13.845Z".reminder flag and duration flag are -1.address flag is " "
 * @apiGroup order
 * @apiParam {Object[]} products array of product objects
 * @apiParam {Object} customer customer information
 * @apiParam {int} reminder number of days for reminding
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارش شما با موفقیت ثبت شد"
 * }
 */
router.post("/push", OrderController.addOrderPush.bind(OrderController));

/**
 * @api {post} /api/user/v1/order/doc upload documents
 * @apiVersion 1.0.0
 * @apiName uploadDocuments
 * @apiDescription upload documents
 * @apiGroup order
 * @apiParam {varchar} orderId order id
 * @apiParam {varchar} fileName file name
 * @apiParam {varchar} file document file
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "مدرک اضافه شد",
 * }
 */
router.post(
  "/doc",
  upload.single("file"),
  OrderController.uploadDocuments.bind(OrderController)
);

/**
* @api {post} /api/user/v1/order/trackingcode add tracking code
* @apiVersion 1.0.0
* @apiName addTrackingCode
* @apiDescription add tracking code
* @apiGroup order
* @apiParam {String} orderId order id
* @apiParam {String} customerId customer id
* @apiParam {Number} trackingCode order tracking code
* @apiSuccessExample {json} Success-Response:
* {
*       success: true,
*       message: "کد پیگیری با موفقیت ثبت شد", 
        data: {}
* }
* @apiErrorExample {json} Error-Response:
* {
*       success: true,
*       message: "کد پیگیری تکراری است", 
        data: { staus: false }
* }
*/
router.post(
  "/trackingcode",
  OrderController.addTrackingCode.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/product edit product order
 * @apiVersion 1.0.0
 * @apiName editeProductOrder
 * @apiDescription edit product order
 * @apiGroup order
 * @apiParam {varchar} orderId order id
 * @apiParam {Object[]} products array of product objects
 * @apiParam {varchar} address user address order
 * @apiParam {varchar} companyName order company name
 * @apiParam {Number} [nationalCard] customer national ID card number
 * @apiParam {Number} [financialCode] customer financial code
 * @apiParam {Number} [postalCode] customer postal code
 * @apiParam {Number} [registerNo] customer register number
 * @apiParamExample {json} Request-Example:
 *  {
 *    orderId : "60f2c37d4ca7f01d68ad6daf",
 *      products: [...{
 *          _id: "60b72a70e353f0385c2fe5af",
 *          quantity: 2,
 *          sellingPrice: "30000"
 *      }],
 *      address: "معلم 24"
 *  }
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارش با موفقیت ویرایش شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "سفارش موجود نیست"
 * }
 */
router.put("/product", OrderController.editProductOrder.bind(OrderController));

/**
 * @api {put} /api/user/v1/order/status edit order status
 * @apiVersion 1.0.0
 * @apiName editOrderStatus
 * @apiDescription edit order status, in status : send 0 for normal order , send 2 to cancele the order
 * @apiGroup order
 * @apiParam {int} status order status
 * @apiParam {varchar} orderId order id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "وضعیت سفارش با موفقیت ویرایش شد"
 * }
 */
router.put("/status", OrderController.editOrderStatus.bind(OrderController));

/**
* @api {delete} /api/user/v1/order/opportunity  fail sale opportunity 
* @apiVersion 1.0.0
* @apiName failSaleOpportunity
* @apiDescription fail sale opportunity 
* @apiGroup order
* @apiParam {varchar} orderId order id
* @apiParam {Object} unsuccessfulReason order unsuccessful reason
* @apiParamExample {json} Request-Example:
*{
    "orderId": "618cd0068a6eb5e63801bd6e",
    "unsuccessfulReason": {
        "text": "شماره اشتباه",
        "id": 2
    }
}
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "وضعیت فرصت فروش با موفقیت ویرایش شد"
* }
*/
router.delete(
  "/opportunity",
  OrderController.failSaleOpportunity.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/notes add Notes to order
 * @apiVersion 1.0.0
 * @apiName addNotes
 * @apiDescription add notes : all params are necessary.
 * @apiGroup order
 * @apiParam {varchar} orderId  orderId
 * @apiParam {Object} notes notes information
 * @apiParamExample {json} Request-Example:
 *  {
 *     orderId : "60b72a70e353f0385c2fe5af",
 *     notes: [...{
 *          text: "مشتری خواهان کالاست",
 *          createdAt : "2020-05-31T05:42:13.845Z",
 *     }]
 *  }
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "یادداشت با موفقیت اضافه شد",
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "سفارش موجود نیست"
 * }
 */
router.put("/notes", OrderController.addOrdersNotes.bind(OrderController));

/**
 * @api {delete} /api/user/v1/order/ delete order
 * @apiVersion 1.0.0
 * @apiName deleteOrder
 * @apiDescription delete order product
 * @apiGroup order
 * @apiParam {varchar} orderId order id
 * @apiParam {varchar} productId product id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارش با موفقیت حذف شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "سفارش موجود نیست"
 * }
 */
router.delete(
  "/product",
  OrderController.deleteProdcutOrder.bind(OrderController)
);

/**
 * @api {post} /api/user/v1/order/delivery/sms send delivery sms
 * @apiVersion 1.0.0
 * @apiName sendDeliverySms
 * @apiDescription send delivery sms,
 * @apiGroup order
 * @apiParam {varchar} mobile delivery mobile
 * @apiParam {varchar} orderId order id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "وضعیت سفارش با موفقیت ویرایش شد"
 */
router.post(
  "/delivery/sms",
  OrderController.sendDeliverySms.bind(OrderController)
);

/**
 * @api {post} /api/user/v1/order/details/sharelink create share link
 * @apiVersion 1.0.0
 * @apiName createShareLink
 * @apiDescription create share link for order.
 * @apiGroup order
 * @apiParam {varchar} orderId  orderId
 * @apiParam {Int} type  invoice type. 0 -> formal , 1 -> informal
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "لینک اشتراک گذاری با موفقیت ارسال شد",
 *      data:{
 *          orderId:"5435435435865419685",
 *          keyLink:"KTH7527AIC8QB"
 *          }
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "خطا در ایجاد لینک"
 * }
 */
router.post(
  "/details/sharelink",
  OrderController.createShareLink.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/price edit order price
 * @apiVersion 1.0.0
 * @apiName editOrderPrice
 * @apiDescription edit order price of one of it's products
 * @apiGroup order
 * @apiParam {int} status order status
 * @apiParam {varchar} orderId order id
 * @apiParam {varchar} productId product id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "قیمت سفارش با موفقیت ویرایش شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "سفارش موجود نیست"
 * }
 */
router.put(
  "/product/price",
  OrderController.editOrderPrice.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/price edit order quantity
 * @apiVersion 1.0.0
 * @apiName editOrderQuantity
 * @apiDescription edit order quantity of one of it's products
 * @apiGroup order
 * @apiParam {int} status order status
 * @apiParam {varchar} orderId order id
 * @apiParam {varchar} productId product id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "تعداد سفارش با موفقیت ویرایش شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "سفارش موجود نیست"
 * }
 */
router.put(
  "/product/quantity",
  OrderController.editOrderQuantity.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/seller/status edit sale opportunity seler status
 * @apiVersion 1.0.0
 * @apiName editSaleOpportunitySellerStatus
 * @apiDescription edit ale opportunity seller status, in status : send 0 to free a sale opportunity, send 1 for getting a sale opportunity
 * @apiGroup order
 * @apiParam {int} status order status
 * @apiParam {varchar} orderId order id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "وضعیت سفارش با موفقیت ویرایش شد"
 * }
 */
router.put(
  "/seller/status",
  OrderController.editSaleOpportunitySellerStatus.bind(OrderController)
);

/**
 * @api {put} /api/user/v1/order/notes/status edit status notes
 * @apiVersion 1.0.0
 * @apiName editstatusnotes
 * @apiDescription edit status notes : all params are necessary.
 * @apiGroup order
 * @apiParam {varchar} orderId  orderId
 * @apiParam {varchar} status  status Should be '0' as false Or '1' as true
 * @apiParamExample {json} Request-Example:
 *  {
 *     orderId : "60b72a70e353f0385c2fe5af",
 *     status : 1
 *  }
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "یادداشت با موفقیت ویرایش شد",
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "یادداشت موجود نیست"
 * }
 */
router.put(
  "/notes/status",
  OrderController.editStatusNotes.bind(OrderController)
);

/**
* @api {post} /api/user/v1/order/financial/confirm  confirmation Financial 
* @apiVersion 1.0.0
* @apiName financialApproval
* @apiDescription Financial confirmation of the order.for 'status' enter 1 for approving and 2 for dening
* @apiGroup order
* @apiParam {varchar} orderId order id
* @apiParam {Number} status order confirm financial status [1, 2]
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "سفارش مورد تایید مالی قرار گرفت", 
    data: { status: true } 
* }
* @apiErrorExample {json} Error-Response:
* {
*      success: true,
*      message: "خطا در تایید مالی سفارش",
    data: { status: false } 
* }
*/
router.put(
  "/financial/confirm",
  OrderController.confirmFinancial.bind(OrderController)
);

/**
* @api {get} /api/user/v1/order/doc show documents
* @apiVersion 1.0.0
* @apiName showDocuments
* @apiDescription show documents
* @apiGroup order
* @apiParam {varchar} orderId order id
* @apiSuccessExample {json} Success-Response:
* {
*       success: true,
*       message: "مدارک سفارش با موفقیت فرستاده شد", 
        data: [...{
            name: چک 2, 
            key: , 
            location: , 
            size: 1120
        }]
* }
*/
router.get(
  "/doc/:orderId",
  upload.single("file"),
  OrderController.showDocuments.bind(OrderController)
);

/**
 * @api {get} /api/user/v1/order/notes get notes of order
 * @apiVersion 1.0.0
 * @apiName getNotes
 * @apiDescription get notes : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
 * @apiGroup order
 * @apiParam {varchar} orderId  orderId to get that order's notes
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "یادداشت ها با موفقیت ارسال شد",
 *      data: {
 *         isPrivate : true,
 *         data:[...{
 *            text: "خواستار همکاری های بیشتر بود فقط کمی با قیمت مشکل داشت",
 *            writtenBy: "محمد جواد حیدری",
 *            createdAt: "2021-06-01T06:54:01.691Z"
 *         }]
 *      }
 * }
 */
router.get(
  "/notes/:orderId",
  OrderController.getOrdersNotes.bind(OrderController)
);

/**
* @api {get} /api/user/v1/order/:type/:value support
* @apiVersion 1.0.0
* @apiName support
* @apiDescription support : each type is a kind of search: 
            1 -> customer number, 
            2 -> customer family, 
            3 -> company, 
            4 -> seller number, 
            5 -> seller family
* @apiGroup order
* @apiParam {Number} type search type [1, 2, 3, 4, 5]
* @apiParam {String} value search value
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "سفارشات با موفقیت ارسال شد",
*      data: [...{
*          active: true,
*          _id: "60b72a70e353f0385c2fe5af",
*          address: "خیابان احمداباد",
*          products: [...{
*              _id: "6183d40ae31477609c9ae820", 
*              name: "A4"
*              quantity: 2,
*              sellingPrice: "30000"
*          }],
*          customer: {
*              _id: "7465148754878",
*              family: "مصطفایی",
*              mobile: "09152631225",
*              phoneNumber: "09307580142",
*              company: "هتل رضوان"
*          },
*          financialApproval: {
*               status: 1, 
*               acceptedAt: "2021-11-08T12:46:34.702Z", 
*               acceptedBy: "ریحانه شکوهی" 
*           },
*          mobile: "09307580120",
*          notes: {
*               Notes: [...{
*                   text: "بدون انقضا", 
*                   createdAt: "2021-11-08T12:58:02.117Z", 
*                   writtenBy: "ریحانه شکوهی", 
*                   private: false
*               }], 
*               isPrivate: false
*          },
*          readyTime: "2021-11-16T07:42:00.000Z",
*          createdAt: "2021-06-01T06:54:01.691Z",
*          updatedAt: "2021-06-01T06:54:01.691Z",
*          seller: {
*               _id: "6188d4ff675723337cff3d09",
*               family: "رضایی", 
*               mobile: '09307580121"
*           },
*          sellers: [...{
*               id: {
*                   _id: "61614c019128741180e6e58f", 
*                   family: "ریحانه شکوهی"
*               }, 
*               active: true
*           }]
*           status: 0,
*           support: true
*      }]
* }
*/
router.get("/:type/:value", OrderController.support.bind(OrderController));

/**
 * @api {get} /api/user/v1/order/details/orderId/keylink get orderDetails
 * @apiVersion 1.0.0
 * @apiName getOrderDetails
 * @apiDescription get order details,
 * @apiGroup order
 * @apiParam {varchar} orderId order id
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "فاکتور سفارش با موفقیت ارسال شد",
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
router.get(
  "/details/:orderId/:keylink",
  OrderController.orderDetails.bind(OrderController)
);

/**
 * @api {get} /api/user/v1/order/ get orders
 * @apiVersion 1.0.0
 * @apiName getOrders
 * @apiDescription get orders : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
 * @apiGroup order
 * @apiParam {varchar} customerName customer family (" ")
 * @apiParam {varchar} customerMobile customer mobile number ("0")
 * @apiParam {varchar} startDate get orders from this date ("1900-01-01T05:42:13.845Z")
 * @apiParam {varchar} endDate get orders to this date ("1900-01-01T05:42:13.845Z")
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارشات با موفقیت ارسال شد",
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
router.get(
  "/:customerName/:customerMobile/:startDate/:endDate",
  OrderController.getOrders.bind(OrderController)
);

/**
 * @api {get} /api/user/v1/order/v1 get orders
 * @apiVersion 1.1.0
 * @apiName getOrders
 * @apiDescription get orders : all params are necessary and in case of no entry , there is a flag for each optional param.if that flag entered it asumed as no entry.
 * @apiGroup order
 * @apiParam {varchar} orderStatus get order or set status 3 to get order sale opprotunity
 * @apiParam {varchar} customerName customer family (" ")
 * @apiParam {varchar} customerMobile customer mobile number ("0")
 * @apiParam {varchar} startDate get orders from this date ("1900-01-01T05:42:13.845Z")
 * @apiParam {varchar} endDate get orders to this date ("1900-01-01T05:42:13.845Z")
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سفارشات با موفقیت ارسال شد",
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
router.get(
  "/:status/:customerName/:customerMobile/:startDate/:endDate",
  OrderController.getOrders.bind(OrderController)
);

module.exports = router;
