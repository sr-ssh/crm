const express = require('express');
const { reset } = require('nodemon');
const router = express.Router();
// controllers 
const { user: userController } = config.path.controllers;

const ProductController = require(`${userController}/v1/ProductController`)
const uploadFile = require('../../middleware/storeExcelConfig');


/**
 * @api {post} /api/user/v1/product/ add product 
 * @apiVersion 1.0.0
 * @apiName addProduct
 * @apiDescription add product.all params are necessary and in case of no entry , there is a flag in parantheses for each optional param.if that flag entered it asumed as no entry
 * @apiGroup product
 * @apiParam  {varchar} name product name
 * @apiParam  {varchar} sellingPrice product selling price
 * @apiParam  {varachar} description description of product (" ")
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "محصول شما با موفقیت ثبت شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * { 
 *      success : false, 
 *      message : "محصول وارد شده، موجود است"
 * }
 */
router.post('/', ProductController.addProduct.bind(ProductController));


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
router.get('/excel', ProductController.getExcelProducts.bind(ProductController));



/**
* @api {get} /api/user/v1/product/ get products 
* @apiVersion 1.0.0
* @apiName getProducts
* @apiDescription get products 
* @apiGroup product
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "محصولات با موفقیت ارسال شد",
*      data: [...{
*          active: true,
*          name: "روغن" ,
*          sellingPrice: "100000",
*          description: "خریداری شده از شرکت روغن سازان مشهد"
*          createdAt: "2021-06-01T06:54:01.691Z"
*      }]
* }
*/
router.get('/', ProductController.getProducts.bind(ProductController));



/**
* @api {put} /api/user/v1/product/ edit product 
* @apiVersion 1.0.0
* @apiName editProduct
* @apiDescription edit product: all params must be sent even if they don't have any changes.all params are necessary and in case of no entry , there is a flag in parantheses for each optional param.if that flag entered it asumed as no entry
* @apiGroup product
* @apiParam {varchar} _id product id
* @apiParam {varchar} active product activity status
* @apiParam {varchar} name product name
* @apiParam {varchar} sellingPrice product selling price
* @apiParam {varachar} description description of product (" ")
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "محصول شما با موفقیت ویرایش شد"
* }
* @apiErrorExample {json} Error-Response:
* { 
*      success : false, 
*      message : "محصول وارد شده، موجود نیست"
* }
*/
router.put('/', ProductController.editProduct.bind(ProductController));


/**
* @api {put} /api/user/v1/product/uploadExcel upload excel product  
* @apiVersion 1.0.0
* @apiName uplaodExcelProduct
* @apiDescription upload file excel that contains your list of product 
* @apiGroup product
* @apiParam {excel} excel excel file 
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "محصولات با موفقیت ویرایش شد"
* }
* @apiErrorExample {json} Error-Response:
* { 
*      success : false, 
*      message : "خطا در پردازش فایل"
* }
*/
router.post('/uploadExcel', uploadFile, ProductController.uploadExcel.bind(ProductController));


module.exports = router;