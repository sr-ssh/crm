const express = require("express");
const router = express.Router();

// controllers
const { user: userController } = config.path.controllers;

const ReminderController = require(`${userController}/v1/ReminderController`);

/**
 * @api {post} /api/user/v1/reminder add reminder
 * @apiVersion 1.0.0
 * @apiName addReminder
 * @apiDescription add Reminder: add reminder to remind what you need to.
 * @apiGroup reminder
 * @apiParam {varchar} title  title of the reminder
 * @apiParam {varchar} description  description of the reminder
 * @apiParam {varchar} date  date of reminder in ISO type. e.g  "2021-11-20T09:11:41.216Z"
 * @apiParam {Int} typeReminder  send TypeReminder to recognize what is reminder for. 0 -> personal, 1 -> lead, 2 -> order or saleOpportunity , 3 -> factor.
 * @apiParam {Int} [referenceId]  if TypeReminder was set to number between 1 to 3 it should be set too. otherwise it's optional
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "یادآوری با موفقیت ایجاد شد",
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *     success: true,
 *     message: "یادآوری ایجاد نشد",
 *     data : { success : false }
 * }
 */
router.post("/", ReminderController.addReminder.bind(ReminderController));

/**
 * @api {get} /api/user/v1/reminder get reminders
 * @apiVersion 1.0.0
 * @apiName getReminder
 * @apiDescription get Reminder: sends reminders of today.birthday of the customer may not be send because it's optional in the first place.
 * @apiGroup reminder
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "لیست یادآوری با موفقیت ارسال شد",
 *     data: {...[
 *          date: '2021-06-22T12:30:36.747Z',
 *          customer: {
 *              _id: '60d030e8716abd4c9428d373',
 *              family: 'شکوهی',
 *              mobile: '09307580142',
 *              birthday: '2021-05-31T05:42:13.845Z'
 *          },
 *          order: {
 *              _id: '60d3296cc29f9d1898abb62a',
 *              active: true,
 *              creadtedAt: '2021-06-23T12:30:36.679Z',
 *              customer: '60d030e8716abd4c9428d373',
 *              products:{...[
 *                  _id: '60b72a70e353f0385c2fe5af',
 *                  name: 'آیس لته',
 *                  quantity: 1,
 *                  sellingPrice: '30000'
 *              ]}
 *          }
 *      ]}
 * }
 */
router.get("/", ReminderController.getReminders.bind(ReminderController));

module.exports = router;
