
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = 'v1_Home';
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");


module.exports = new class HomeController extends Controller {

    async index(req, res) {
        return res.json({ success: true, message: "Home v1" });

    }

    async register(req, res) {
        try {
            req.checkBody('password', 'please enter password').notEmpty();
            req.checkBody('family', 'please enter family').notEmpty().isString();
            req.checkBody('email', 'please enter email').notEmpty().isEmail();
            req.checkBody('mobile', 'please enter mobile').notEmpty().isNumeric();
            req.checkBody('code', 'please enter code').notEmpty();
            req.checkBody('position', 'please enter user position').notEmpty().isInt({ min: 1, max: 2 });

            //employer
            if (req.body.position === 1) {
                req.checkBody('companyName', 'please enter company name').notEmpty().isString();
                req.checkBody('companyAddress', 'please enter company address').notEmpty().isString();
            }

            //employee
            if (req.body.position === 2) {
                req.checkBody('employerMobile', 'please enter employer mobile').notEmpty().isString();
            }

            if (this.showValidationErrors(req, res)) return;

            const STRING_FLAG = " ";
            const EMAIL_FLAG = "a@a.com";

            // save in mongodb
            let params = {
                type: req.body.position,
                password: req.body.password,
                family: req.body.family,
                mobile: req.body.mobile
            }


            if (req.body.email !== EMAIL_FLAG)
                params.email = req.body.email

            let filter = { mobile: params.mobile };
            let user = await this.model.User.findOne(filter);

            if (user)
                return res.json({ success: false, message: "شماره موبایل قبلا برای حساب دیگری استفاده شده است" });

            if (req.body.email !== EMAIL_FLAG) {
                filter = { email: params.email };
                user = await this.model.User.findOne(filter);
                if (user)
                    return res.json({ success: false, message: "این ایمیل قبلا برای حساب دیگری استفاده شده است" });
            }

            //verification code
            filter = { code: req.body.code, mobile: req.body.mobile }

            let veriCode = await this.model.VerificationCode.find(filter).sort({ createdAt: -1 }).limit(1)
            veriCode = veriCode[0]
            if (!veriCode)
                return res.json({ success: false, message: "کد تایید صحیح نمی باشد", data: {} });
            // timeDiff on verification code unit
            let timeDiff = this.getTimeDiff(veriCode.createdAt.toISOString(), new Date().toISOString(), config.verificationCodeUnit)
            // check verification code valid duration
            if (timeDiff > config.verificationCodeDuration)
                return res.json({ success: false, message: "کد تایید منقضی شده است", data: {} });

            //remove the code
            await this.model.VerificationCode.findOneAndRemove({ _id: veriCode._id })

            //employer
            if (req.body.position === 1) {
                params.company = req.body.companyName
                params.address = req.body.companyAddress
                params.setting = {
                    order: {
                        share: { time: 1, unitTime: "D" },
                        preSms: { text: config.addOrderSms, status: false },
                        postDeliverySms: { text: "", status: false },
                        postCustomerSms: { text: config.deliveryAcknowledgeSms, status: false },
                        reminder: { time: 7, unitTime: "D" },
                        duration: { time: 1, unitTime: "H"}
                    },
                    lead: {
                        leadCountPerEmployee: 5
                    }
                }
                params.permission = {
                    addOrder: true,
                    getOrders: true,
                    saleOpprotunity: true,
                    reminder: true,
                    getProducts: true,
                    finance: true,
                    getCustomers: true,
                    getEmployees: true,
                    getDiscounts: true,
                    getAllSaleOpprotunity: true
                }
            }

            let employer;
            if (req.body.position === 2) {
                filter = { active: true, mobile: req.body.employerMobile, type: 1 }
                employer = await this.model.User.findOne(filter, { id: 1 })
                if (!employer)
                    return res.json({ success: false, message: " کارفرمایی با این شماره یافت نشد" });
            }

            user = await this.model.User.create(params);

            if (req.body.position === 1) {
                user.employer = user._id;
                await user.save()
            }


            if (req.body.position === 2) {

                //make a job application for employer
                let params = {
                    employer: employer._id,
                    employee: user._id
                }
                await this.model.Application.create(params)

            }

            //token
            let options = {
                expiresIn: config.idTokenExpire,
                algorithm: config.algorithm,
                issuer: config.issuer,
                audience: config.audience
            }
            let payload = {
                user_id: user._id,
                user_active: user.active,
                user_employer: user.employer,
                user_company: user.company ? user.company : null,
                user_type: req.body.position
            }
            let idToken = jwt.sign(payload, config.secret, options)

            options = {
                expiresIn: config.accesssTokenExpire,
                algorithm: config.algorithm,
                issuer: config.issuer,
                audience: config.audience
            }

            payload = { scope: config.userScope };

            let accessToken = jwt.sign(payload, config.secret, options)

            let data = { idToken, accessToken };

            return res.json({ success: true, message: "کاربر با موفقیت ثبت شد", data: data });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('register')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async appInfo(req, res) {
        try {
            req.checkBody('versionCode', 'please enter versionCode').notEmpty();
            req.checkBody('os', 'please enter os').notEmpty();

            if (this.showValidationErrors(req, res)) return;

            if (!req.decodedData.user_active)
                return res.json({ success: false, message: "کاربر بلاک می باشد", data: {} })

            // save in mongodb
            let filter = { os: req.body.os, version: req.body.versionCode }
            let updateInfo = await this.model.AppInfo.find(filter).sort({ createdAt: -1 }).limit(1)
            updateInfo = updateInfo[0]
            if (!updateInfo)
                return res.json({ success: true, message: "اطلاعات نرم افزار فرستاده شد", data: {} });

            let data = { active: true, update: updateInfo.update, isForce: updateInfo.isForce, updateUrl: updateInfo.updateUrl }
            return res.json({ success: true, message: "اطلاعات نرم افزار فرستاده شد", data: data });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('appInfo')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }


    async login(req, res) {
        try {
            req.checkBody('mobileOrEmail', 'please enter mobile or email').notEmpty();
            req.checkBody('password', 'please enter password').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            // save in mongodb
            let filter = { $or: [{ mobile: req.body.mobileOrEmail }, { email: req.body.mobileOrEmail }] };
            let user = await this.model.User.findOne(filter);
            if (!(user && user.active))
                return res.json({ success: false, message: "کاربر در دسترس نمی باشد", data: {} });

            let status = await bcrypt.compare(req.body.password, user.password)
            if (!status)
                return res.json({ success: false, message: "رمزعبور صحیح نمی باشد", data: {} });

            let options = {
                expiresIn: config.idTokenExpire,
                algorithm: config.algorithm,
                issuer: config.issuer,
                audience: config.audience
            }
            let payload = {
                user_id: user._id,
                user_active: user.active,
                user_employer: user.employer,
                user_company: user.company ? user.company : null,
                user_type: user.type
            }
            let idToken = jwt.sign(payload, config.secret, options)

            options = {
                expiresIn: config.accesssTokenExpire,
                algorithm: config.algorithm,
                issuer: config.issuer,
                audience: config.audience
            }

            payload = { scope: config.userScope };

            let accessToken = jwt.sign(payload, config.secret, options)

            let data = { idToken, accessToken };

            return res.json({ success: true, message: "کاربر با موفقیت وارد شد", data: data });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('login')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

    async verificationCode(req, res) {
        try {
            req.checkBody('mobile', 'please enter mobile').notEmpty();
            if (this.showValidationErrors(req, res)) return;

            // save in mongodb
            let filter = { mobile: req.body.mobile };

            //code generation
            let code;

            //check if the last code is steel valid
            let lastCode = await this.model.VerificationCode.find(filter).sort({ createdAt: -1 }).limit(1)
            lastCode = lastCode[0]
            if (lastCode) {
                // timeDiff on verification code unit
                let timeDiff = this.getTimeDiff(lastCode.createdAt, new Date().toISOString(), config.verificationCodeUnit)
                // check verification code valid duration
                if (timeDiff < config.verificationCodeDuration) {
                    code = lastCode.code
                    this.sendSms(req.body.mobile, config.verificationCodeText + code)
                    return res.json({ success: true, message: "کد تاییدیه به شماره موبایل داده شده ، با موفقیت فرستاده شد" });
                }

            }

            //generate new code

            //generate random number
            code = this.generateRandomNumber();
            this.sendSms(req.body.mobile, config.verificationCodeText + code)

            //save in mongo
            let params = {
                mobile: req.body.mobile,
                code: code
            }

            await this.model.VerificationCode.create(params);


            return res.json({ success: true, message: "کد تاییدیه به شماره موبایل داده شده ، با موفقیت فرستاده شد" });
        }
        catch (err) {
            let handelError = new this.transforms.ErrorTransform(err)
                .parent(this.controllerTag)
                .class(TAG)
                .method('verificationCode')
                .inputParams(req.body)
                .call();

            if (!res.headersSent) return res.status(500).json(handelError);
        }
    }

}


