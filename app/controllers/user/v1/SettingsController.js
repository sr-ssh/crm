
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Settings';

module.exports = new class SettingsController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Settings v1" });
    }

    
    async getSms(req, res) {
        try {
            
            let filter = { _id: req.decodedData.user_id }
            let user = await this.model.User.findOne(filter, 'setting')

            res.json({ success: true, message: "با موفقیت انجام شد", data: user}) 

        } catch (err) {
                let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getSms')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editSms(req, res) {
        try {

            req.checkBody('type', 'please set the sms type').notEmpty().isInt({min: 1, max: 3});
            req.checkBody('status', 'please set the sms status').notEmpty().isBoolean();
            req.checkBody('text', 'please set the sms text').exists().isString();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active : true, _id: req.decodedData.user_employer }
            let user = await this.model.User.findOne(filter)
            let type = req.body.type

            switch (type) {
                case 1:
                    user.setting.order.preSms.status = req.body.status
                    user.setting.order.preSms.text = req.body.text
                    break;
                case 2:
                    user.setting.order.postDeliverySms.status = req.body.status
                    user.setting.order.postDeliverySms.text = req.body.text
                    break;
                case 3:
                    user.setting.order.postCustomerSms.status = req.body.status
                    user.setting.order.postCustomerSms.text = req.body.text
                    break;
                default:
                    break;
            }
        
            user.markModified('setting.order')
            await user.save();

            return res.json({ success : true, message : 'ویرایش با موفقیت انجام شد'})
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editSms')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


}


