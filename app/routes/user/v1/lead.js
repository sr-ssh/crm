const express = require('express');
const { reset } = require('nodemon');
const router = express.Router();
// controllers 
const { user: userController } = config.path.controllers;

const LeadController = require(`${userController}/v1/LeadController`)


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


module.exports = router;