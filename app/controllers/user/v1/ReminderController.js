const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = "v1_Reminder";

module.exports = new (class ReminderController extends Controller {
  async index(req, res) {
    return res.json({ success: true, message: "Reminder v1" });
  }

  async addReminder(req, res) {
    try {
      req.checkBody("name", "please enter name").notEmpty().isString();
      req
        .checkBody("description", "please enter description")
        .optional({ nullable: true, checkFalsy: true })
        .notEmpty()
        .isString();
      req.checkBody("date", "please enter date").notEmpty().isISO8601();
      req
        .checkBody("typeReminder", "please enter typeReminder")
        .notEmpty()
        .isInt({ min: 0, max: 3 });
      req
        .checkBody("referenceId", "please enter referenceId")
        .notEmpty()
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId();

      if (this.showValidationErrors(req, res)) return;

      console.time("test addReminder");

      let param = {
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        user: req.decodedData.user_id,
      };

      switch (req.body.typeReminder) {
        case 0:
          break;
        case 1:
          let lead = await this.model.Lead.findOne({
            active: true,
            _id: req.body.referenceId,
            user: req.decodedData.user_employer,
          }).sort({ createdAt: -1 });
          if (!lead) {
            console.timeEnd("test addReminder");
            return res.json({
              success: true,
              message: "یادآوری ایجاد نشد",
              data: { success: false },
            });
          }

          param.leadReference = req.body.referenceId;

          break;
        case 2:
          let order = await this.model.Order.findOne({
            active: true,
            _id: req.body.referenceId,
            provider: req.decodedData.user_employer,
          }).sort({ createdAt: -1 });
          if (!order) {
            console.timeEnd("test addReminder");
            return res.json({
              success: true,
              message: "یادآوری ایجاد نشد",
              data: { success: false },
            });
          }

          param.orderReference = req.body.referenceId;

          break;
        case 3:
          let receipt = await this.model.Receipt.findOne({
            active: true,
            _id: req.body.referenceId,
            provider: req.decodedData.user_employer,
          }).sort({ createdAt: -1 });
          if (!receipt) {
            console.timeEnd("test addReminder");
            return res.json({
              success: true,
              message: "یادآوری ایجاد نشد",
              data: { success: false },
            });
          }

          param.factorReference = req.body.referenceId;
          break;
        default:
          break;
      }

      await this.model.Reminder.create(param, (err, doc) => {
        if (err) throw err;
        console.timeEnd("test addReminder");
        return res.json({
          success: true,
          message: "یادآوری با موفقیت ایجاد شد",
        });
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("addReminder")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async getReminders(req, res) {
    try {
      let today = new Date().toISOString();
      today = today.substr(0, 10) + "T00:00:00.000Z";
      let tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 1);
      tomorrow = tomorrow.toISOString().substr(0, 10) + "T00:00:00.000Z";

      let filter = {
        $and: [
          { active: true },
          { user: req.decodedData.user_employer },
          { date: { $gt: today } },
          { date: { $lt: tomorrow } },
        ],
      };

      let reminders = await this.model.Reminder.find(filter);

      let params = [];
      for (let index = 0; index < reminders.length; index++) {
        let param = {
          date: reminders[index].date,
          customer: reminders[index].customer,
          order: reminders[index].order,
        };
        params.push(param);
      }

      let customers = [];
      let orders = [];
      for (let index = 0; index < reminders.length; index++) {
        customers.push(reminders[index].customer);
        orders.push(reminders[index].order);
      }

      filter = { _id: { $in: customers } };
      customers = await this.model.Customer.find(filter, {
        _id: 1,
        family: 1,
        mobile: 1,
        birthday: 1,
      });

      filter = { _id: { $in: orders } };
      orders = await this.model.Order.find(filter);

      let customerInfo;
      let orderInfo;
      for (let index = 0; index < reminders.length; index++) {
        customerInfo = customers.find(
          (user) => user._id.toString() == reminders[index].customer
        );
        params[index].customer = customerInfo;
        orderInfo = orders.find(
          (order) => order._id.toString() == reminders[index].order
        );
        params[index].order = orderInfo;
      }

      return res.json({
        success: true,
        message: "لیست یادآوری با موفقیت ارسال شد",
        data: params,
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("getReminders")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }
})();
