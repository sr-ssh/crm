
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Stock';
const ExcelJS = require('exceljs');
var path = require('path');

module.exports = new class StockController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Stock v1" });
    }

    async addStock(req, res) {
        try {
            req.checkBody('name', 'please enter name').notEmpty().isString();
            req.checkBody('description', 'please enter description').optional().isString();
            if (this.showValidationErrors(req, res)) return;

            let params = {
                name: req.body.name,
                description: req.body.description || "",
                user: req.decodedData.user_employer
            }

            let filter = { name: params.name, user: params.user }
            let stock = await this.model.Stock.findOne(filter)

            if (stock)
                return res.json({ success: true, message: 'ماده وارد شده، موجود است', data: { status: false } })

            await this.model.Stock.create(params)

            res.json({ success: true, message: 'ماده شما با موفقیت ثبت شد', data: { status: true } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addStock')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getStock(req, res) {
        try {
            let filter = { user: req.decodedData.user_employer }
            let stock = await this.model.Stock.find(filter, {name: 1, description: 1, active: 1, updatedAt: 1, amount: 1}).sort({ createdAt: -1 }).lean();
            
            res.json({ success: true, message: 'مواد خام با موفقیت ارسال شد', data: stock })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getStock')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async getExcelStock(req, res) {
        try {


            let filter = { user: req.decodedData.user_employer }
            let products = await this.model.Product.find(filter).sort({ createdAt: -1 });


            let params = [];
            for (let index = 0; index < products.length; index++) {
                let param = {
                    name: products[index].name,
                    active: products[index].active == true ? "فعال" : "غیرفعال",
                    sellingPrice: products[index].sellingPrice,
                    updatedAt: products[index].updatedAt,
                    description: products[index].description != undefined ? products[index].description : null,
                }
                params.push(param)
            }


            let workbook = new ExcelJS.Workbook();
            let worksheet = workbook.addWorksheet("ReportsOfProducts");
            worksheet.views = [{ rightToLeft: true }]

            let name = 'ExcelProducts.xlsx'

            worksheet.columns = [
                { key: "name", header: "نام محصول", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "active", header: "وضعیت محصول", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "sellingPrice", header: "قیمت فروش", width: 15, style: { alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "updatedAt", header: "تاریخ آخرین ویرایش", width: 15, style: { numFmt: '[$-fa-IR,16]dd/mm/yyyy;@', alignment: { vertical: 'center', horizontal: 'center' } } },
                { key: "description", header: "توضیحات", width: 20, style: { alignment: { vertical: 'center', horizontal: 'center' } } }
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
                }
            });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getExcelStock')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editStock(req, res) {
        try {
            req.checkBody('_id', 'please enter product id').notEmpty();
            req.checkBody('active', 'please enter activity status').notEmpty().isBoolean();
            req.checkBody('name', 'please enter name').notEmpty().isString();
            req.checkBody('description', 'please enter description').optional().isString();
            if (this.showValidationErrors(req, res)) return;

            let params = {
                active: req.body.active,
                name: req.body.name,
                description: req.body.description || ""
            }

            let filter = { _id: req.body._id }
            let stock = await this.model.Stock.findOneAndUpdate(filter, params)

            if (!stock)
                return res.json({ success: true, message: 'ماده وارد شده، موجود نیست', data: { status: false } })


            res.json({ success: true, message: 'ماده شما با موفقیت ویرایش شد', data: { status: true } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editStock')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


