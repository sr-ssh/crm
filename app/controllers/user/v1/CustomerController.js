const { param } = require("express-validator/check");
const ExcelJS = require('exceljs');
var path = require('path');
const fs = require('fs');

const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Customer';


module.exports = new class CustomerController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Customer v1" });
    }

    async getCustomers(req, res) {
        try {

            req.checkParams('family', 'please enter family').notEmpty().isString();
            req.checkParams('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkParams('createdAtFrom', 'please enter createdAtFrom').notEmpty().isISO8601();
            req.checkParams('createdAtTo', 'please enter createdAtTo').notEmpty().isISO8601();
            req.checkParams('totalFrom', 'please enter totalFrom').notEmpty().isFloat({ min: 0 });
            req.checkParams('totalTo', 'please enter totalTo').notEmpty().isFloat({ min: 0 });
            req.checkParams('lastBuyFrom', 'please enter lastBuyFrom').notEmpty().isISO8601();
            req.checkParams('lastBuyTo', 'please enter lastBuyTo').notEmpty().isISO8601();
            req.checkParams('orderFrom', 'please enter orderFrom').notEmpty().isInt({ min: 0 });
            req.checkParams('orderTo', 'please enter orderTo').notEmpty().isInt({ min: 0 });
            req.checkParams('orderStatus', 'please enter order status').notEmpty().isInt({ min: 0, max: 2 });//0 -> fail, 1 -> success, 2 -> undefined
            if (this.showValidationErrors(req, res)) return;

            const TIME_FLAG = "1900-01-01T05:42:13.845Z";
            const STRING_FLAG = " ";
            const NUMBER_FLAG = "0";

            let filter = { active: true, user: req.decodedData.user_employer };

            if (req.params.createdAtTo !== TIME_FLAG) {
                let nextDay = new Date(req.params.createdAtTo).setDate(new Date(req.params.createdAtTo).getDate() + 1);
                req.params.createdAtTo = nextDay
            }
            if (req.params.lastBuyTo !== TIME_FLAG) {
                let nextDay = new Date(req.params.lastBuyTo).setDate(new Date(req.params.lastBuyTo).getDate() + 1);
                req.params.lastBuyTo = new Date(nextDay)
            }

            //filtering mobile, creadtedAtTo, and creadtedAtFrom
            if (req.params.mobile !== NUMBER_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile }
            if (req.params.createdAtFrom !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, createdAt: { $gt: req.params.createdAtFrom } }
            if (req.params.createdAtTo !== TIME_FLAG) {
                filter = { active: true, user: req.decodedData.user_employer, createdAt: { $lt: req.params.createdAtTo } }

            }

            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtFrom !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile, createdAt: { $gt: req.params.createdAtFrom } }
            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile, createdAt: { $lt: req.params.createdAtTo } }

            if (req.params.createdAtFrom !== TIME_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { $and: [{ active: true }, { user: req.decodedData.user_employer }, { createdAt: { $gt: req.params.createdAtFrom } }, { createdAt: { $lt: req.params.createdAtTo } }] }

            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtFrom !== TIME_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { $and: [{ active: true }, { user: req.decodedData.user_employer }, { mobile: req.params.mobile }, { createdAt: { $gt: req.params.createdAtFrom } }, { createdAt: { $lt: req.params.createdAtTo } }] }

            if (req.params.orderStatus === "0")
                filter.failOrders = { $gt: 0 }
            else if (req.params.orderStatus === "1")
                filter.successfullOrders = { $gt: 0 }

            let customers = await this.model.Customer.find(filter).sort({ createdAt: -1 });;

            let params = [];
            for (let index = 0; index < customers.length; index++) {
                let param = {
                    active: true,
                    family: customers[index].family,
                    mobile: customers[index].mobile,
                    birthday: customers[index].birthday,
                    createdAt: customers[index].createdAt,
                    failOrders: customers[index].failOrders,
                    successfullOrders: customers[index].successfullOrders,
                    lastBuy: '',
                    total: 0
                }
                params.push(param)
            }

            let orders = []
            for (let index = 0; index < customers.length; index++) {
                for (let j = 1; j < customers[index].order.length; j++) {
                    orders.push(customers[index].order[j])
                }
            }

            filter = { _id: { $in: orders } }
            orders = await this.model.Order.find(filter, { _id: 1, updatedAt: 1, products: 1 })

            orders = orders.map(order => {
                order.products = order.products.map(product => product.sellingPrice * product.quantity)
                return order
            })


            let orderInfo = [];
            for (let index = 0; index < customers.length; index++) {
                orderInfo = orders.filter(order => customers[index].order.includes(order._id))
                if (orderInfo.length) {
                    params[index].lastBuy = orderInfo[orderInfo.length - 1].updatedAt
                    params[index].order = orderInfo.length;
                    let totalOrders = orderInfo.map(order => order.products.reduce((a, b) => parseInt(a) + parseInt(b), 0))
                    params[index].total = totalOrders.reduce((a, b) => parseInt(a) + parseInt(b), 0)
                }
            }
            //filtering family, totalFrom and totalTo
            if (req.params.family !== STRING_FLAG)
                params = params.filter(param => {
                    let re = new RegExp(req.params.family, "i");
                    let find = param.family.search(re);
                    return find !== -1;
                })

            if (req.params.totalFrom !== NUMBER_FLAG)
                params = params.filter(param => {
                    if (param.total)
                        return param.total >= req.params.totalFrom
                })

            if (req.params.totalTo !== NUMBER_FLAG)
                params = params.filter(param => {
                    if (param.total)
                        return param.total <= req.params.totalTo
                })

            //filtering lastBuy from, lastBuyTo, orderFrom, and orderTo
            if (req.params.lastBuyFrom !== TIME_FLAG)
                params = params.filter(param => {
                    return (param.lastBuy.toISOString() >= req.params.lastBuyFrom)
                })
            if (req.params.lastBuyTo !== TIME_FLAG)
                params = params.filter(param => {
                    return param.lastBuy.toISOString() <= req.params.lastBuyTo.toISOString()
                })
            if (req.params.orderFrom !== NUMBER_FLAG)
                params = params.filter(param => {
                    return param.order >= req.params.orderFrom
                })
            if (req.params.orderTo !== NUMBER_FLAG)
                params = params.filter(param => {
                    return param.order <= req.params.orderTo
                })

            res.json({ success: true, message: 'اطلاعات مشتریان با موفقیت ارسال شد', data: params })

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getCustomers')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getExcelCustomers(req, res) {
        try {

            req.checkParams('family', 'please enter family').notEmpty().isString();
            req.checkParams('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkParams('createdAtFrom', 'please enter createdAtFrom').notEmpty().isISO8601();
            req.checkParams('createdAtTo', 'please enter createdAtTo').notEmpty().isISO8601();
            req.checkParams('totalFrom', 'please enter totalFrom').notEmpty().isFloat({ min: 0 });
            req.checkParams('totalTo', 'please enter totalTo').notEmpty().isFloat({ min: 0 });
            req.checkParams('lastBuyFrom', 'please enter lastBuyFrom').notEmpty().isISO8601();
            req.checkParams('lastBuyTo', 'please enter lastBuyTo').notEmpty().isISO8601();
            req.checkParams('orderFrom', 'please enter orderFrom').notEmpty().isInt({ min: 0 });
            req.checkParams('orderTo', 'please enter orderTo').notEmpty().isInt().isInt({ min: 0 });
            if (this.showValidationErrors(req, res)) return;

            const TIME_FLAG = "1900-01-01T05:42:13.845Z";
            const STRING_FLAG = " ";
            const NUMBER_FLAG = "0";

            let filter = { active: true, user: req.decodedData.user_employer };

            if (req.params.createdAtTo !== TIME_FLAG) {
                let nextDay = new Date(req.params.createdAtTo).setDate(new Date(req.params.createdAtTo).getDate() + 1);
                req.params.createdAtTo = nextDay
            }
            if (req.params.lastBuyTo !== TIME_FLAG) {
                let nextDay = new Date(req.params.lastBuyTo).setDate(new Date(req.params.lastBuyTo).getDate() + 1);
                req.params.lastBuyTo = new Date(nextDay)
            }

            //filtering mobile, creadtedAtTo, and creadtedAtFrom
            if (req.params.mobile !== NUMBER_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile }
            if (req.params.createdAtFrom !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, createdAt: { $gt: req.params.createdAtFrom } }
            if (req.params.createdAtTo !== TIME_FLAG) {
                filter = { active: true, user: req.decodedData.user_employer, createdAt: { $lt: req.params.createdAtTo } }

            }


            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtFrom !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile, createdAt: { $gt: req.params.createdAtFrom } }
            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile, createdAt: { $lt: req.params.createdAtTo } }

            if (req.params.createdAtFrom !== TIME_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { $and: [{ active: true }, { user: req.decodedData.user_employer }, { createdAt: { $gt: req.params.createdAtFrom } }, { createdAt: { $lt: req.params.createdAtTo } }] }

            if (req.params.mobile !== NUMBER_FLAG && req.params.createdAtFrom !== TIME_FLAG && req.params.createdAtTo !== TIME_FLAG)
                filter = { $and: [{ active: true }, { user: req.decodedData.user_employer }, { mobile: req.params.mobile }, { createdAt: { $gt: req.params.createdAtFrom } }, { createdAt: { $lt: req.params.createdAtTo } }] }

            let customers = await this.model.Customer.find(filter).sort({ createdAt: -1 });;

            let params = [];
            for (let index = 0; index < customers.length; index++) {
                let param = {
                    active: true,
                    family: customers[index].family,
                    mobile: customers[index].mobile,
                    birthday: customers[index].birthday,
                    createdAt: customers[index].createdAt,
                    lastBuy: '',
                    total: 0
                }
                params.push(param)
            }

            let orders = []
            for (let index = 0; index < customers.length; index++) {
                for (let j = 1; j < customers[index].order.length; j++) {
                    orders.push(customers[index].order[j])
                }
            }

            filter = { _id: { $in: orders } }
            orders = await this.model.Order.find(filter, { _id: 1, updatedAt: 1, products: 1 })

            orders = orders.map(order => {
                order.products = order.products.map(product => product.sellingPrice * product.quantity)
                return order
            })


            let orderInfo = [];
            for (let index = 0; index < customers.length; index++) {
                orderInfo = orders.filter(order => customers[index].order.includes(order._id))
                if (orderInfo.length) {
                    params[index].lastBuy = orderInfo[orderInfo.length - 1].updatedAt
                    params[index].order = orderInfo.length;
                    let totalOrders = orderInfo.map(order => order.products.reduce((a, b) => parseInt(a) + parseInt(b), 0))
                    params[index].total = totalOrders.reduce((a, b) => parseInt(a) + parseInt(b), 0)
                }
            }
            //filtering family, totalFrom and totalTo
            if (req.params.family !== STRING_FLAG)
                params = params.filter(param => {
                    let re = new RegExp(req.params.family, "i");
                    let find = param.family.search(re);
                    return find !== -1;
                })

            if (req.params.totalFrom !== NUMBER_FLAG)
                params = params.filter(param => {
                    if (param.total)
                        return param.total >= req.params.totalFrom
                })

            if (req.params.totalTo !== NUMBER_FLAG)
                params = params.filter(param => {
                    if (param.total)
                        return param.total <= req.params.totalTo
                })

            //filtering lastBuy from, lastBuyTo, orderFrom, and orderTo
            if (req.params.lastBuyFrom !== TIME_FLAG)
                params = params.filter(param => {
                    return (param.lastBuy.toISOString() >= req.params.lastBuyFrom)
                })
            if (req.params.lastBuyTo !== TIME_FLAG)
                params = params.filter(param => {
                    return param.lastBuy.toISOString() <= req.params.lastBuyTo.toISOString()
                })
            if (req.params.orderFrom !== NUMBER_FLAG)
                params = params.filter(param => {
                    return param.order >= req.params.orderFrom
                })
            if (req.params.orderTo !== NUMBER_FLAG)
                params = params.filter(param => {
                    return param.order <= req.params.orderTo
                })

            if (params.length > 0)
                params.map(item => {
                    item.createdAT = new Date(item?.createdAt).toLocaleDateString("fa-IR")
                    item.lastBuY = new Date(item?.lastBuy).toLocaleDateString("fa-IR")
                })



            let workbook = new ExcelJS.Workbook();
            let worksheet = workbook.addWorksheet("ReportsOfCustomers");
            worksheet.views = [{ rightToLeft: true }]
            let name = 'ExcelCustomers.xlsx'

            worksheet.columns = [
                { key: "family", header: "نام مشتری", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "createdAt", header: "تاریخ عضویت", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "mobile", header: "موبایل", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                // { key: "birthday", header: "تاریخ تولد", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "order", header: "تعداد سفارش", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "lastBuy", header: "آخرین خرید", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "total", header: "جمع خرید", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } }
            ];
            worksheet.addRows(params);
            worksheet.getRow(1).font = { bold: true };
            let filePath = path.resolve(name);

            workbook.xlsx.writeFile(name).then(function (err, state) {
                if (err) {
                    return res.json({ success: false, message: "متاسفانه فایل ایجاد نشد" });

                } else {
                    res.setHeader('Content-Disposition', 'attachment; filename=' + name);
                    res.setHeader('Content-Transfer-Encoding', 'binary');
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.sendFile(filePath)

                    setTimeout(() => {
                        fs.unlinkSync(filePath)
                    }, 1500);
                }
            });

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getExcelCustomers')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getCustomer(req, res) {
        try {

            req.checkParams('mobile', 'please enter customer mobile').notEmpty().isNumeric();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile };

            let customer = await this.model.Customer.findOne(filter, { family: 1, mobile: 1, birthday: 1 });
            if (!customer)
                return res.json({ success: false, message: 'مشتری موجود نیست', data: {} })

            return res.json({ success: true, message: 'اطلاعات مشتری با موفقیت ارسال شد', data: customer })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getExcelCustomers')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }
}

