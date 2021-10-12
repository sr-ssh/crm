
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Lead';
const ExcelJS = require('exceljs');
var path = require('path');
const fs = require('fs')

module.exports = new class LeadController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Lead v1" });
    }

    async addLead(req, res) {
        try {
            req.checkBody('family', 'please enter family').notEmpty().isString();
            req.checkBody('mobile', 'please enter mobile').notEmpty().isString();
            req.checkBody('description', 'please enter description').optional({nullable: true,checkFalsy: true}).isString();
            if (this.showValidationErrors(req, res)) return;

            let params = {
                family: req.body.family,
                mobile: req.body.mobile,
                user: req.decodedData.user_employer,
                description: req.body.description || ""
            }

            let filter = { mobile: params.mobile, user: params.user }
            let lead = await this.model.Lead.findOne(filter)
    
            if (lead && lead.status === 0)
                return res.json({ success: true, message: 'سرنخ وارد شده موجود است', data: { status: false } })

            await this.model.Lead.create(params)

            res.json({ success: true, message: 'سرنخ شما با موفقیت ثبت شد', data: { status: true } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addLead')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


