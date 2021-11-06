const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const SellerController = require(`${userController}/v1/SellerController`)



/**
 * @api {post} /api/user/v1/seller/ add seller
 * @apiVersion 1.0.0
 * @apiName addSeller
 * @apiDescription add seller
 * @apiGroup seller
 * @apiParam  {Number} phone seller phone
 * @apiParam  {Number} mobile seller mobile
 * @apiParam  {String} family seller family
 * @apiParam  {String} company seller company
 * @apiParam  {Number} cardNumber seller cardNumber
 * @apiParam  {String} address seller address
 * @apiParam  {String} [description] seller description
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "فروشنده با موفقیت ثبت شد",
 *      data: {}
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success : true,
 *      message : "فروشنده ای با این تلفن موجود است",
 *      data: { status: false }
 * }
 */
 router.post("/", SellerController.addSeller.bind(SellerController));




 /**
* @api {get} /api/user/v1/seller/:mobile get seller
* @apiVersion 1.0.0
* @apiName getSeller
* @apiDescription get seller. all params are necessary and in case of no entry , there is a flag in parantheses for each param.if that flag entered it asumed as no entry
* @apiGroup seller
* @apiParam {Number} mobile seller mobile (" ")
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "فرشنده ها با موفقیت ارسال شد",
*      data: {
*          _id: '6183e3b0ea6d46d4bc8de170', 
*          family: 'سارا بنی اسدی', 
*          phone: '36041849', 
*          mobile: '09307580142', 
*          company: 'هتل ابان',
*          address: "بلوار پیروزی.بین پیروزی ۶۲و ۶۴",
*          cardNumber: 5846253665328596,
*          description: "استقبال شدید شد",
*       }
* }
*/
router.get(
    "/:mobile",
    SellerController.getSeller.bind(SellerController)
  );




/**
* @api {get} /api/user/v1/seller/:company/:phone/:mobile/:address get sellers 
* @apiVersion 1.0.0
* @apiName getSellers
* @apiDescription get sellers. all params are necessary and in case of no entry , there is a flag in parantheses for each param.if that flag entered it asumed as no entry
* @apiGroup seller
* @apiParam {String} company seller company (" ")
* @apiParam {Number} phone seller phone (" ")
* @apiParam {Number} mobile seller mobile (" ")
* @apiParam {String} address seller address (" ")
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "فرشنده ها با موفقیت ارسال شد",
*      data: [...{
*          _id: '6183e3b0ea6d46d4bc8de170', 
*          family: 'سارا بنی اسدی', 
*          phone: '36041849', 
*          mobile: '09307580142', 
*          company: 'هتل ابان',
*          address: "بلوار پیروزی.بین پیروزی ۶۲و ۶۴",
*          cardNumber: 5846253665328596,
*          description: "استقبال شدید شد",
*          marketer: {
                _id: "61614c019128741180e6e58f", 
                family: "ریحانه شکوهی"
            }
*       }]
* }
*/
router.get(
  "/:company/:phone/:mobile/:address",
  SellerController.getSellers.bind(SellerController)
);





module.exports = router;