const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const SellerController = require(`${userController}/v1/SellerController`)



/**
 * @api {post} /api/user/v1/product/ add product
 * @apiVersion 1.0.0
 * @apiName addProduct
 * @apiDescription add product.all params are necessary and in case of no entry , there is a flag in parantheses for each optional param.if that flag entered it asumed as no entry
 * @apiGroup product
 * @apiParam  {varchar} name product name
 * @apiParam  {varchar} sellingPrice product selling price
 * @apiParam  {varachar} description description of product (" ")
 * @apiParam  {Boolean} checkWareHouse product checkWareHouse
 * @apiParam  {Boolean} direct direct
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
 router.post("/", SellerController.addSeller.bind(SellerController));





module.exports = router;