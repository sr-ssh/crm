
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
                addUser: req.decodedData.user_id,
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

    async getLeads(req, res) {
        try {
            let filter = { 
                user: req.decodedData.user_employer, 
                active: true, status: 0, 
                $or: [ 
                    {
                        $and: [
                            {accepted: true}, 
                            {acceptUser: req.decodedData.user_id}
                        ]
                    },
                    {
                        accepted: false
                    }
                ]
            }
            let leads = await this.model.Lead.find(filter, { _id: 1, family: 1, accepted: 1, mobile: 1, description: 1}).sort({  accepted: -1 , createdAt: -1});
            res.json({ success: true, message: 'سرنخ ها با موفقیت ارسال شد', data: leads })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('getLeads')
                .inputParams(req.params)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async uploadExcel(req, res) {
        try {

            // get path File that was uploaded by user
            let pathExcelFile = path.resolve(`./tmp/user${req.decodedData.user_employer}${path.extname(req.file.originalname)}`)

            let leadUser = []
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(pathExcelFile);
            let worksheet = workbook.getWorksheet(1);
            // read Excel file
            worksheet.eachRow({ includeEmpty: true }, async (row, rowNumber) => {

                if (rowNumber == 1)
                    return

                const pattOnlyNum = /^[0-9]+$/;
                const pattAlphanumeric = /^[آ-یa-zA-Z 0-9\s]+[آ-یa-zA-Z 0-9\s]+$(\.0-9+)?/;

                let params = {
                    updateOne: {
                        filter: { 
                            user: req.decodedData.user_employer , 
                            $and: [ 
                                {mobile: pattOnlyNum.test(row.values[2]) ? row.values[2] : null}, 
                                {satus: {$ne:0}}
                            ]
                        },
                        update :{
                            family: pattAlphanumeric.test(row.values[1]) ? row.values[1] : null,
                            addUser: req.decodedData.user_id,
                        },
                        upsert: true
                    }
                }
                if (row.values[3])
                    params.updateOne.update.description = row.values[3]
                // if (params.family != null && params.mobile != null)
                    leadUser.push(params)

            })
            // Delete Excel file that was sent to upload
            fs.unlinkSync(pathExcelFile)
            console.log(leadUser)
            await this.model.Lead.bulkWrite({
                leadUser
            })

            // // find User leads
            // let filter = { user: req.decodedData.user_employer }
            // let leads = await this.model.Product.find(filter).sort({ createdAt: -1 });


            // for (let index = 0; index < leadUser.length; index++) {

            //     let find = products.find(item => item.name.trim() == leadUser[index].name.trim())

            //     // if Product existed it'll be updated if not it will create new one
            //     if (find !== undefined) {

            //         let param = {
            //             active: leadUser[index].active,
            //             name: find.name,
            //             sellingPrice: leadUser[index].sellingPrice
            //         }

            //         if (leadUser[index].description)
            //             param.description = leadUser[index].description

            //         let filter = { _id: find._id }
            //         await this.model.Product.findOneAndUpdate(filter, param)
            //     } else {
            //         await this.model.Product.create(leadUser[index])
            //     }
            // }

            res.json({ success: true, message: 'سرنخ ها با موفقیت ایجاد شد' })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('uploadExcel')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async editLeadStatus(req, res) {
        try {
            req.checkBody('leadId', 'please enter family').notEmpty().isString();
            req.checkBody('status', 'please enter mobile').notEmpty().isIn[0, 1]; // 0 -> accept lead, 1 -> fail lead
            if (this.showValidationErrors(req, res)) return;
            let filter = { _id: req.body.leadId }
            let update;

            if(req.body.status == 0){
                let settings = await this.model.User.findOne({ _id: req.decodedData.user_employer }, 'setting')
                let userAcceptCount = await this.model.User.findOne({ _id: req.decodedData.user_id })
                if(settings.setting.lead.leadCountPerEmployee > userAcceptCount.acceptedLeadCount){
                    update = { accepted: true, acceptUser: req.decodedData.user_id }
                    userAcceptCount.acceptedLeadCount = userAcceptCount.acceptedLeadCount + 1
                    await userAcceptCount.save()
                } else return res.json({ success: true, message: 'تعداد سرنخ های شما به حد نصاب رسیده است', data: { status: false } })
                   
            } else if(req.body.status == 1){
                update = { status: 1, active: false }
            }
            await this.model.Lead.updateOne(filter, update)

            res.json({ success: true, message: 'سرنخ شما با موفقیت ثبت شد', data: { status: true } })
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('editLeadStatus')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


