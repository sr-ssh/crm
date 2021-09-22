const { filterSeries } = require("async");
const { param } = require("express-validator/check");
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Receipt';

module.exports = new class ReceiptController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Receipt v1" });
    }

    async addReceipt(req, res) {
        try {
            req.checkBody('stock', 'please enter stock').notEmpty();
            req.checkBody('stock.*._id', 'please enter stock id').notEmpty().isString();
            req.checkBody('stock.*.quantity', 'please enter stock quantity').notEmpty().isNumeric();
            req.checkBody('stock.*.price', 'please enter stock price').notEmpty().isFloat();
            req.checkBody('supplier', 'please enter supplier').notEmpty();
            req.checkBody('supplier.family', 'please enter supplier family').notEmpty().isString();
            req.checkBody('supplier.mobile', 'please enter supplier mobile').notEmpty().isNumeric();
            req.checkBody('supplier.company', 'please enter supplier company').optional().isString();
            req.checkBody('address', 'please enter address').optional().isString();
            req.checkBody('note', 'please enter receipt note').optional();
            req.checkBody('note.text', 'please enter receipt note text').optional().isString();
            req.checkBody('note.createdAt', 'please enter receipt note createdAt').optional().isString();
            if (this.showValidationErrors(req, res)) return;

            // add supplier
            let filter = { mobile: req.body.supplier.mobile, user: req.decodedData.user_employer }
            let params = {
                family: req.body.supplier.family,
                mobile: req.body.supplier.mobile,
                user: req.decodedData.user_employer,
                company: req.body.supplier.company
            }
            
            let supplier = await this.model.Supplier.findOneAndUpdate(filter, params, { upsert: true, new: true })

            if(req.body.note) {
                req.body.note.writtenBy = req.decodedData.user_id
                req.body.note.private = false
            }

            // add receipt
            params = {
                stock: req.body.stock,
                note: req.body.note,
                supplier: supplier._id,
                address: req.body.address,
                provider: req.decodedData.user_employer,
                employee: req.decodedData.user_id,
            }
            let receipt = await this.model.Receipt.create(params)

            // add receipt to supplier
            await supplier.receipts.push(receipt._id)
            // customer.successfullOrders = customer.successfullOrders + 1;
            await supplier.save()

            res.json({ success: true, message: 'فاکتور شما با موفقیت ثبت شد' })

            // let user = await this.model.User.findOne({ _id: req.decodedData.user_employer }, 'setting company')
            // if (user.setting.order.preSms.status) {
            //     let message = ""
            //     if (user.company)
            //         message = user.setting.order.preSms.text + ` \n${req.decodedData.user_company}`
            //     else
            //         message = user.setting.order.preSms.text

            //     this.sendSms(req.body.customer.mobile, message)
            // }
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addReceipt')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getReceipts(req, res) {
        try {
            req.checkParams('customerName', 'please set customerName').notEmpty();
            req.checkParams('customerMobile', 'please set customerMobile').notEmpty();
            req.checkParams('startDate', 'please set startDate').notEmpty().isISO8601();
            req.checkParams('endDate', 'please set endDate').notEmpty().isISO8601();

            if (this.showValidationErrors(req, res)) return;

            const TIME_FLAG = "1900-01-01T05:42:13.845Z";

            if (req.params.endDate !== TIME_FLAG) {
                let nextDay = new Date(req.params.endDate).setDate(new Date(req.params.endDate).getDate() + 1);
                req.params.endDate = nextDay
            }

            let filter;
            if (req.params.startDate != TIME_FLAG && req.params.endDate === TIME_FLAG)
                filter = { $and: [{ provider: req.decodedData.user_employer }, { createdAt: { $gt: req.params.startDate } }] }
            if (req.params.startDate === TIME_FLAG && req.params.endDate != TIME_FLAG)
                filter = { $and: [{ provider: req.decodedData.user_employer }, { createdAt: { $lt: req.params.endDate } }] }
            if (req.params.startDate === TIME_FLAG && req.params.endDate === TIME_FLAG)
                filter = { provider: req.decodedData.user_employer }
            if (req.params.startDate != TIME_FLAG && req.params.endDate != TIME_FLAG)
                filter = { $and: [{ provider: req.decodedData.user_employer }, { createdAt: { $lt: req.params.endDate } }, { createdAt: { $gt: req.params.startDate } }] }

            let orders = await this.model.Order.find(filter).sort({ createdAt: -1 });

            let params = [];
            for (let index = 0; index < orders.length; index++) {
                let param = {
                    id: orders[index]._id,
                    active: orders[index].active,
                    status: orders[index].status,
                    products: orders[index].products,
                    customer: orders[index].customer,
                    address: orders[index].address,
                    readyTime: orders[index].readyTime,
                    createdAt: orders[index].createdAt,
                    updatedAt: orders[index].updatedAt,
                    employee: orders[index].employee,
                    description: orders[index].description
                }
                params.push(param)
            }

            let customers = []
            for (let index = 0; index < orders.length; index++) {
                customers.push(orders[index].customer)
            }

            filter = { _id: { $in: customers } }
            customers = await this.model.Customer.find(filter, { _id: 1, family: 1, mobile: 1, createdAt: 1 })

            let customerInfo;
            for (let index = 0; index < orders.length; index++) {
                customerInfo = customers.find(user => user._id.toString() == orders[index].customer)
                params[index].customer = customerInfo;
            }


            let employees = []
            for (let index = 0; index < orders.length; index++) {
                employees.push(orders[index].employee)
            }

            filter = { _id: { $in: employees } }
            employees = await this.model.User.find(filter, { _id: 1, family: 1 })

            let employeeInfo;
            for (let index = 0; index < orders.length; index++) {
                employeeInfo = employees.find(user => user._id.toString() == orders[index].employee)
                params[index].employee = employeeInfo;
            }


            if (req.params.customerMobile !== "0")
                params = params.filter(param => param.customer.mobile === req.params.customerMobile)

            if (req.params.customerName !== " ")
                params = params.filter(param => {
                    if (param.customer) {
                        let re = new RegExp(req.params.customerName, "i");
                        let find = param.customer.family.search(re);
                        return find !== -1;
                    }
                })

            let products = []
            for (let index = 0; index < params.length; index++) {
                for (let j = 0; j < params[index].products.length; j++) {
                    products.push(params[index].products[j]._id)
                }
            }
            filter = { _id: { $in: products } }
            products = await this.model.Product.find(filter, { _id: 1, name: 1 })


            for (let index = 0; index < params.length; index++) {
                let productInfo;
                for (let j = 0; j < params[index].products.length; j++) {
                    productInfo = products.find(product => product._id.toString() === params[index].products[j]._id.toString())
                    if (productInfo)
                        params[index].products[j].name = productInfo.name;
                }
            }



            return res.json({ success: true, message: 'سفارشات با موفقیت ارسال شد', data: params })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getOrders')
                .inputParams(req.params)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editReceiptStatus(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('status', 'please set order status').notEmpty().isIn[0, 1, 2, 4];
            // 0 -> successfull order, 4 -> fail sale opprtunity, 2 -> cancel order 
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            order.status = req.body.status
            await order.save()

            filter = { active: true, _id: order.customer, user: req.decodedData.user_employer}
            let customer = await this.model.Customer.findOne(filter)

            switch (order.status) {
                case 0:
                    customer.successfullOrders = customer.successfullOrders + 1 ; 
                    break;
                case 4:
                    customer.failOrders = customer.failOrders + 1 ; 
                    break;
                case 2:
                    customer.failOrders = customer.failOrders + 1 ; 
                    customer.successfullOrders = customer.successfullOrders - 1; 
                break;
                default:
                    break;
            }  

            await customer.save()

            res.json({ success: true, message: 'وضعیت سفارش با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editOrderStatus')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }




    async getReceiptsNotes(req, res) {
        try {
            req.checkParams('orderId', 'please set order id').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.params.orderId }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })
            if (order.notes.length <= 0)
                return res.json({ success: false, message: 'یادداشتی موجود نیست' })

            let { notes } = await this.model.Order.findOne(filter).populate({ path: 'notes.writtenBy', model: 'User', select: 'family' })

            let params;
            let data;
            data = notes.filter(item => item.private === false)
            params = notes.filter(item => (item.private === true && item.writtenBy._id.toString() === req.decodedData.user_id))

            let isPrivate;
            if (params.length > 0) {
                isPrivate = true;
                params = params.reduce((result, item) => {
                    result = item;
                    data.push(result)
                }, {});
            } else {
                isPrivate = false;
            }

            data.map(item => {
                item.writtenBy = item.writtenBy.family
                return item

            })

            res.json({ success: true, message: 'یادداشت ها با موفقیت ارسال شد', data: { isPrivate, data } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getOrdersNotes')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async confirmShop(req, res) {
        try {

            req.checkBody('receiptId', 'please set receipt id').notEmpty().isMongoId();
            if (this.showValidationErrors(req, res)) return;

            let params = { status: true, acceptedAt: new Date().toISOString(), acceptedBy: req.decodedData.user_id };

            let filter = { active: true, _id: req.body.receiptId }

            let receipt = await this.model.Receipt.findOne(filter)

            if (!receipt)
                return res.json({ success: true, message: 'فاکتور موجود نیست', data: { status: false } })
            if (receipt.shopApproval.status === true)
                return res.json({ success: true, message: 'تایید خرید فاکتور قابل ویرایش نیست', data: { status: false } })

            receipt.shopApproval = params
            receipt.markModified('shopApproval')
            await receipt.save()


            return res.json({ success: true, message: 'فاکتور تایید خرید شد', data: { status: true } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('confirmShop')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }



    async addOrdersNotes(req, res) {
        try {
            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('notes', 'please set order id').notEmpty();
            req.checkBody('notes.*.text', 'please set order id').notEmpty().isString();
            req.checkBody('notes.*.createdAt', 'please enter product sellingPrice').notEmpty();

            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            req.body.notes.map(item => {
                let note = { ...item, writtenBy: req.decodedData.user_id, private: false }
                order.notes.push(note)
            })

            order.markModified('notes')

            await order.save()

            res.json({ success: true, message: 'یادداشت با موفقیت اضافه شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addOrdersNotes')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }



    async editOrderPrice(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('productId', 'please set product id').notEmpty();
            req.checkBody('price', 'please set order price').notEmpty().isString();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter, { products: 1 })

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            order.products.map(product => { if (product._id === req.body.productId) product.sellingPrice = req.body.price })
            order.markModified('products')

            await order.save()

            res.json({ success: true, message: 'وضعیت سفارش با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editOrderPrice')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async editOrderQuantity(req, res) {
        try {
            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('productId', 'please set product id').notEmpty();
            req.checkBody('quantity', 'please set order quantity').notEmpty().isInt();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter, { products: 1 })

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            order.products.map(product => { if (product._id === req.body.productId) product.quantity = req.body.quantity })
            order.markModified('products')

            await order.save()

            res.json({ success: true, message: 'تعداد سفارش با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editOrderQuantity')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async editStatusNotes(req, res) {
        try {
            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('status', 'please set status').notEmpty().isString();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })
            let status;
            if (req.body.status === '1')
                status = true
            else if (req.body.status === '0')
                status = false
            else
                return res.json({ success: false, message: 'please set status' })


            order.notes.map(notes => {
                if (notes.writtenBy === req.decodedData.user_id)
                    notes.private = status
            })
            order.markModified('notes')

            await order.save()

            res.json({ success: true, message: 'وضعیت یادداشت ها با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editStatusNotes')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }





    async deleteProdcutOrder(req, res) {
        try {
            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('productId', 'please set product id').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'کالا موجود نیست' })
            if (order.products.length <= 1)
                return res.json({ success: false, message: 'کمتر از یک کالا نمیتواند در سفارش باشد.' })


            order.products = order.products.filter(item => item._id !== req.body.productId)
            order.markModified('products')

            await order.save()

            res.json({ success: true, message: 'تعداد سفارش  کالا با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('deleteProdcutOrder')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async editProductOrder(req, res) {
        try {
            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('address', 'please enter address').notEmpty().isString();
            req.checkBody('products', 'please enter products').notEmpty();
            req.checkBody('products.*._id', 'please enter product id').notEmpty();
            req.checkBody('products.*.quantity', 'please enter product quantity').notEmpty();
            req.checkBody('products.*.sellingPrice', 'please enter product sellingPrice').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'کالا موجود نیست' })

            order.products = req.body.products

            if (req.body.address)
                order.address = req.body.address;

            order.markModified('products')
            await order.save()

            res.json({ success: true, message: 'سفارش با موفقیت ویرایش شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editProductOrder')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }



    async sendDeliverySms(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty().isString();
            req.checkBody('mobile', 'please set mobile').notEmpty().isNumeric();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter, { customer: 1, address: 1 })

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            let customer = await this.model.Customer.findOne({ _id: order.customer }, { family: 1, mobile: 1, address: 1 })
            if (!customer)
                return res.json({ success: false, message: 'مشتری موجود نیست' })

            res.json({ success: true, message: 'پیام اطلاعات مشتری ارسال شد' })

            let user = await this.model.User.findOne({ _id: req.decodedData.user_employer }, 'setting')
            if (user.setting.order.postDeliverySms.status) {
                let deliveryMessage = `نام: ${customer.family}\nموبایل: ${customer.mobile}\nآدرس: ${order.address}\n` + user.setting.order.postDeliverySms.text;
                this.sendSms(req.body.mobile, deliveryMessage)
            }
            if (user.setting.order.postCustomerSms.status) {
                let customerMessage = user.setting.order.postCustomerSms.text
                this.sendSms(customer.mobile, customerMessage)
            }

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('sendDeliverySms')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async orderDetails(req, res) {
        try {
            req.checkParams('orderId', 'please set order id').notEmpty().isMongoId();
            req.checkParams('keylink', 'please set keylink').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let now = new Date().toISOString()
            let filter = { active: true, _id: req.params.orderId, sharelink: { $elemMatch: { _id: req.params.keylink, expireTime: { $gt: now } } } }

            let orders = await this.model.Order.find(filter);

            if (orders.length == 0)
                return res.json({ success: false, message: "لینک منقضی شده است " })


            let params = {};
            for (let index = 0; index < orders.length; index++) {
                params.id = orders[index]._id,
                    params.active = orders[index].active,
                    params.status = orders[index].status,
                    params.products = orders[index].products,
                    params.customer = orders[index].customer,
                    params.address = orders[index].address,
                    params.readyTime = orders[index].readyTime,
                    params.createdAt = orders[index].createdAt,
                    params.updatedAt = orders[index].updatedAt,
                    params.employee = orders[index].employee,
                    params.description = orders[index].description
            }


            filter = { _id: params.customer }
            let customers = await this.model.Customer.find(filter, { _id: 1, family: 1, mobile: 1, createdAt: 1 })

            let customerInfo = customers.find(user => user._id.toString() == params.customer)
            params.customer = customerInfo;


            filter = { _id: params.employee }
            let employees = await this.model.User.find(filter, { _id: 1, family: 1, address: 1 })

            let employeeInfo = employees.find(user => user._id.toString() == params.employee)
            params.employee = employeeInfo;


            let products = []
            for (let index = 0; index < 1; index++) {
                for (let j = 0; j < params.products.length; j++) {
                    products.push(params.products[j]._id)
                }
            }
            filter = { _id: { $in: products } }
            products = await this.model.Product.find(filter, { _id: 1, name: 1 })


            for (let index = 0; index < 1; index++) {
                let productInfo;
                for (let j = 0; j < params.products.length; j++) {
                    productInfo = products.find(product => product._id.toString() === params.products[j]._id.toString())
                    if (productInfo)
                        params.products[j].name = productInfo.name;
                }
            }


            return res.json({ success: true, message: 'فاکتور سفارش با موفقیت ارسال شد', data: params })


        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('orderDetails')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }



    async createShareLink(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty().isMongoId();

            if (this.showValidationErrors(req, res)) return;

            const Minutes = 60000;
            const Hour = 3600000;
            const Day = 86400000;
            const id = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
            let params = { _id: id, createdAt: new Date().toISOString(), createdBy: req.decodedData.user_id };
            let timeExpire;

            let filter = { _id: req.decodedData.user_employer }
            let employer = await this.model.User.findOne(filter, "setting.order")

            let { time, unitTime } = employer.setting.order.share
            if (unitTime == "M")
                timeExpire = time * Minutes
            if (unitTime == "H")
                timeExpire = time * Hour
            if (unitTime == "D")
                timeExpire = time * Day
            timeExpire = Date.now() + timeExpire;
            params.expireTime = new Date(timeExpire).toISOString();
            filter = { _id: req.body.orderId }
            let order = await this.model.Order.findOne(filter)

            order.sharelink.push(params)
            order.markModified('sharelink')
            await order.save()

            return res.json({ success: true, message: 'لینک اشتراک گذاری با موفقیت ارسال شد', data: { orderId: req.body.orderId, keyLink: params._id } })


        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('createShareLink')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


}


