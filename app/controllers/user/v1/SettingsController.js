
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
                .method('getOrderSetting')
                .inputParams()
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editSettingOrder(req, res) {
        try {
            req.checkBody('order.share', 'please enter share field').notEmpty();
            req.checkBody('order.share.time', 'please enter share time').notEmpty().isNumeric();
            req.checkBody('order.share.unitTime', 'please enter share unitTime').notEmpty().isString();

            req.checkBody('lead.leadCountPerEmployee', 'please enter lead leadCountPerEmployee field').notEmpty();

            req.checkBody('order.reminder', 'please enter reminder field').notEmpty();
            req.checkBody('order.reminder.time', 'please enter reminder time').notEmpty().isNumeric();
            req.checkBody('order.reminder.unitTime', 'please enter reminder unitTime').notEmpty().isString();

            req.checkBody('order.duration', 'please enter duration field').notEmpty();
            req.checkBody('order.duration.time', 'please enter duration time').notEmpty().isNumeric();
            req.checkBody('order.duration.unitTime', 'please enter duration unitTime').notEmpty().isString();

            req.checkBody('order.preSms', 'please enter preSms field').notEmpty();
            req.checkBody('order.preSms.text', 'please enter preSms text').exists().isString();
            req.checkBody('order.preSms.status', 'please enter preSms status').notEmpty().isBoolean();

            req.checkBody('order.postDeliverySms', 'please enter postDeliverySms field').notEmpty();
            req.checkBody('order.postDeliverySms.text', 'please enter postDeliverySms text').exists().isString();
            req.checkBody('order.postDeliverySms.status', 'please enter postDeliverySms status').notEmpty().isBoolean();

            req.checkBody('order.postCustomerSms', 'please enter postCustomerSms field').notEmpty();
            req.checkBody('order.postCustomerSms.text', 'please enter postCustomerSms text').exists().isString();
            req.checkBody('order.postCustomerSms.status', 'please enter postCustomerSms status').notEmpty().isBoolean();

            if (this.showValidationErrors(req, res)) return;


            let filter = { active: true, _id: req.decodedData.user_employer }
            let user = await this.model.User.findOne(filter)

            user.setting = req.body

            user.markModified('setting')
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

