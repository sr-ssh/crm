const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const StockController = require(`${userController}/v1/StockController`)


/**
 * @api {post} /api/user/v1/stock add stock 
 * @apiVersion 1.0.0
 * @apiName addStock
 * @apiDescription add stock.
 * @apiGroup stock
 * @apiParam  {varchar} name stock name
 * @apiParam  {varachar} [description] description of stock
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "ماده شما با موفقیت ثبت شد",
 *      data: { 
 *          status: true 
 *      }
 * }
 * @apiErrorExample {json} Error-Response:
 * { 
 *      success : true, 
 *      message : "ماده وارد شده، موجود است",
 *      data: { 
 *          status: false 
 *      }
 * }
 */
router.post('/', StockController.addStock.bind(StockController));


/**
* @api {post} /api/user/v1/product/excel get excel products 
* @apiVersion 1.0.0
* @apiName getExcelProducts
* @apiDescription get excel of all products
* @apiGroup product
* @apiErrorExample {json} Error-Response:
* { 
*      success : false, 
*      message : "متاسفانه فایل ایجاد نشد"
* }
*/
router.get('/excel', StockController.getExcelStock.bind(StockController));



/**
* @api {get} /api/user/v1/stock get stock 
* @apiVersion 1.0.0
* @apiName getStock
* @apiDescription get stock 
* @apiGroup stock
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "مواد خام با موفقیت ارسال شد",
*      data: [...{
*          active: true,
*          name: "روغن" ,
*          description: "خریداری شده از شرکت روغن سازان مشهد"
*          createdAt: "2021-06-01T06:54:01.691Z"
*      }]
* }
*/
router.get('/', StockController.getStock.bind(StockController));



/**
* @api {put} /api/user/v1/stock edit stock 
* @apiVersion 1.0.0
* @apiName editStock
* @apiDescription edit stock
* @apiGroup stock
* @apiParam {varchar} _id stock id
* @apiParam {varchar} active stock activity status
* @apiParam {varchar} name stock name
* @apiParam {varachar} [description] description of stock
* @apiSuccessExample {json} Success-Response:
* {
*       success: true,
*       message: "ماده شما با موفقیت ویرایش شد", 
        data: { 
            status: true 
        }
* }
* @apiErrorExample {json} Error-Response:
* { 
*       success : true, 
*       message : "ماده وارد شده، موجود نیست', 
        data: { 
            status: false 
        }
* }
*/
router.put('/', StockController.editStock.bind(StockController));



module.exports = router;