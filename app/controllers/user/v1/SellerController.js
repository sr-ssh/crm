const ExcelJS = require('exceljs');
var path = require('path');
const fs = require('fs');

const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Seller';


module.exports = new class SellerController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Seller v1" });
    }

    async addSeller(req, res) {
        try {
            req.checkBody('phone', 'please enter phone').notEmpty().isNumeric();
            req.checkBody('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkBody('family', 'please enter family').notEmpty().isString();
            req.checkBody('company', 'please enter company').notEmpty().isString();
            req.checkBody('cardNumber', 'please enter cardNumber').notEmpty().isNumeric();
            req.checkBody('address', 'please enter address').notEmpty().isString();
            req.checkBody('description', 'please enter description').optional({nullable: true,checkFalsy: true}).isString();
            if (this.showValidationErrors(req, res)) return;

            let params = {
                family: req.body.family,
                phone: req.body.phone,
                mobile: req.body.mobile,
                company: req.body.company,
                address: req.body.address,
                user: req.decodedData.user_employer,
                cardNumber: req.body.cardNumber,
                description: req.body.description || ""
            }

            let seller = await this.model.Seller.findOne({ phone: req.body.phone })
            if(seller)
                return res.json({ success: true, message: 'فروشنده ای با این تلفن موجود است', data: { status: false } })
            
            await this.model.Seller.create(params)
         
            res.json({ success: true, message: 'فروشنده با موفقیت ثبت شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addSeller')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async getSellers(req, res) {
        try {

            req.checkParams('company', 'please set company').notEmpty().isString();
            req.checkParams('phone', 'please set phone').notEmpty().isString();
            req.checkParams('mobile', 'please set mobile').notEmpty().isString();
            req.checkParams('address', 'please set address').notEmpty().isString();
            if (this.showValidationErrors(req, res)) return;


            let filter = {};
            if(req.params.phone)
                filter.phone = req.body.phone
            if(req.params.mobile)
                filter.phone = req.body.mobile
            
            let sellers = await this.model.Seller.find(filter).sort({ createdAt: -1 }).lean();


            if (req.params.company !== " ")
            sellers = sellers.filter(param => {
                    if (param.company) {
                        let re = new RegExp(req.params.company, "i");
                        let find = param.company.search(re);
                        return find !== -1;
                    }
                })

            if (req.params.address !== " ")
            sellers = sellers.filter(param => {
                    if (param.address) {
                        let re = new RegExp(req.params.address, "i");
                        let find = param.address.search(re);
                        return find !== -1;
                    }
                })
        
            // getOrderParams_V1.status
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
                    financialApproval: orders[index].financialApproval,
                    sellers: orders[index].sellers
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
                .method('getSellers')
                .inputParams(req.params)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}

