
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Product';
const ExcelJS = require('exceljs');
var path = require('path');

module.exports = new class ProductController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Product v1" });
    }

    async addProduct(req, res) {
        try {
            req.checkBody('name', 'please enter name').notEmpty().isString();
            req.checkBody('sellingPrice', 'please enter sellingPrice').notEmpty().isFloat({ min: 0 });
            req.checkBody('description', 'please enter description').notEmpty().isString();
            if (this.showValidationErrors(req, res)) return;

            const STRING_FLAG = " ";
            const NUMBER_FLAG = "0";

            let params = {
                name: req.body.name,
                sellingPrice: req.body.sellingPrice,
                user: req.decodedData.user_employer
            }

            if (req.body.description !== STRING_FLAG)
                params.description = req.body.description

            let filter = { name: params.name, sellingPrice: params.sellingPrice, user: params.user }
            let product = await this.model.Product.findOne(filter)

            if (product)
                return res.json({ success: false, message: 'محصول وارد شده، موجود است' })

            await this.model.Product.create(params)

            res.json({ success: true, message: 'محصول شما با موفقیت ثبت شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addProduct')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getProducts(req, res) {
        try {
            let filter = { user: req.decodedData.user_employer }
            let products = await this.model.Product.find(filter).sort({ createdAt: -1 });
            res.json({ success: true, message: 'محصولات با موفقیت ارسال شد', data: products })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getProducts')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async getExcelProducts(req, res) {
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
                .method('getExcelProducts')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editProduct(req, res) {
        try {
            req.checkBody('_id', 'please enter product id').notEmpty();
            req.checkBody('active', 'please enter activity status').notEmpty().isBoolean();
            req.checkBody('name', 'please enter name').notEmpty().isString();
            req.checkBody('sellingPrice', 'please enter sellingPrice').notEmpty().isFloat({ min: 0 });
            req.checkBody('description', 'please enter description').notEmpty().isString();
            if (this.showValidationErrors(req, res)) return;

            const STRING_FLAG = " ";

            let params = {
                active: req.body.active,
                name: req.body.name,
                sellingPrice: req.body.sellingPrice
            }

            if (req.body.description !== STRING_FLAG)
                params.description = req.body.description

            let filter = { _id: req.body._id }
            let product = await this.model.Product.findOneAndUpdate(filter, params)

            if (!product)
                return res.json({ success: false, message: 'محصول وارد شده، موجود نیست' })


            res.json({ success: true, message: 'محصول شما با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editProduct')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


