const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const CustomerController = require(`${userController}/v1/CustomerController`)



/**
* @api {get} /api/user/v1/customer/list get customers 
* @apiVersion 1.0.0
* @apiName getCustomers
* @apiDescription get customers . respnse description: by "order" field we meant order length, "lastBuy" is the date of the customer last buy,and "total" is the total price of all customer orders. all params are necessary and in case of no entry , there is a flag in parantheses for each param.if that flag entered it asumed as no entry
* @apiGroup customer
* @apiParam {varchar} family customer family (" ")
* @apiParam {varchar} mobile customer mobile ("0")
* @apiParam {varchar} createdAtFrom customer membership from this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} createdAtTo customer membership until this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} lastBuyFrom customer last buy from this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} lastBuyTo customer last buy until this date ("1900-01-01T05:42:13.845Z")
* @apiParam {int} orderFrom minimum number of orders ("0")
* @apiParam {int} orderTo maximum number of orders ("0")
* @apiParam {varchar} totalFrom minimum total price of all orders of customer ("0")
* @apiParam {varchar} totalTo maximum total price of all orders of customer ("0")
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "اطلاعات مشتریان با موفقیت ارسال شد",
*      data: [...{
*          active: true,
*          family: "مصطفایی",
*          mobile: "09625846122",
*          birthday: "1990-12-18T23:59:00.798Z",
*          createdAt: "2010-12-18T23:59:00.798Z",
*          order: 4,
*          lastBy: "2021-12-18T23:59:00.798Z",
*          total: 270000
*       }]
* }
*/
router.get('/list/:family/:mobile/:createdAtFrom/:createdAtTo/:lastBuyFrom/:lastBuyTo/:orderFrom/:orderTo/:totalFrom/:totalTo/:orderStatus', CustomerController.getCustomers.bind(CustomerController));

/**
* @api {get} /api/user/v1/customer/excel get excel customers 
* @apiVersion 1.0.0
* @apiName getExcelCustomers
* @apiDescription get Excel customers . respnse description: by "order" field we meant order length, "lastBuy" is the date of the customer last buy,and "total" is the total price of all customer orders. all params are necessary and in case of no entry , there is a flag in parantheses for each param.if that flag entered it asumed as no entry
* @apiGroup customer
* @apiParam {varchar} family customer family (" ")
* @apiParam {varchar} mobile customer mobile ("0")
* @apiParam {varchar} createdAtFrom customer membership from this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} createdAtTo customer membership until this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} lastBuyFrom customer last buy from this date ("1900-01-01T05:42:13.845Z")
* @apiParam {varchar} lastBuyTo customer last buy until this date ("1900-01-01T05:42:13.845Z")
* @apiParam {int} orderFrom minimum number of orders ("0")
* @apiParam {int} orderTo maximum number of orders ("0")
* @apiParam {varchar} totalFrom minimum total price of all orders of customer ("0")
* @apiParam {varchar} totalTo maximum total price of all orders of customer ("0")
*/
router.get('/excel/:family/:mobile/:createdAtFrom/:createdAtTo/:lastBuyFrom/:lastBuyTo/:orderFrom/:orderTo/:totalFrom/:totalTo', CustomerController.getExcelCustomers.bind(CustomerController));

/**
 * @api {get} /api/user/v1/customer get customer
 * @apiVersion 1.0.0
 * @apiName getCustomer
 * @apiDescription get customer .It gives you the customer or seller information of the phone number you sent , if there is no customer or no seller with that phone number it sends false instead of customer or seller information
 * @apiGroup customer
 * @apiParam {Number} phoneNumber customer or seller phone number 
 * @apiSuccessExample {json} Success-Response 1 :
 * {
 *      success: true,
 *      message: "اطلاعات با موفقیت ارسال شد",
 *      data: {
 *          customer: {
 *              _id: "617925b1c601dd6ba7185fa7"
 *              family: "مصطفایی",
 *              mobile: "09625846122",
 *              phoneNumber: "09625846122",
 *              lastAddress: "کلاهدوز ۴"
 *          },
 *          seller: {
 *              _id: "6188d4ff675723337cff3d09"
 *              family: "رضایی",
 *              mobile: "09307580121"
 *          }
 *       }
 * }
 * @apiSuccessExample {json} Success-Response 2 :
 * {
 *      success: true,
 *      message: "اطلاعات با موفقیت ارسال شد",
 *      data: {
 *          customer: {
 *              _id: "617925b1c601dd6ba7185fa7"
 *              family: "مصطفایی",
 *              mobile: "09625846122",
 *              phoneNumber: "09625846122",
 *              lastAddress: "کلاهدوز ۴"
 *          },
 *          seller: false
 *       }
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: true,
 *      message: "اطلاعاتی موجود نیست",
 *      data: { status: false }
 * }
 */
router.get("/:phoneNumber", CustomerController.getCustomer.bind(CustomerController));




module.exports = router;