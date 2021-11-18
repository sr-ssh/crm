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

      console.time("test getReminders")
      let today = new Date(new Date().setHours(0, 0, 0)).toISOString();
      let tomorrow = new Date(
        new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0)
      ).toISOString();

      let filter = {
        $and: [
          { active: true },
          { user: req.decodedData.user_id },
          { date: { $gt: today } },
          { date: { $lt: tomorrow } },
        ],
      };

      let reminders = await this.model.Reminder.find(filter , { _id: 0 , __v : 0 , user : 0 })
          .populate([
            { path: "orderReference", model: "Order" , select : "status" },
            // { path: "leadReference", model: "Lead" },
            // { path: "factorReference", model: "Receipt"}
          ])
        .sort({ createdAt: -1 });

        console.timeEnd("test getReminders")

      return res.json({
        success: true,
        message: "لیست یادآوری با موفقیت ارسال شد",
        data: reminders,
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("getReminders")
        .inputParams(req.params)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }
})();
