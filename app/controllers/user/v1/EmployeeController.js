
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Employee';


module.exports = new class EmployeeController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Employee v1" });

    }

    async addEmployee(req, res) {
        try {
            req.checkBody('usernameOrMobile', 'please enter username or mobile').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let filter = { $or: [{ username: req.body.usernameOrMobile }, { mobile: req.body.usernameOrMobile }]}
            let user = await this.model.User.findOne(filter)
            if(!user)
                return res.json({ success: false, message: 'کاربر موجود نمی باشد'})
            
            filter = {_id: user._id}
            let update = { employer: req.decodedData.user_id }
            await this.model.User.findOneAndUpdate(filter, update)
            update = { $addToSet: { employee: user._id}}
            await this.model.User.findByIdAndUpdate(req.decodedData.user_id, update)

            return res.json({ success: true, message: 'کاربر با موفقیت اضافه شد'})
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('addEmployee')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    
    async changeEmployeePermission(req, res) {
        try {

            req.checkBody('_id', 'please enter employee id').notEmpty().isString();
            req.checkBody('permissions', 'please enter employee permissions').notEmpty();
            req.checkBody('permissions.*.no', 'please enter permissions number').notEmpty();
            req.checkBody('permissions.*.status', 'please enter permissions status').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            let filter = { active: true, _id: req.decodedData.user_id}
            let employer = await this.model.User.findOne(filter)

            if(!employer.employee.includes(req.body._id))
                return res.json({ success: false, message: "کاربر وارد شده جزو کامندان شما نمی باشد" })

            filter = { active: true, _id: req.body._id }
            let employee = await this.model.User.findOne(filter)

            if(!employee)
                return res.json({ success: false, message: "کاربر وارد شده موجود نمی باشد" })

            employee.permission = req.body.permissions
            await employee.save()  

            return res.json({ success: true, message: "دسترسی های کارمند خواسته شده با موفقیت تغییر پیدا کرد" })
            
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getEmployees')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async getEmployees(req, res) {
        try {

            let filter = { active: true, _id: req.decodedData.user_id }
            let employer = await this.model.User.findOne(filter, { employee: 1 })

            let employees = [];
            for (let j = 1; j < employer.employee.length; j++) {
                employees.push(employer.employee[j])
            }

            filter = { active: true, _id: { $in: employees }}
            employees = await this.model.User.find(filter, { family: 1, mobile: 1, permission: 1 })

            return res.json({ success: true, message: "کارمندان با موفقیت فرستاده شدند", data: employees})
            
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getEmployees')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


}


