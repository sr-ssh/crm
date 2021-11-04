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
}

