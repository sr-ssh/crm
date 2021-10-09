const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const SettingsController = require(`${userController}/v1/SettingsController`)



/**
 * @api {get} /api/user/v1/settings/order get Order Setting
 * @apiVersion 1.0.0
 * @apiName getOrderSetting
 * @apiDescription get setting order. setting sms & setting Share link
 * @apiGroup settings
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "تنظیمات با موفقیت ارسال شد",
 *      data: {}
 * }
 *     
 */
router.get('/order', SettingsController.getOrderSetting.bind(SettingsController));

/**
 * @api {put} /api/user/v1/settings/edit/order edit  order settings
 * @apiVersion 1.0.0
 * @apiName editOrderSetting
 * @apiDescription edit shareLinh order settings & sms setting order. for e.g time is 2 and unitTime is "M" it means shareLink will expire after 2 minutes.
 * @apiGroup settings
 * @apiParam {int} duration the link will expire after that base on unittime 
 * @apiParam {varchar} unitTime  "M" is minutes, "H" is hour, "D" is Day
 * @apiParamExample {json} Request-Example:
 *  {
 *   share: {
 *     time: "6",
 *     unitTime: "D",
 *   },
 *   preSms: {
 *     text: "سفارش شما با موفقیت ثبت شد. از اینکه مارا انتخاب کرده اید متشکریم",
 *     status: false,
 *   },
 *   postDeliverySms: {
 *     text: "",
 *     status: false,
 *   },
 *   postCustomerSms: {
 *     text: "سفارش شما به راننده تحویل داده شد",
 *     status: false,
 *   },
 * } 
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "تنظیمات با موفقیت ویرایش شد"
 */
router.put('/edit/order', SettingsController.editSettingOrder.bind(SettingsController));


module.exports = router;