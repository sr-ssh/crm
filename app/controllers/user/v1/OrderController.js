
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Order';

module.exports = new class OrderController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Order v1" });
    }

    async addOrder(req, res) {
        try {
            req.checkBody('products', 'please enter products').notEmpty();
            req.checkBody('products.*._id', 'please enter product id').notEmpty();
            req.checkBody('products.*.quantity', 'please enter product quantity').notEmpty();
            req.checkBody('products.*.sellingPrice', 'please enter product sellingPrice').notEmpty();
            req.checkBody('customer', 'please enter customer').notEmpty();
            req.checkBody('customer.family', 'please enter customer family').notEmpty();
            req.checkBody('customer.mobile', 'please enter customer mobile').notEmpty().isNumeric();
            req.checkBody('customer.birthday', 'please enter customer birthday').notEmpty().isISO8601();
            req.checkBody('reminder', 'please enter customer birthday').notEmpty().isInt({ min: -1 });
            req.checkBody('address', 'please enter address').notEmpty().isString();
            req.checkBody('duration', 'please enter order duration').notEmpty().isInt({ min: -1 });
            if (this.showValidationErrors(req, res)) return;

            const TIME_FLAG = "1900-01-01T05:42:13.845Z";
            const INT_FLAG = "-1";
            const STRING_FLAG = " ";

            // add customer
            let filter = { mobile: req.body.customer.mobile, user: req.decodedData.user_employer }
            let customer = await this.model.Customer.findOne(filter)

            let params = {
                family: req.body.customer.family,
                mobile: req.body.customer.mobile,
                user: req.decodedData.user_employer
            }

            if (req.body.customer.birthday != TIME_FLAG)
                params.birthday = req.body.customer.birthday

            if (!customer)
                customer = await this.model.Customer.create(params)
            if (customer && !customer.birthday && req.body.customer.birthday != TIME_FLAG)
                customer.birthday = req.body.customer.birthday;

            // add order
            params = {
                products: req.body.products,
                customer: customer._id,
                provider: req.decodedData.user_employer,
                employee: req.decodedData.user_id,
                description: req.body.description
            }

            if (req.body.address != STRING_FLAG)
                params.address = req.body.address
            if (req.body.duration != INT_FLAG) {
                const event = new Date();
                event.setMinutes(event.getMinutes() + parseInt(req.body.duration));
                params.readyTime = event.toISOString()
            }

            let order = await this.model.Order.create(params)


            // add reminder
            if (req.body.reminder !== INT_FLAG) {

                // calculate date
                const event = new Date();
                event.setDate(event.getDate() + parseInt(req.body.reminder));

                params = {
                    date: event.toISOString(),
                    user: req.decodedData.user_employer,
                    customer: customer._id,
                    order: order._id
                }
                let reminder = await this.model.Reminder.create(params)

                // add reminder to customer
                await customer.reminder.push(reminder._id)
            }

            // add order to customer
            await customer.order.push(order._id)
            await customer.save()

            res.json({ success: true, message: 'سفارش شما با موفقیت ثبت شد' })

            let user = await this.model.User.findOne({ _id: req.decodedData.user_employer }, 'setting company')
            if (user.setting.order.preSms.status) {
                let message = ""
                if (user.company)
                    message = user.setting.order.preSms.text + ` \n${req.decodedData.user_company}`
                else
                    message = user.setting.order.preSms.text

                this.sendSms(req.body.customer.mobile, message)
            }
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addOrder')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getOrders(req, res) {
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

    async editOrderStatus(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('status', 'please set order status').notEmpty().isInt({ min: 0, max: 2 });
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            order.status = req.body.status
            await order.save()

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
                .method('editOrderStatus')
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
                .method('editOrderStatus')
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
                .method('editOrderStatus')
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
                .method('editOrderStatus')
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

}


