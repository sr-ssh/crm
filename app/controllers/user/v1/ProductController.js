
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Product';
const ExcelJS = require('exceljs');
var path = require('path');
const fs = require('fs');
const { param } = require('../../../routes');

module.exports = new class ProductController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Product v1" });
    }

    async addProduct(req, res) {
        try {
            req.checkBody('name', 'please enter name').notEmpty().isString();
            req.checkBody('checkWareHouse', 'please enter checkWareHouse').notEmpty().isBoolean();
            req.checkBody('direct', 'please enter direct').notEmpty().isBoolean();
            req.checkBody('sellingPrice', 'please enter sellingPrice').notEmpty().isFloat({ min: 0 });
            req.checkBody('description', 'please enter description').optional().isString();
            if (this.showValidationErrors(req, res)) return;

            let params = {
                name: req.body.name,
                user: req.decodedData.user_employer,
                description: req.body.description || ""
            }

            let filter = { name: params.name, user: params.user }
            let stock;

            if(req.body.direct){
                stock = await this.model.Stock.findOne(filter)
    
                if (stock)
                    return res.json({ success: true, message: 'محصول وارد شده،در مواد خام موجود است', data: { status: false } })
    
                stock = await this.model.Stock.create(params)
                params.ingredients = [{ stock: stock._id, amount: 1}]
            }
            
            params.checkWareHouse = req.body.checkWareHouse,
            params.sellingPrice = req.body.sellingPrice

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
            let products = await this.model.Product.find(filter).populate({path: 'ingredients.stock', model: 'Stock', select: 'amount'}).sort({ createdAt: -1 });
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
            req.checkBody('checkWareHouse', 'please enter checkWareHouse').notEmpty().isBoolean();
            req.checkBody('direct', 'please enter direct').notEmpty().isBoolean();
            if (this.showValidationErrors(req, res)) return;

            const STRING_FLAG = " ";

            let params = {
                active: req.body.active,
                name: req.body.name,
                sellingPrice: req.body.sellingPrice,
                checkWareHouse: req.body.checkWareHouse,
            }

            if (req.body.description !== STRING_FLAG)
                params.description = req.body.description

            let filter = { _id: req.body._id }
            let product = await this.model.Product.findOneAndUpdate(filter, params)

            if (!product)
                return res.json({ success: false, message: 'محصول وارد شده، موجود نیست' })

            //update stock
            filter = { name: product.name, user: product.user };

            if (
              req.body.direct &&
              (!product.ingredients || !product.ingredients.length)
            ) {
              let stock = await this.model.Stock.findOneAndUpdate(
                filter,
                {$setOnInsert: {
                    active: true,
                    amount: 0
                }},
                { new: true, upsert: true }
              );
              product.ingredients = [{ stock: stock._id, amount: 1 }];
              await product.save();
            }

            if (req.body.direct && product.ingredients.length) {
              filter = { _id: product.ingredients[0].stock };
              params = { name: req.body.name };
              await this.model.Stock.findOneAndUpdate(filter, params);
            }

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

    async uploadExcel(req, res) {
        try {

            console.time('test uploadExcel')
            // get path File that was uploaded by user
            let pathExcelFile = path.resolve(`./tmp/user${req.decodedData.user_employer}${path.extname(req.file.originalname)}`)

            let productsUser = []
            let stockUser = []
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(pathExcelFile);
            let worksheet = workbook.getWorksheet(1);
            // read Excel file
            await worksheet.eachRow({ includeEmpty: false },async (row, rowNumber) => {

                if (rowNumber == 1)
                    return

                const pattOnlyNum = /^[0-9 ۰-۹]+$/;
                const pattAlphanumeric = /^[آ-یa-zA-Z 0-9 ۰-۹\s]+[آ-یa-zA-Z 0-9 ۰-۹\s]+$(\.0-9 ۰-۹+)?/;

                let params = {
                  updateOne: {
                    filter: {
                      user: req.decodedData.user_employer,
                      name: pattAlphanumeric.test(row.values[1])
                        ? row.values[1]
                        : null,
                    },
                    update: {
                      active: row.values[2].trim() == "فعال" ? true : false,
                      sellingPrice: pattOnlyNum.test(row.values[3])
                        ? row.values[3]
                        : null,
                      checkWareHouse:
                        row.values[6].trim() == "بله" ? true : false,
                      $setOnInsert: {
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                      },
                    },
                    upsert: true,
                  },
                };

                if (row.values[5])
                    params.updateOne.update.description = row.values[5]
                
                //add stock
                let stockParams = {};
                if (
                  row.values[7].trim() == "بله" &&
                  params.updateOne.filter.name != null &&
                  params.updateOne.update.sellingPrice != null
                ) {
                  stockParams = {
                    name: params.updateOne.filter.name,
                    user: req.decodedData.user_employer,
                  };

                  if (row.values[5]) stockParams.description = row.values[5];

                 params.updateOne.update.ingredients = [
                    { stock: stockParams, amount: 1 },
                  ];
                }

                if (
                  params.updateOne.filter.name != null &&
                  params.updateOne.update.sellingPrice != null
                )
                  productsUser.push(params);

            })

            // Delete Excel file that was sent to upload
            fs.unlinkSync(pathExcelFile)

            //add ingredients
            for (let index = 0; index < productsUser.length; index++) {
              if (
                productsUser[index].updateOne.update.ingredients &&
                productsUser[index].updateOne.update.ingredients[0] &&
                productsUser[index].updateOne.update.ingredients[0].stock
              ) {
                let stockId = await this.model.Stock.findOneAndUpdate(
                  {
                    name: productsUser[index].updateOne.update.ingredients[0].stock
                      .name,
                    user: productsUser[index].updateOne.update.ingredients[0].stock
                      .user,
                  },
                  {
                    description:
                      productsUser[index].updateOne.update.ingredients[0].stock
                        .description,
                    active: true,
                    $setOnInsert: {
                      amount: 0
                    },
                  },
                  { new: true, upsert: true }
                );
                productsUser[index].updateOne.update.ingredients[0].stock =
                  stockId._id;
              }
            }

            await this.model.Product.bulkWrite(productsUser)

            res.json({ success: true, message: 'محصولات با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('uploadExcel')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


