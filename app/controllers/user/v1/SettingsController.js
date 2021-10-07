
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Settings';

module.exports = new class SettingsController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Settings v1" });
    }


    async getOrderSetting(req, res) {
        try {

            let filter = { _id: req.decodedData.user_id }
            let user = await this.model.User.findOne(filter, 'setting')

            res.json({ success: true, message: "تنظیمات با موفقیت ارسال شد", data: user })

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

    async editSettingOrder(req, res) {
        try {
            req.checkBody('share', 'please enter share field').notEmpty();
            req.checkBody('share.time', 'please enter share time').notEmpty();
            req.checkBody('share.unitTime', 'please enter share unitTime').notEmpty().isString();
            req.checkBody('preSms', 'please enter preSms field').notEmpty();
            req.checkBody('preSms.text', 'please enter preSms text').exists().isString();
            req.checkBody('preSms.status', 'please enter preSms status').notEmpty().isBoolean();
            req.checkBody('postDeliverySms', 'please enter postDeliverySms field').notEmpty();
            req.checkBody('postDeliverySms.text', 'please enter postDeliverySms text').exists().isString();
            req.checkBody('postDeliverySms.status', 'please enter postDeliverySms status').notEmpty().isBoolean();
            req.checkBody('postCustomerSms', 'please enter postCustomerSms field').notEmpty();
            req.checkBody('postCustomerSms.text', 'please enter postCustomerSms text').exists().isString();
            req.checkBody('postCustomerSms.status', 'please enter postCustomerSms status').notEmpty().isBoolean();
            if (this.showValidationErrors(req, res)) return;


            let filter = { active: true, _id: req.decodedData.user_employer }
            let user = await this.model.User.findOne(filter)

            user.setting.order = req.body

            user.markModified('setting.order')
            await user.save();



            res.json({ success: true, message: "تنظیمات با موفقیت ویرایش شد" })

        } catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editSettingOrder')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }
}

