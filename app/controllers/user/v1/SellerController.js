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
                marketer: req.decodedData.user_id,
                cardNumber: req.body.cardNumber,
                description: req.body.description || ""
            }

            let seller = await this.model.Seller.findOne({ phone: req.body.phone })
            if(seller)
                return res.json({ success: false, message: 'فروشنده ای با این تلفن موجود است', data: { status: false } })
            
            await this.model.Seller.create(params)
         
            res.json({ success: true, message: 'فروشنده با موفقیت ثبت شد', data: {} })
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


            let filter = { user: req.decodedData.user_employer };
            if(req.params.phone !== " ")
                filter.phone = req.params.phone
            if(req.params.mobile !== " ")
                filter.mobile = req.params.mobile
            
            let sellers = await this.model.Seller.find(filter, 'phone mobile family company cardNumber address description marketer').sort({ createdAt: -1 }).populate('marketer', 'family').lean();


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
        


            return res.json({ success: true, message: 'فرشنده ها با موفقیت ارسال شد', data: sellers })
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


    async getSeller(req, res) {
        try {

            req
              .checkParams("mobile", "please enter seller mobile")
              .notEmpty()
              .isNumeric();
            if (this.showValidationErrors(req, res)) return;

            let filter = {
              active: true,
              user: req.decodedData.user_employer,
              mobile: req.params.mobile,
            };

            let seller = await this.model.Seller.findOne(filter, {
              family: 1,
              mobile: 1,
              phone: 1,
              company: 1,
              address: 1,
              cardNumber: 1,
              description: 1,
            }).lean();
            if (!seller)
              return res.json({
                success: true,
                message: "فروشنده موجود نیست",
                data: { status: false },
              });

            return res.json({
              success: true,
              message: "اطلاعات فروشنده با موفقیت ارسال شد",
              data: seller,
            });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getSeller')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}

