const express = require('express');
const { reset } = require('nodemon');
const router = express.Router();
// controllers 
const { user: userController } = config.path.controllers;
const uploadFile = require('../../middleware/storeExcelConfig');

const LeadController = require(`${userController}/v1/LeadController`)

/**
* @api {put} /api/user/v1/lead/excel upload excel product  
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
router.post('/excel', uploadFile, LeadController.uploadExcel.bind(LeadController));



/**
 * @api {post} /api/user/v1/lead add lead 
 * @apiVersion 1.0.0
 * @apiName addLead
 * @apiDescription add lead
 * @apiGroup lead
 * @apiParam  {String} family lead family
 * @apiParam  {String} mobile lead mobile
 * @apiParam  {String} [description] description of lead 
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سرنخ شما با موفقیت ثبت شد",
 *      data: { status: true }
 * }
 * @apiErrorExample {json} Error-Response:
 * { 
 *      success : true, 
 *      message : "سرنخ وارد شده، موجود است",
 *      data: { status: true }
 * }
 */
router.post('/', LeadController.addLead.bind(LeadController));




/**
* @api {get} /api/user/v1/lead get leads 
* @apiVersion 1.0.0
* @apiName getLeads
* @apiDescription get leads 
* @apiGroup lead
* @apiSuccessExample {json} Success-Response:
* {
*      success: true,
*      message: "سرنخ ها با موفقیت ارسال شد",
*      data: [...{
            _id: "61669d38a19885330ee5d7b2",
*           family: "ریحانه شکوهی" ,
*           mobile: "09307580142",
*           description: "از شرکت روغن سازان مشهد",
            accepted: true
*      }]
* }
*/
router.get('/', LeadController.getLeads.bind(LeadController));



/**
 * @api {post} /api/user/v1/lead add lead 
 * @apiVersion 1.0.0
 * @apiName addLead
 * @apiDescription add lead
 * @apiGroup lead
 * @apiParam  {String} family lead family
 * @apiParam  {String} mobile lead mobile
 * @apiParam  {String} [description] description of lead 
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "سرنخ شما با موفقیت ثبت شد",
 *      data: { status: true }
 * }
 * @apiErrorExample {json} Error-Response:
 * { 
 *      success : true, 
 *      message : "سرنخ وارد شده، موجود است",
 *      data: { status: true }
 * }
 */
 router.put('/', LeadController.editLeadStatus.bind(LeadController));




module.exports = router;