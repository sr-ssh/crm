const { filterSeries } = require("async");
const { param } = require("../../../routes");
const path = require('path')
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

    async addOrderV1(req, res) {
        try {
            req.checkBody('products', 'please enter products').notEmpty();
            req.checkBody('products.*._id', 'please enter product id').notEmpty();
            req.checkBody('products.*.quantity', 'please enter product quantity').notEmpty();
            req.checkBody('products.*.sellingPrice', 'please enter product sellingPrice').notEmpty();
            req.checkBody('products.*.ingredients.*.stock', 'please enter product ingredients').notEmpty();
            req.checkBody('products.*.ingredients.*.stock._id', 'please enter product ingredients').notEmpty();
            req.checkBody('products.*.ingredients.*.amount', 'please enter product ingredients').notEmpty();
            req.checkBody('products.*.checkWareHouse', 'please enter product checkWareHouse').notEmpty();
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
            let FORCE = 0

         if ((req.body.status === 3 && req.body.force == FORCE) || (req.body.status == '') ){

            let productsfilter = req.body.products.filter(item => item.checkWareHouse == true )

            let products = []
            for (let index = 0; index < productsfilter.length; index++) {
                for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
                    products.push(productsfilter[index].ingredients[j].stock._id)
                }
            }
            let  filter = { _id: { $in: products } }
            let  stocks = await this.model.Stock.find(filter, {name: 1, description: 1, active: 1, updatedAt: 1, amount: 1})

            let isAmountOk=[]

            for (let index = 0; index < productsfilter.length; index++) {
                for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
                   let stocksInfo = stocks.find(stocks => (stocks._id.toString() === productsfilter[index].ingredients[j].stock._id.toString() && stocks.amount < productsfilter[index].quantity )  )
                    if (stocksInfo)                    
                        isAmountOk.push({name : stocksInfo.name , amount :  productsfilter[index].quantity - stocksInfo.amount  } )
                }
            }
            if(isAmountOk.length > 0 ){
                if(req.body.status === 3)
                     return  res.json({ success: false, message: 'عملیات نا موفق' , data : isAmountOk , dialogTrigger : true  })
                else if (req.body.status == "")
                     return      res.json({ success: false, message: 'موجودی موارد انتخاب شده به اتمام رسیده است.' , dialogTrigger : false  })
            }
        }
            // add customer
            let filter = { mobile: req.body.customer.mobile, user: req.decodedData.user_employer }
            let customer = await this.model.Customer.findOne(filter)

            let params = {
                family: req.body.customer.family,
                mobile: req.body.customer.mobile,
                user: req.decodedData.user_employer,
                company: req.body.customer.company
            }

            if (req.body.customer.birthday != TIME_FLAG)
                params.birthday = req.body.customer.birthday

            if (!customer)
                customer = await this.model.Customer.create(params)
            if (customer && !customer.birthday && req.body.customer.birthday != TIME_FLAG)
                customer.birthday = req.body.customer.birthday;

            if (req.body.notes.length > 0)
                req.body.notes = req.body.notes.map(item => { return { ...item, writtenBy: req.decodedData.user_id, private: false } })

            let trimProducts = req.body.products.map(pro => {return {
                _id: pro._id,
                quantity: pro.quantity,
                sellingPrice: pro.sellingPrice
            }})

            // add order
            params = {
                products: trimProducts,
                notes: req.body.notes,
                customer: customer._id,
                provider: req.decodedData.user_employer,
                financialApproval: { status: false }
            }

            if (req.body.address != STRING_FLAG)
                params.address = req.body.address
            if (req.body.duration != INT_FLAG) {
                const event = new Date();
                event.setMinutes(event.getMinutes() + parseInt(req.body.duration));
                params.readyTime = event.toISOString()
            }
            if (req.body.status === 3){
                params.status = req.body.status  
                params.sellers = [{id: req.decodedData.user_id, active : true}]
            }
                
            if(req.body.status === "")
                params.employee = req.decodedData.user_id,          

            //remove lead
            filter = { user: req.decodedData.user_employer, mobile: customer.mobile, status: { $ne: 2 } }
            let lead = await this.model.Lead.findOneAndUpdate(filter, {status: 2, active: false})
            if(lead)
                params.lead = lead._id

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
            if (req.body.status !== 3)
                customer.successfullOrders = customer.successfullOrders + 1;
            if (req.body.address != STRING_FLAG)
                customer.lastAddress = req.body.address
            customer.company = req.body.customer.company
            await customer.save()

             //reduce stock amount
            if (req.body.status !== 3){
                let update = []
                req.body.products.map(product => {
                    if (product.checkWareHouse){
                        product.ingredients.map(ing => {
                            update.push({
                                updateOne : {
                                    filter : { _id : ing.stock._id },
                                    update : { $inc : {  amount : 0-(parseInt(ing.amount) * product.quantity) } } 
                                } 
                            })
                        })
                    } 
                })
                await this.model.Stock.bulkWrite(update)
            }
           
            
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
                .method('addOrderV1')
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
            customers = await this.model.Customer.find(filter, { _id: 1, family: 1, mobile: 1, createdAt: 1, nationalCard: 1, financialCode: 1, postalCode: 1, registerNo: 1 })


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


    async getOrdersV1(req, res) {
        try {

            req.checkParams('status', 'please set status').exists();
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

            if (req.params.status == 3)
                filter = { status: 3, ...filter };
            else
                filter = { status: 0, ...filter };


            let orders = await this.model.Order.find(filter).populate({ path: 'notes.writtenBy', model: 'User', select: 'family' }).sort({ createdAt: -1 });

            let params = [];
            for (let index = 0; index < orders.length; index++) {
                let param = {
                    id: orders[index]._id,
                    active: orders[index].active,
                    status: orders[index].status,
                    products: orders[index].products,
                    notes: orders[index].notes,
                    customer: orders[index].customer,
                    address: orders[index].address,
                    readyTime: orders[index].readyTime,
                    createdAt: orders[index].createdAt,
                    updatedAt: orders[index].updatedAt,
                    employee: orders[index].employee,
                    financialApproval: orders[index].financialApproval
                }
                params.push(param)
            }

            let customers = []
            for (let index = 0; index < orders.length; index++) {
                customers.push(orders[index].customer)
            }

            filter = { _id: { $in: customers } }
            customers = await this.model.Customer.find(filter, { _id: 1, family: 1, mobile: 1, company: 1, nationalCard: 1, financialCode: 1, postalCode: 1, registerNo: 1, createdAt: 1 })

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

            let financialApproval = []
            for (let index = 0; index < params.length; index++) {
                if (params[index].financialApproval.status !== 0)
                    financialApproval.push(params[index].financialApproval.acceptedBy)
                else
                    financialApproval.push(null)

            }
            filter = { _id: { $in: financialApproval } }
            financialApproval = await this.model.User.find(filter, { _id: 1, family: 1 })

            for (let index = 0; index < params.length; index++) {
                let financialApprovalInfo;
                if (params[index].financialApproval.status !== 0) {
                    let data = financialApproval.filter(item => item._id.toString() === params[index].financialApproval.acceptedBy)
                    if (data.length > 0)
                        financialApprovalInfo = data[0]
                    if (financialApprovalInfo)
                        params[index].financialApproval.acceptedBy = financialApprovalInfo.family
                }
            }
            let paramsNote;
            let dataNote;
            let isPrivate;

            for (let noteIndex = 0; noteIndex < params.length; noteIndex++) {
                if (params[noteIndex].notes.length > 0) {
                    dataNote = params[noteIndex].notes.filter(item => item.private === false)
                    paramsNote = params[noteIndex].notes.filter(item => (item.private === true && item.writtenBy._id.toString() === req.decodedData.user_id))

                    if (paramsNote.length > 0) {
                        isPrivate = true;
                        paramsNote = paramsNote.reduce((result, item) => {
                            result = item;
                            dataNote.push(result)
                        }, {});
                    } else {
                        isPrivate = false;
                    }

                    dataNote.map(item => {
                        item.writtenBy = item.writtenBy?.family
                        return item
                    })
                    params[noteIndex].notes = { Notes: dataNote, isPrivate: isPrivate };
                }

            }



            return res.json({ success: true, message: 'سفارشات با موفقیت ارسال شد', data: params })


        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getOrdersV1')
                .inputParams(req.params)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editOrderStatus(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty();
            req.checkBody('status', 'please set order status').notEmpty().isIn[0, 1, 2, 4];
            // 0 -> successfull order, 4 -> fail sale opprtunity, 2 -> cancel order 
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.body.orderId, provider: req.decodedData.user_employer }
            let order = await this.model.Order.findOne(filter).populate({path: 'products._id', model: 'Product'})

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            order.status = req.body.status
            await order.save()

            //return stock amount
            if(req.body.status == 2){
                let update = []
                order.products.map(product => {
                    if (product._id.checkWareHouse){
                        product._id.ingredients.map(ing => {
                            update.push({
                                updateOne : {
                                    filter : { _id : ing.stock._id },
                                    update : { $inc : {  amount : (parseInt(ing.amount) * product.quantity) } } 
                                } 
                            })
                        })
                    } 
                })
                await this.model.Stock.bulkWrite(update)
            }

            filter = { active: true, _id: order.customer, user: req.decodedData.user_employer }
            let customer = await this.model.Customer.findOne(filter)

            switch (order.status) {
                case 0:
                    customer.successfullOrders = customer.successfullOrders + 1;
                    break;
                case 4:
                    customer.failOrders = customer.failOrders + 1;
                    break;
                case 2:
                    customer.failOrders = customer.failOrders + 1;
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




    async getOrdersNotes(req, res) {
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
            req.checkBody('address', 'please enter address').exists().isString();
            req.checkBody('companyName', 'please enter companyName').optional({ nullable: true, checkFalsy: true }).isString();
            req.checkBody('products.*._id', 'please enter product id').notEmpty();
            req.checkBody('products.*.quantity', 'please enter product quantity').notEmpty();
            req.checkBody('products.*.sellingPrice', 'please enter product sellingPrice').notEmpty();
            req.checkBody('nationalCard', 'please enter customer nationalCard').optional({ nullable: true, checkFalsy: true }).isNumeric();
            req.checkBody('financialCode', 'please enter customer financialCode').optional({ nullable: true, checkFalsy: true }).isNumeric();
            req.checkBody('postalCode', 'please enter customer postalCode').optional({ nullable: true, checkFalsy: true }).isNumeric();
            req.checkBody('registerNo', 'please enter customer registerNumber').optional({ nullable: true, checkFalsy: true }).isNumeric();
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


            filter = { _id: order.customer }
            let update = {
                nationalCard: req.body.nationalCard,
                financialCode: req.body.financialCode,
                postalCode: req.body.postalCode,
                registerNo: req.body.registerNo,
                company: req.body.companyName
            }

            await this.model.Customer.update(filter, update);
            // let customer = await this.model.Customer.findOne(filter)

            // customer.markModified('company')
            // await customer.save()

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
                    params.provider = orders[index].provider,
                    params.description = orders[index].description
            }


            filter = { _id: params.customer }
            let customers = await this.model.Customer.find(filter, { _id: 1, family: 1, mobile: 1, createdAt: 1 })

            let customerInfo = customers.find(user => user._id.toString() == params.customer)
            params.customer = customerInfo;


            filter = { _id: params.provider }
            let provider = await this.model.User.find(filter, { _id: 1, family: 1, address: 1 })

            let providerInfo = provider.find(user => user._id.toString() == params.provider)
            params.provider = providerInfo;


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

            orders.map((item, index) => {
                if (item._id.toString() === req.params.orderId) {
                    item.sharelink.map(item => {
                        if (item._id === req.params.keylink)
                            params.invoiceType = item.type
                    })
                }
            })


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
            req.checkBody('type', 'please set type').notEmpty().isInt({ min: 0, max: 1 });

            if (this.showValidationErrors(req, res)) return;


            const Minutes = 60000;
            const Hour = 3600000;
            const Day = 86400000;
            const id = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
            let type = req.body.type == 0 ? 0 : req.body.type == 1 ? 1 : null;
            let params = { _id: id, type: type, createdAt: new Date().toISOString(), createdBy: req.decodedData.user_id };
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

            if (!order)
                return res.json({ success: false, message: 'سفارش موجود نیست' })

            if(req.body.type == 0){
                let customer = await this.model.Customer.findOne({
                    _id: order.customer, 
                    nationalCard: { $exists: true }, 
                    financialCode: { $exists: true },  
                    postalCode: { $exists: true }, 
                    registerNo: { $exists: true }
                })
                if(!customer)
                    return res.json({ success: true, message: 'لطفا اطلاعات مشتری را از طریق ویرایش سفارش کامل کنید.', data: { status: false } })

                let provider = await this.model.User.findOne({
                    _id: order.provider, 
                    nationalCode: { $exists: true }, 
                    financialCode: { $exists: true },  
                    postalCode: { $exists: true }, 
                    registerNo: { $exists: true },
                    nationalIDCode: { $exists: true }
                })
                if(!provider)
                    return res.json({ success: true, message: 'لطفا اطلاعات کارفرما را از طریق اکانت کارفرما کامل کنید.', data: { status: false } })
            }


            order.sharelink.push(params)
            order.markModified('sharelink')
            await order.save()

            return res.json({ success: true, message: 'لینک اشتراک گذاری با موفقیت ارسال شد', data: { status: true, orderId: req.body.orderId, keyLink: params._id } })


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


    async confirmFinancial(req, res) {
        try {

            req.checkBody('orderId', 'please set order id').notEmpty().isMongoId();
            req.checkBody('status', 'please set order id').notEmpty().isIn[1, 2];
            if (this.showValidationErrors(req, res)) return;

            let params = { status: req.body.status, acceptedAt: new Date().toISOString(), acceptedBy: req.decodedData.user_id };

            let filter = { active: true, _id: req.body.orderId }

            let order = await this.model.Order.findOne(filter)

            if (!order)
                return res.json({ success: true, message: 'سفارش موجود نیست', data: { status: false } })

            if(order.financialApproval !== 1){
                order.financialApproval = params
                order.markModified('financialApproval')
                await order.save()
            }

            return res.json({ success: true, message: 'وضعیت مالی سفارش ثبت شد', data: { status: true } })

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('confirmFinancial')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }



    async uploadDocuments(req, res) {
        try {
            req.checkBody('fileName', 'please set your fileName').notEmpty().isString();
            req.checkBody('orderId', 'please set your orderId').notEmpty().isMongoId();
            if (this.showValidationErrors(req, res)) return;

            let filter = { _id: req.body.orderId }
            let extname = path.extname(req.file.originalname).toLowerCase()

            let update = { $push: { documents: { name: req.body.fileName, key: req.file.key, location: req.file.location, size: req.file.size, fileType: extname.substr(1) } } }

            await this.model.Order.update(filter, update)

            return res.json({ success: true, message: 'مدرک اضافه شد' })

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('uploadDocuments')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async showDocuments(req, res) {
        try {
            req.checkParams('orderId', 'please set your orderId').notEmpty().isMongoId();
            if (this.showValidationErrors(req, res)) return;

            let filter = { _id: req.params.orderId, }
            let documents = await this.model.Order.findOne(filter)

            return res.json({ success: true, message: 'مدارک سفارش با موفقیت فرستاده شد', data: documents.documents })

        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('showDocuments')
                .inputParams(req.params)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }
}


