const { param } = require("express-validator/check");
const ExcelJS = require('exceljs');
var path = require('path');


const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Supplier';


module.exports = new class SupplierController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Supplier v1" });
    }

    async getSuppliers(req, res) {
        try {

            req.checkParams('family', 'please enter family').notEmpty().isString();
            req.checkParams('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkParams('createdAtFrom', 'please enter createdAtFrom').notEmpty().isISO8601();
            req.checkParams('createdAtTo', 'please enter createdAtTo').notEmpty().isISO8601();
            req.checkParams('lastBuyFrom', 'please enter lastBuyFrom').notEmpty().isISO8601();
            req.checkParams('lastBuyTo', 'please enter lastBuyTo').notEmpty().isISO8601();
            req.checkParams('receiptFrom', 'please enter receiptFrom').notEmpty().isInt({ min: 0 });
            req.checkParams('receiptTo', 'please enter receiptTo').notEmpty().isInt({ min: 0 });
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


            let suppliers = await this.model.Supplier.find(filter, { family: 1, createdAt: 1, mobile: 1, company: 1 }).populate('receipts').sort({ createdAt: -1 }).lean();
            if (!suppliers)
                return res.json({ success: true, message: 'تامین کننده ای وجود ندارد', data: suppliers })

            suppliers.map(supplier => {
                supplier.lastBuy = supplier.receipts[supplier.receipts.length - 1]?.updatedAt
                supplier.receipts = supplier.receipts.length
            })

            //filtering family, totalFrom and totalTo
            if (req.params.family !== STRING_FLAG)
                suppliers = suppliers.filter(param => {
                    let re = new RegExp(req.params.family, "i");
                    let find = param.family.search(re);
                    return find !== -1;
                })

            //filtering lastBuy from, lastBuyTo, orderFrom, and orderTo
            if (req.params.lastBuyFrom !== TIME_FLAG)
                suppliers = suppliers.filter(param => {
                    return (param.lastBuy.toISOString() >= req.params.lastBuyFrom)
                })
            if (req.params.lastBuyTo !== TIME_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.lastBuy.toISOString() <= req.params.lastBuyTo.toISOString()
                })
            if (req.params.receiptFrom !== NUMBER_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.receipts >= req.params.receiptFrom
                })
            if (req.params.receiptTo !== NUMBER_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.receipts <= req.params.receiptTo
                })

            res.json({ success: true, message: 'اطلاعات تامین کننده ها با موفقیت ارسال شد', data: suppliers })

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getSuppliers')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getExcelSuppliers(req, res) {
        try {

            req.checkParams('family', 'please enter family').notEmpty().isString();
            req.checkParams('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkParams('createdAtFrom', 'please enter createdAtFrom').notEmpty().isISO8601();
            req.checkParams('createdAtTo', 'please enter createdAtTo').notEmpty().isISO8601();
            req.checkParams('lastBuyFrom', 'please enter lastBuyFrom').notEmpty().isISO8601();
            req.checkParams('lastBuyTo', 'please enter lastBuyTo').notEmpty().isISO8601();
            req.checkParams('receiptFrom', 'please enter receiptFrom').notEmpty().isInt({ min: 0 });
            req.checkParams('receiptTo', 'please enter receiptTo').notEmpty().isInt({ min: 0 });
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


            let suppliers = await this.model.Supplier.find(filter, { family: 1, createdAt: 1, mobile: 1, company: 1 }).populate('receipts').sort({ createdAt: -1 }).lean();
            if (!suppliers)
                return res.json({ success: true, message: 'تامین کننده ای وجود ندارد', data: suppliers })

            suppliers.map(supplier => {
                supplier.lastBuy = supplier.receipts[supplier.receipts.length - 1].updatedAt
                supplier.receipts = supplier.receipts.length
            })

            //filtering family, totalFrom and totalTo
            if (req.params.family !== STRING_FLAG)
                suppliers = suppliers.filter(param => {
                    let re = new RegExp(req.params.family, "i");
                    let find = param.family.search(re);
                    return find !== -1;
                })

            //filtering lastBuy from, lastBuyTo, orderFrom, and orderTo
            if (req.params.lastBuyFrom !== TIME_FLAG)
                suppliers = suppliers.filter(param => {
                    return (param.lastBuy.toISOString() >= req.params.lastBuyFrom)
                })
            if (req.params.lastBuyTo !== TIME_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.lastBuy.toISOString() <= req.params.lastBuyTo.toISOString()
                })
            if (req.params.receiptFrom !== NUMBER_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.receipts >= req.params.receiptFrom
                })
            if (req.params.receiptTo !== NUMBER_FLAG)
                suppliers = suppliers.filter(param => {
                    return param.receipts <= req.params.receiptTo
                })

            if (suppliers.length > 0)
                suppliers.map(item => {
                    item.createdAT = new Date(item?.createdAt).toLocaleDateString("fa-IR")
                    item.lastBuY = new Date(item?.lastBuy).toLocaleDateString("fa-IR")
                })



            let workbook = new ExcelJS.Workbook();
            let worksheet = workbook.addWorksheet("ReportsOfSuppliers");
            worksheet.views = [{ rightToLeft: true }]
            let name = 'ExcelSuppliers.xlsx'

            worksheet.columns = [
                { key: "family", header: "نام", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "createdAt", header: "تاریخ عضویت", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "mobile", header: "موبایل", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "company", header: "نام شرکت", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "receipts", header: "تعداد خرید", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "lastBuy", header: "آخرین خرید", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } }
            ];
            worksheet.addRows(suppliers);
            worksheet.getRow(1).font = { bold: true };
            let filePath = path.resolve(name);

            workbook.xlsx.writeFile(name).then(function (err, state) {
                if (err) {
                    return res.json({ success: true, message: "متاسفانه فایل ایجاد نشد", data: { status: false } });

                } else {
                    res.setHeader('Content-Disposition', 'attachment; filename=' + name);
                    res.setHeader('Content-Transfer-Encoding', 'binary');
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.sendFile(filePath)
                }
            });

            // workbook.removeWorksheet(worksheet.id)

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getExcelSuppliers')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getSupplier(req, res) {
        try {

            req.checkParams('mobile', 'please enter supplier mobile').notEmpty().isNumeric();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, user: req.decodedData.user_employer, mobile: req.params.mobile };

            let supplier = await this.model.Supplier.findOne(filter, { family: 1, mobile: 1, company: 1, address: 1 });
            if (!supplier)
                return res.json({ success: true, message: 'تامین کننده موجود نیست', data: { status: false } })

            return res.json({ success: true, message: 'اطلاعات تامین کننده با موفقیت ارسال شد', data: supplier })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getSupplier')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


