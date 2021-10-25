const express = require('express');
const router = express.Router();

// controllers 
const { user: userController } = config.path.controllers;

const EmployeeController = require(`${userController}/v1/EmployeeController`)



 /**
 * @api {post} /api/user/v1/employee add employee
 * @apiVersion 1.0.0
 * @apiName addEmployee
 * @apiDescription add employee
 * @apiGroup employee
 * @apiParam {varchar} usernameOrMobile employee username or mobile
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "کاربر با موفقیت اضافه شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *     success: false,
 *     message: "کاربر موجود نمی باشد"
 * }
 */
  router.post('/',EmployeeController.addEmployee.bind(EmployeeController)); 

  /**
 * @api {get} /api/user/v1/employee get employees
 * @apiVersion 1.0.0
 * @apiName getEmployees
 * @apiDescription get employees
 * @apiGroup employee
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "کارمندان با موفقیت فرستاده شدند"و
 *     data: [...{
 *          _id: '60d9ce1bef1e876eb29265cf',
 *          family: 'علی رضایی',
 *          mobile: '093012342',
 *          permission: [...{
 *              no: 1,
 *              status: true
 *          }]
 *      }]
 * }
 */
  router.get('/',EmployeeController.getEmployees.bind(EmployeeController)); 



  /**
 * @api {put} /api/user/v1/employee change employee permission
 * @apiVersion 1.0.0
 * @apiName changeEmployeePermission
 * @apiDescription change employee permission
 * @apiGroup employee
 * @apiParam {varchar} _id employee id
 * @apiParam {Number} voipNo employee voip number
 * @apiParam {object} permissions object exactly like it is sent
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "دسترسی های کارمند خواسته شده با موفقیت تغییر پیدا کرد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *     success: false,
 *     message: "دسترسی های کارمند خواسته شده با موفقیت تغییر پیدا نکرد"
 * }
 */
  router.put('/',EmployeeController.changeEmployeePermission.bind(EmployeeController)); 



   /**
 * @api {delete} /api/user/v1/employee remove employee
 * @apiVersion 1.0.0
 * @apiName removeEmployee
 * @apiDescription remove employee by id
 * @apiGroup employee
 * @apiParam {varchar} _id employee id
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "کارمند خواسته شده با موفقیت حذف شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *     success: false,
 *     message: "کارمند خواسته شده حذف نشد"
 * }
 */
  router.delete('/',EmployeeController.removeEmployee.bind(EmployeeController)); 


/**
 * @api {get} /api/user/v1/employee/permission get employees permissions
 * @apiVersion 1.0.0
 * @apiName getEmployeesPermission
 * @apiDescription get employees permission, employees only get the status part in response
 * @apiGroup employee
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "با موفقیت انجام شد",
 *     data: 
 *      {
 *         permission: { 
            addOrder: true,
            getOrders: true,
            reminder: true,
            getProducts: true,
            finance: true,
            getCustomers: true,
            getEmployees: true,
            getDiscounts: true
          },
        type: 1,
        status: 3
 * }
 */
  router.get('/permission',EmployeeController.getPermission.bind(EmployeeController)); 



  
/**
 * @api {get} /api/user/v1/employee/application get employees applications
 * @apiVersion 1.0.0
 * @apiName getApplications
 * @apiDescription get employees applications
 * @apiGroup employee
 * @apiSuccessExample {json} Success-Response:
 * {
 *     success: true,
 *     message: "ارسال درخواست ها با موفقیت انجام شد",
 *     data: 
 *      {
 *          "id": "60d9ce1bef1e876eb29265cf",
 *          "active": true,
 *          "status": 1,
 *          "employer": "60d9ce1bef1e876eb29278c4",
 *          "employee": {
 *              "_id": "",
 *              "family": "شکوهی",
 *              "mobile": "09307580142"
 *          },
 *          "createdAt": "2021-06-01T06:54:01.691Z",
 *          "updatedAt": "2021-06-01T06:54:01.691Z"
 * }
 */
 router.get('/application',EmployeeController.getApplications.bind(EmployeeController)); 


/**
 * @api {post} /api/user/v1/employee/application add application
 * @apiVersion 1.0.0
 * @apiName addApplication
 * @apiDescription add application
 * @apiGroup employee
 * @apiParam {varchar} mobile employer mobile
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "درخواست با موفقیت ویرایش شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "درخواستی موجود نیست"
 * }
 */
 router.post('/application',EmployeeController.addApplication.bind(EmployeeController));




/**
 * @api {put} /api/user/v1/employee/application edit employee application
 * @apiVersion 1.0.0
 * @apiName editApplication
 * @apiDescription edit employee application, in status : send 1 for in progress, 2 for hired, 3 for closed application.
 * @apiGroup employee
 * @apiParam {int} status application status
 * @apiParam {varchar} applicationId application id 
 * @apiSuccessExample {json} Success-Response:
 * {
 *      success: true,
 *      message: "درخواست با موفقیت ویرایش شد"
 * }
 * @apiErrorExample {json} Error-Response:
 * {
 *      success: false,
 *      message: "درخواستی موجود نیست"
 * }
 */
router.put('/application',EmployeeController.editApplication.bind(EmployeeController));

  

 module.exports = router;