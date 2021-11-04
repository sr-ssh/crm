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

