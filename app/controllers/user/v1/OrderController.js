const path = require("path");
const Controller = require(`${config.path.controllers.user}/Controller`);
const TAG = "v1_Order";
const ObjectId = require("mongoose").Types.ObjectId;
const ZarinpalCheckout = require("zarinpal-checkout");

module.exports = new (class OrderController extends Controller {
  async index(req, res) {
    return res.json({ success: true, message: "Order v1" });
  }

  async addOrder(req, res) {
    try {
      req.checkBody("products", "please enter products").notEmpty();
      req.checkBody("products.*._id", "please enter product id").notEmpty();
      req
        .checkBody("products.*.quantity", "please enter product quantity")
        .notEmpty();
      req
        .checkBody(
          "products.*.sellingPrice",
          "please enter product sellingPrice"
        )
        .notEmpty();
      req
        .checkBody(
          "products.*.ingredients.*.stock",
          "please enter product ingredients"
        )
        .notEmpty();
      req
        .checkBody(
          "products.*.ingredients.*.stock._id",
          "please enter product ingredients"
        )
        .notEmpty();
      req

        .checkBody(
          "products.*.ingredients.*.amount",
          "please enter product ingredients"
        )
        .notEmpty();
      req
        .checkBody(
          "products.*.checkWareHouse",
          "please enter product checkWareHouse"
        )
        .notEmpty();

      req.checkBody("customer", "please enter customer").notEmpty();
      req
        .checkBody("customer.family", "please enter customer family")
        .notEmpty();
      req
        .checkBody("customer.company", "please enter customer company")
        .optional({ nullable: true, checkFalsy: true })
        .isString();
      req
        .checkBody("customer.phoneNumber", "please enter customer phoneNumber")
        .notEmpty()
        .isNumeric();

      req
        .checkBody("reminder.date", "please enter reminder date")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601();
      req
        .checkBody("reminder.description", "please enter reminder description")
        .optional({ nullable: true, checkFalsy: true })
        .isString();

      req
        .checkBody("address", "please enter address")
        .optional({ nullable: true, checkFalsy: true })
        .isString();
      req
        .checkBody("duration", "please enter order duration")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601();

      req
        .checkBody("mobile", "please enter order mobile")
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: -1 });
      req
        .checkBody("seller", "please enter customer")
        .optional({ nullable: true, checkFalsy: true });

      req
        .checkBody("seller.family", "please enter seller family")
        .optional({ nullable: true, checkFalsy: true })
        .isString();
      req
        .checkBody("seller.mobile", "please enter seller mobile")
        .optional({ nullable: true, checkFalsy: true })
        .isNumeric();

      req.checkBody("force", "please enter force").notEmpty();
      req
        .checkBody("notes", "please enter notes")
        .optional({ nullable: true, checkFalsy: true });
      if (this.showValidationErrors(req, res)) return;

      console.time("test AddOrder");

      const TIME_FLAG = "1900-01-01T05:42:13.845Z";
      const INT_FLAG = "-1";
      const STRING_FLAG = " ";
      let FORCE = 0;
      if (req.body.force == FORCE) {
        let productsfilter = req.body.products.filter(
          (item) => item.checkWareHouse == true
        );

        let products = [];
        for (let index = 0; index < productsfilter.length; index++) {
          for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
            products.push(productsfilter[index].ingredients[j].stock._id);
          }
        }
        let filter = { _id: { $in: products } };
        let stocks = await this.model.Stock.find(filter, {
          name: 1,
          description: 1,
          active: 1,
          updatedAt: 1,
          amount: 1,
        });

        let isAmountOk = [];

        for (let index = 0; index < productsfilter.length; index++) {
          for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
            let stocksInfo = stocks.find(
              (stocks) =>
                stocks._id.toString() ===
                  productsfilter[index].ingredients[j].stock._id.toString() &&
                stocks.amount < productsfilter[index].quantity
            );
            if (stocksInfo) isAmountOk.push({ name: stocksInfo.name });
          }
        }
        if (isAmountOk.length > 0) {
          return res.json({
            success: false,
            message: "عملیات نا موفق",
            data: isAmountOk,
            dialogTrigger: true,
          });
        }
      }
      // add customer
      let filter = {
        phoneNumber: req.body.customer.phoneNumber,
        user: req.decodedData.user_employer,
      };

      let params = {
        family: req.body.customer.family,
        phoneNumber: req.body.customer.phoneNumber,
        mobile: req.body.mobile,
        user: req.decodedData.user_employer,
        company: req.body.customer.company,
      };

      let customer = await this.model.Customer.findOneAndUpdate(
        filter,
        params,
        { upsert: true, new: true }
      );

      if (req.body.notes && req.body.notes.length > 0)
        req.body.notes = req.body.notes.map((item) => {
          return {
            ...item,
            writtenBy: req.decodedData.user_id,
            private: false,
          };
        });

      let trimProducts = req.body.products.map((pro) => {
        return {
          _id: pro._id,
          quantity: pro.quantity,
          sellingPrice: pro.sellingPrice,
        };
      });

      let seller;
      //add seller
      if (req.body.seller && req.body.seller.family && req.body.seller.mobile) {
        filter = {
          mobile: req.body.seller.mobile,
          user: req.decodedData.user_employer,
        };
        params = {
          family: req.body.seller.family,
          mobile: req.body.seller.mobile,
          user: req.decodedData.user_employer,
          company: req.body.customer.company,
          marketer: req.decodedData.user_id,
        };

        seller = await this.model.Seller.findOneAndUpdate(filter, params, {
          upsert: true,
          new: true,
        });
      }
      // add order
      params = {
        products: trimProducts,
        notes: req.body.notes || [],
        customer: customer._id,
        provider: req.decodedData.user_employer,
        financialApproval: { status: false },
        status: 3,
        priority: req.body.priority,
      };

      if (req.body.mobile) params.mobile = req.body.mobile;
      if (seller) params.seller = seller._id;
      if (req.body.address != STRING_FLAG && req.body.address)
        params.address = req.body.address;
      if (req.body.duration != INT_FLAG && req.body.duration) {
        params.readyTime = req.body.duration;
      }
      params.sellers = [{ id: req.decodedData.user_id, active: true }];

      //remove lead
      filter = {
        user: req.decodedData.user_employer,
        mobile: customer.phoneNumber,
        status: 1,
      };
      await this.model.Lead.update(
        filter,
        { status: 2, active: false },
        { multi: true }
      );
      filter.status = 0;
      let lead = await this.model.Lead.findOneAndUpdate(filter, {
        status: 2,
        active: false,
      }).populate("acceptUser", "acceptedLeadCount");
      if (lead) {
        params.lead = lead._id;
        if (lead.status == 0 && lead.accepted) {
          await this.model.User.updateOne(
            { _id: lead.acceptUser._id },
            { $inc: { acceptedLeadCount: -1 } }
          );
        }
      }

      let order = await this.model.Order.create(params);

      // add reminder
      if (
        req.body.reminder != undefined &&
        req.body.reminder.date !== TIME_FLAG &&
        req.body.reminder.date
      ) {
        let param = {
          title: req.body.customer.family,
          description: req.body.reminder.description,
          date: req.body.reminder.date,
          user: req.decodedData.user_id,
          orderReference: order._id,
        };
        let reminder = await this.model.Reminder.create(param);
        // add reminder to customer
        // await customer.reminder.push(reminder._id);
      }

      // add order to customer
      await customer.order.push(order._id);
      if (req.body.address != STRING_FLAG && req.body.address)
        customer.lastAddress = req.body.address;
      customer.company = req.body.customer.company;
      await customer.save();

      // add order to seller
      if (seller) {
        seller.order.push(order._id);
        await seller.save();
      }

      //reduce stock amount
      // if (req.body.status !== 3){
      //     let update = []
      //     req.body.products.map(product => {
      //         if (product.checkWareHouse){
      //             product.ingredients.map(ing => {
      //                 update.push({
      //                     updateOne : {
      //                         filter : { _id : ing.stock._id },
      //                         update : { $inc : {  amount : 0-(parseInt(ing.amount) * product.quantity) } }
      //                     }
      //                 })
      //             })
      //         }
      //     })
      //     await this.model.Stock.bulkWrite(update)
      // }

      res.json({ success: true, message: "سفارش شما با موفقیت ثبت شد" });

      let user = await this.model.User.findOne(
        { _id: req.decodedData.user_employer },
        "setting company"
      );
      if (user.setting.order.preSms.status) {
        let message = "";
        if (user.company)
          message =
            user.setting.order.preSms.text +
            ` \n${req.decodedData.user_company}`;
        else message = user.setting.order.preSms.text;

        this.sendSms(req.body.customer.mobile, message);
      }

      console.timeEnd("test AddOrder");
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("addOrder")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async getOrders(req, res) {
    try {
      req.checkParams("mobile", "please set mobile").notEmpty().isInt();
      req
        .checkParams("ordersStatus", "please set orderStatus")
        .notEmpty()
        .isInt();
      req
        .checkParams("customerPhoneNumber", "please set customerPhoneNumber")
        .notEmpty()
        .isInt();
      req.checkParams("customerName", "please set customerName").notEmpty();
      req
        .checkParams("customerCompany", "please set customerCompany")
        .notEmpty();
      req.checkParams("sellerMobile", "please set sellerMobile").notEmpty();
      req.checkParams("sellerFamily", "please set sellerFamily").notEmpty();
      req
        .checkParams("startDate", "please set startDate")
        .notEmpty()
        .isISO8601();
      req.checkParams("endDate", "please set endDate").notEmpty().isISO8601();
      req
        .checkParams("startTrackingTime", "please set startTrackingTime")
        .notEmpty()
        .isISO8601();
      req
        .checkParams("endTrackingTime", "please set endTrackingTime")
        .notEmpty()
        .isISO8601();

      req
        .checkParams("sort", "please set order sort")
        .notEmpty()
        .isInt({ min: 0, max: 3 });

      if (this.showValidationErrors(req, res)) return;

      console.time("test getOrders");

      const TIME_FLAG = "1900-01-01T05:42:13.845Z";
      const FLAG = "0";

      let { permission, setting } = await this.model.User.findOne(
        { _id: req.decodedData.user_id },
        "permission setting.order"
      );

      if (req.params.endDate !== TIME_FLAG) {
        let nextDay = new Date(req.params.endDate).setDate(
          new Date(req.params.endDate).getDate() + 1
        );
        req.params.endDate = nextDay;
      }

      if (req.params.endTrackingTime !== TIME_FLAG) {
        let nextDay = new Date(req.params.endTrackingTime).setDate(
          new Date(req.params.endTrackingTime).getDate() + 1
        );
        req.params.endTrackingTime = new Date(nextDay).toISOString();
      }

      let filter = { provider: ObjectId(req.decodedData.user_employer) };
      if (req.params.endDate !== TIME_FLAG) {
        if (!filter.$and) filter.$and = [];
        filter.$and.push({ createdAt: { $lt: req.params.endDate } });
      }
      if (req.params.startDate !== TIME_FLAG) {
        if (!filter.$and) filter.$and = [];
        filter.$and.push({ createdAt: { $gt: req.params.startDate } });
      }

      if (req.params.ordersStatus == 3) {
        if (req.params.startTrackingTime !== TIME_FLAG) {
          if (!filter.$and) filter.$and = [];

          filter.$and.push({
            trackingTime: { $gt: req.params.startTrackingTime },
          });
        }
        if (req.params.endTrackingTime !== TIME_FLAG) {
          if (!filter.$and) filter.$and = [];

          filter.$and.push({
            trackingTime: { $lt: req.params.endTrackingTime },
          });
        }
        if (
          req.params.startTrackingTime == TIME_FLAG &&
          req.params.endTrackingTime == TIME_FLAG
        ) {
          if (!filter.$or) filter.$or = [];

          let d = new Date();
          let gtTime = d.setHours(0, 0, 0);
          let ltTime = new Date(d.setHours(0, 0, 0)).setDate(d.getDate() + 1);

          filter.$or.push(
            { trackingTime: { $exists: false } },
            {
              trackingTime: { $exists: true },
              trackingTime: {
                $gt: new Date(gtTime).toISOString(),
                $lt: new Date(ltTime).toISOString(),
              },
            }
          );
        }
        if (permission.getAllSaleOpprotunity) filter = { status: 3, ...filter };
        else
          filter = {
            $and: [
              { ...filter, status: 3 },
              {
                $or: [
                  { "sellers.active": { $ne: true } },
                  {
                    sellers: {
                      id: req.decodedData.user_id,
                      active: true,
                    },
                  },
                ],
              },
            ],
          };
      } else filter = { status: 0, ...filter };

      let sortStatement;
      if (req.params.ordersStatus == 3) {
        switch (req.params.sort) {
          case "0":
            switch (setting.order.sortGetOrder) {
              case "0":
              case "1":
                sortStatement = { createdAt: -1 };
                break;
              case "2":
                sortStatement = { priority: -1 };
                break;
              case "3":
                sortStatement = { trackingTime: -1 };
                break;
              default:
                break;
            }
            break;
          case "1":
            sortStatement = { createdAt: -1 };
            break;
          case "2":
            sortStatement = { priority: -1 };
            break;
          case "3":
            sortStatement = { trackingTime: -1 };
            break;
          default:
            break;
        }
      }

      let orders = await this.model.Order.find(
        filter,
        "active status products notes customer address readyTime createdAt updatedAt employee financialApproval sellers seller mobile trackingCode priority trackingTime"
      )
        .populate([
          { path: "notes.writtenBy", model: "User", select: "family" },
          { path: "sellers.id", model: "User", select: "family" },
          { path: "products._id", model: "Product", select: "name" },
          {
            path: "financialApproval.acceptedBy",
            model: "User",
            select: "family",
          },
        ])
        .populate("seller", "family mobile")
        .populate("customer", "mobile family company phoneNumber")
        .populate("employee", "family")
        .sort(sortStatement || { createdAt: -1 })
        .lean();

      if (req.params.mobile !== FLAG) {
        orders = orders.filter(
          (param) =>
            param.mobile === parseInt(req.params.mobile) ||
            param.customer.mobile === req.params.mobile
        );
      }

      if (req.params.customerPhoneNumber !== FLAG) {
        orders = orders.filter(
          (param) =>
            param.customer.phoneNumber === req.params.customerPhoneNumber
        );
      }

      if (req.params.customerName !== FLAG)
        orders = orders.filter((param) => {
          if (param.customer) {
            let re = new RegExp(req.params.customerName, "i");
            let find = param.customer.family.search(re);
            return find !== -1;
          }
        });

      if (req.params.customerCompany !== FLAG)
        orders = orders.filter((param) => {
          if (param.customer) {
            let re = new RegExp(req.params.customerCompany, "i");
            let find = param.customer.company.search(re);
            return find !== -1;
          }
        });

      if (req.params.sellerMobile !== FLAG) {
        orders = orders.filter((param) => {
          if (param.seller) {
            if (param.seller.mobile === req.params.sellerMobile) return param;
          }
        });
      }

      if (req.params.sellerFamily !== FLAG)
        orders = orders.filter((param) => {
          if (param.seller) {
            let re = new RegExp(req.params.sellerFamily, "i");
            let find = param.seller.family.search(re);
            return find !== -1;
          }
        });

      let paramsNote;
      let dataNote;
      let isPrivate;

      for (let noteIndex = 0; noteIndex < orders.length; noteIndex++) {
        if (orders[noteIndex].notes.length > 0) {
          dataNote = orders[noteIndex].notes.filter(
            (item) => item.private === false
          );
          paramsNote = orders[noteIndex].notes.filter(
            (item) =>
              item.private === true &&
              item.writtenBy._id.toString() === req.decodedData.user_id
          );

          if (paramsNote.length > 0) {
            isPrivate = true;
            paramsNote = paramsNote.reduce((result, item) => {
              result = item;
              dataNote.push(result);
            }, {});
          } else {
            isPrivate = false;
          }

          dataNote.map((item) => {
            item.writtenBy = item.writtenBy?.family;
            return item;
          });
          orders[noteIndex].notes = {
            Notes: dataNote,
            isPrivate: isPrivate,
          };
        }
      }

      // edit data to be exactly like getOrders
      orders = orders.map((order) => {
        return {
          id: order._id,
          active: order.active,
          address: order.address,
          products: order.products.map((product) => {
            if (product._id)
              return {
                _id: product._id._id,
                name: product._id.name,
                quantity: product.quantity,
                sellingPrice: product.sellingPrice,
              };
            return {};
          }),
          customer: order.customer,
          financialApproval: {
            status: order.financialApproval.status,
            acceptedAt:
              order.financialApproval.acceptedAt &&
              order.financialApproval.acceptedAt,
            acceptedBy:
              order.financialApproval.acceptedBy &&
              order.financialApproval.acceptedBy.family,
          },
          mobile: order.mobile,
          notes: order.notes,
          readyTime: order.readyTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          seller: order.seller,
          sellers: order.sellers,
          status: order.status,
          trackingCode: order.trackingCode,
          priority: order.priority,
          trackingTime: order.trackingTime,
        };
      });

      let update = {};

      if (req.params.sort !== "0") {
        await this.model.User.findOneAndUpdate(
          { _id: req.decodedData.user_id },
          { $set: { "setting.order.sortGetOrder": req.params.sort } }
        );
      }

      console.timeEnd("test getOrders");

      return res.json({
        success: true,
        message: "سفارشات با موفقیت ارسال شد",
        data: {
          orders,
          sort:
            req.params.sort == "0"
              ? setting.order.sortGetOrder
              : req.params.sort,
        },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("getOrders")
        .inputParams(req.params)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editOrderStatus(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("status", "please set order status").notEmpty().isIn[
        (0, 1, 2, 4)
      ];
      // 0 -> successful order, 4 -> fail sale opprtunity, 2 -> cancel order
      if (this.showValidationErrors(req, res)) return;

      console.time("test editOrderStatus");

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter).populate({
        path: "products._id",
        model: "Product",
        select: "ingredients  checkWareHouse",
      });

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      if (req.body.status == 0) {
        let products = [];

        order.products.reduce((oldval, curval, index) => {
          products[index] = {
            _id: curval?._id._id.toString(),
            quantity: curval.quantity,
            sellingPrice: curval.sellingPrice,
            ingredients: curval._id.ingredients,
            checkWareHouse: curval._id.checkWareHouse,
          };
        }, {});

        let productsfilter = products.filter(
          (item) => item.checkWareHouse == true
        );

        products = [];
        for (let index = 0; index < productsfilter.length; index++) {
          for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
            products.push(productsfilter[index].ingredients[j].stock._id);
          }
        }
        let filter = { _id: { $in: products } };
        let stocks = await this.model.Stock.find(filter, {
          name: 1,
          active: 1,
          updatedAt: 1,
          amount: 1,
        });

        let isAmountOk = [];

        for (let index = 0; index < productsfilter.length; index++) {
          for (let j = 0; j < productsfilter[index].ingredients.length; j++) {
            let stocksInfo = stocks.find(
              (stocks) =>
                stocks._id.toString() ===
                  productsfilter[index].ingredients[j].stock._id.toString() &&
                stocks.amount < productsfilter[index].quantity
            );
            if (stocksInfo)
              isAmountOk.push({
                name: stocksInfo.name,
                amount: productsfilter[index].quantity - stocksInfo.amount,
              });
          }
        }

        if (isAmountOk.length > 0) {
          console.timeEnd("test editOrderStatus");
          return res.json({
            success: false,
            message: "امکان انجام عملیات نیست. کالاهای داخل سفارش ناموجود اند.",
          });
        } else {
          let update = [];
          productsfilter.map((product) => {
            if (product.checkWareHouse) {
              product.ingredients.map((ing) => {
                update.push({
                  updateOne: {
                    filter: { _id: ing.stock._id },
                    update: {
                      $inc: {
                        amount: 0 - parseInt(ing.amount) * product.quantity,
                      },
                    },
                  },
                });
              });
            }
          });
          await this.model.Stock.bulkWrite(update);
        }
      }

      order.status = req.body.status;
      await order.save();

      //return stock amount
      if (req.body.status == 2) {
        let update = [];
        order.products.map((product) => {
          if (product._id.checkWareHouse) {
            product._id.ingredients.map((ing) => {
              update.push({
                updateOne: {
                  filter: { _id: ing.stock._id },
                  update: {
                    $inc: { amount: parseInt(ing.amount) * product.quantity },
                  },
                },
              });
            });
          }
        });
        await this.model.Stock.bulkWrite(update);
      }

      filter = {
        active: true,
        _id: order.customer,
        user: req.decodedData.user_employer,
      };
      let customer = await this.model.Customer.findOne(filter);

      switch (order.status) {
        case 0:
          customer.successfullOrders = customer.successfullOrders + 1;
          break;
        case 4:
          customer.failOrders = customer.failOrders + 1;
          break;
        case 2:
          customer.failOrders = customer.failOrders + 1;
          customer.successfullOrders = customer.successfullOrders - 1;
          break;
        default:
          break;
      }

      await customer.save();

      console.timeEnd("test editOrderStatus");

      res.json({ success: true, message: "وضعیت سفارش با موفقیت ویرایش شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editOrderStatus")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async getOrdersNotes(req, res) {
    try {
      req.checkParams("orderId", "please set order id").notEmpty();
      if (this.showValidationErrors(req, res)) return;

      let filter = { active: true, _id: req.params.orderId };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });
      if (order.notes.length <= 0)
        return res.json({ success: false, message: "یادداشتی موجود نیست" });

      let { notes } = await this.model.Order.findOne(filter).populate({
        path: "notes.writtenBy",
        model: "User",
        select: "family",
      });

      let params;
      let data;
      data = notes.filter((item) => item.private === false);
      params = notes.filter(
        (item) =>
          item.private === true &&
          item.writtenBy._id.toString() === req.decodedData.user_id
      );

      let isPrivate;
      if (params.length > 0) {
        isPrivate = true;
        params = params.reduce((result, item) => {
          result = item;
          data.push(result);
        }, {});
      } else {
        isPrivate = false;
      }

      data.map((item) => {
        item.writtenBy = item.writtenBy.family;
        return item;
      });

      res.json({
        success: true,
        message: "یادداشت ها با موفقیت ارسال شد",
        data: { isPrivate, data },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("getOrdersNotes")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async addOrdersNotes(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("notes", "please set order id").notEmpty();
      req
        .checkBody("notes.*.text", "please set order id")
        .notEmpty()
        .isString();
      req
        .checkBody("notes.*.createdAt", "please enter product sellingPrice")
        .notEmpty();

      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      req.body.notes.map((item) => {
        let note = {
          ...item,
          writtenBy: req.decodedData.user_id,
          private: false,
        };
        order.notes.push(note);
      });

      order.markModified("notes");

      await order.save();

      res.json({ success: true, message: "یادداشت با موفقیت اضافه شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("addOrdersNotes")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editOrderPrice(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("productId", "please set product id").notEmpty();
      req.checkBody("price", "please set order price").notEmpty().isString();
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter, { products: 1 });

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      order.products.map((product) => {
        if (product._id === req.body.productId)
          product.sellingPrice = req.body.price;
      });
      order.markModified("products");

      await order.save();

      res.json({ success: true, message: "وضعیت سفارش با موفقیت ویرایش شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editOrderPrice")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editOrderQuantity(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("productId", "please set product id").notEmpty();
      req.checkBody("quantity", "please set order quantity").notEmpty().isInt();
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter, { products: 1 });

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      order.products.map((product) => {
        if (product._id === req.body.productId)
          product.quantity = req.body.quantity;
      });
      order.markModified("products");

      await order.save();

      res.json({ success: true, message: "تعداد سفارش با موفقیت ویرایش شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editOrderQuantity")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editStatusNotes(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("status", "please set status").notEmpty().isString();
      if (this.showValidationErrors(req, res)) return;

      let filter = { active: true, _id: req.body.orderId };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });
      let status;
      if (req.body.status === "1") status = true;
      else if (req.body.status === "0") status = false;
      else return res.json({ success: false, message: "please set status" });

      order.notes.map((notes) => {
        if (notes.writtenBy === req.decodedData.user_id) notes.private = status;
      });
      order.markModified("notes");

      await order.save();

      res.json({
        success: true,
        message: "وضعیت یادداشت ها با موفقیت ویرایش شد",
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editStatusNotes")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async deleteProdcutOrder(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("productId", "please set product id").notEmpty();
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "کالا موجود نیست" });
      if (order.products.length <= 1)
        return res.json({
          success: false,
          message: "کمتر از یک کالا نمیتواند در سفارش باشد.",
        });

      order.products = order.products.filter(
        (item) => item._id !== req.body.productId
      );
      order.markModified("products");

      await order.save();

      res.json({
        success: true,
        message: "تعداد سفارش  کالا با موفقیت ویرایش شد",
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("deleteProdcutOrder")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editProductOrder(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("address", "please enter address").exists().isString();
      req
        .checkBody("companyName", "please enter companyName")
        .optional({ nullable: true, checkFalsy: true })
        .isString();
      req.checkBody("products.*._id", "please enter product id").notEmpty();
      req
        .checkBody("products.*.quantity", "please enter product quantity")
        .notEmpty();
      req
        .checkBody(
          "products.*.sellingPrice",
          "please enter product sellingPrice"
        )
        .notEmpty();
      req
        .checkBody("nationalCard", "please enter customer nationalCard")
        .optional({ nullable: true, checkFalsy: true })
        .isNumeric();
      req
        .checkBody("financialCode", "please enter customer financialCode")
        .optional({ nullable: true, checkFalsy: true })
        .isNumeric();
      req
        .checkBody("postalCode", "please enter customer postalCode")
        .optional({ nullable: true, checkFalsy: true })
        .isNumeric();
      req
        .checkBody("registerNo", "please enter customer registerNumber")
        .optional({ nullable: true, checkFalsy: true })
        .isNumeric();
      req
        .checkBody("priority", "please enter priority")
        .optional({ nullable: true, checkFalsy: true }).isIn[(0, 1, 2, 3)];
      // 0 -> no priority, 1 -> low priority, 2 -> medium priority, 3 -> high priority
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "کالا موجود نیست" });

      order.products = req.body.products;

      if (req.body.address) order.address = req.body.address;
      if (req.body.priority) order.priority = req.body.priority;

      order.markModified("products");
      await order.save();

      filter = { _id: order.customer };
      let update = {
        nationalCard: req.body.nationalCard,
        financialCode: req.body.financialCode,
        postalCode: req.body.postalCode,
        registerNo: req.body.registerNo,
        company: req.body.companyName,
      };

      await this.model.Customer.update(filter, update);

      res.json({ success: true, message: "سفارش با موفقیت ویرایش شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editProductOrder")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async sendDeliverySms(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty().isString();
      req.checkBody("mobile", "please set mobile").notEmpty().isNumeric();
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let order = await this.model.Order.findOne(filter, {
        customer: 1,
        address: 1,
      });

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      let customer = await this.model.Customer.findOne(
        { _id: order.customer },
        { family: 1, mobile: 1, address: 1 }
      );
      if (!customer)
        return res.json({ success: false, message: "مشتری موجود نیست" });

      res.json({ success: true, message: "پیام اطلاعات مشتری ارسال شد" });

      let user = await this.model.User.findOne(
        { _id: req.decodedData.user_employer },
        "setting"
      );
      if (user.setting.order.postDeliverySms.status) {
        let deliveryMessage =
          `نام: ${customer.family}\nموبایل: ${customer.mobile}\nآدرس: ${order.address}\n` +
          user.setting.order.postDeliverySms.text;
        this.sendSms(req.body.mobile, deliveryMessage);
      }
      if (user.setting.order.postCustomerSms.status) {
        let customerMessage = user.setting.order.postCustomerSms.text;
        this.sendSms(customer.mobile, customerMessage);
      }
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("sendDeliverySms")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async orderDetails(req, res) {
    try {
      req.checkParams("orderId", "please set order id").notEmpty().isMongoId();
      req.checkParams("keylink", "please set keylink").notEmpty();
      if (this.showValidationErrors(req, res)) return;

      let now = new Date().toISOString();
      let filter = {
        active: true,
        _id: req.params.orderId,
        sharelink: {
          $elemMatch: { _id: req.params.keylink, expireTime: { $gt: now } },
        },
      };

      let orders = await this.model.Order.find(filter);

      if (orders.length == 0)
        return res.json({ success: false, message: "لینک منقضی شده است " });

      let params = {};
      for (let index = 0; index < orders.length; index++) {
        (params.id = orders[index]._id),
          (params.active = orders[index].active),
          (params.status = orders[index].status),
          (params.products = orders[index].products),
          (params.customer = orders[index].customer),
          (params.address = orders[index].address),
          (params.readyTime = orders[index].readyTime),
          (params.createdAt = orders[index].createdAt),
          (params.updatedAt = orders[index].updatedAt),
          (params.provider = orders[index].provider),
          (params.description = orders[index].description);
        params.financialApproval = orders[index].financialApproval;
        params.sharelink = orders[index].sharelink.filter(
          (item) => item._id == req.params.keylink
        );
      }

      filter = { _id: params.customer };
      let customers = await this.model.Customer.find(filter, {
        _id: 1,
        family: 1,
        mobile: 1,
        createdAt: 1,
        company: 1,
        nationalCard: 1,
        financialCode: 1,
        postalCode: 1,
        registerNo: 1,
      });

      let customerInfo = customers.find(
        (user) => user._id.toString() == params.customer
      );
      params.customer = customerInfo;

      filter = { _id: params.provider };
      let provider = await this.model.User.find(filter, {
        _id: 1,
        family: 1,
        address: 1,
        nationalCode: 1,
        financialCode: 1,
        postalCode: 1,
        registerNo: 1,
        company: 1,
        paymentGateway: 1,
      });

      let providerInfo = provider.find(
        (user) => user._id.toString() == params.provider
      );
      params.provider = providerInfo;

      let products = [];
      for (let index = 0; index < 1; index++) {
        for (let j = 0; j < params.products.length; j++) {
          products.push(params.products[j]._id);
        }
      }
      filter = { _id: { $in: products } };
      products = await this.model.Product.find(filter, { _id: 1, name: 1 });

      for (let index = 0; index < 1; index++) {
        let productInfo;
        for (let j = 0; j < params.products.length; j++) {
          productInfo = products.find(
            (product) =>
              product._id.toString() === params.products[j]._id.toString()
          );
          if (productInfo) params.products[j].name = productInfo.name;
        }
      }

      orders.map((item, index) => {
        if (item._id.toString() === req.params.orderId) {
          item.sharelink.map((item) => {
            if (item._id === req.params.keylink) params.invoiceType = item.type;
          });
        }
      });

      let data = {
        ...params,
      };
      let regex =
        /^(([a-z]|[0-9]){8})-([a-z]|[0-9]){4}-([a-z]|[0-9]){4}-([a-z]|[0-9]){4}-([a-z]|[0-9]){12}/;
      let paymentGatewayValidation = regex.test(params.provider.paymentGateway);
      if (data.financialApproval.status == false && paymentGatewayValidation) {
        data.btnPayOnline = true;
      }

      return res.json({
        success: true,
        message: "فاکتور سفارش با موفقیت ارسال شد",
        data: data,
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("orderDetails")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async createShareLink(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty().isMongoId();
      req
        .checkBody("type", "please set type")
        .notEmpty()
        .isInt({ min: 0, max: 1 });

      if (this.showValidationErrors(req, res)) return;

      const Minutes = 60000;
      const Hour = 3600000;
      const Day = 86400000;
      const id = (
        Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      ).toUpperCase();
      let type = req.body.type == 0 ? 0 : req.body.type == 1 ? 1 : null;
      let params = {
        _id: id,
        type: type,
        createdAt: new Date().toISOString(),
        createdBy: req.decodedData.user_id,
      };
      let timeExpire;

      let filter = { _id: req.decodedData.user_employer };
      let employer = await this.model.User.findOne(
        filter,
        "setting.order paymentGateway"
      );

      let { time, unitTime } = employer.setting.order.share;
      if (unitTime == "M") timeExpire = time * Minutes;
      if (unitTime == "H") timeExpire = time * Hour;
      if (unitTime == "D") timeExpire = time * Day;
      timeExpire = Date.now() + timeExpire;
      params.expireTime = new Date(timeExpire).toISOString();
      filter = { _id: req.body.orderId };
      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({ success: false, message: "سفارش موجود نیست" });

      if (req.body.type == 0) {
        let customer = await this.model.Customer.findOne({
          _id: order.customer,
          nationalCard: { $exists: true },
          financialCode: { $exists: true },
          postalCode: { $exists: true },
          registerNo: { $exists: true },
          company: { $exists: true },
        });
        if (!customer)
          return res.json({
            success: true,
            message: "لطفا اطلاعات مشتری را از طریق ویرایش سفارش کامل کنید.",
            data: { status: false },
          });

        let provider = await this.model.User.findOne({
          _id: order.provider,
          nationalCode: { $exists: true },
          financialCode: { $exists: true },
          postalCode: { $exists: true },
          registerNo: { $exists: true },
          nationalIDCode: { $exists: true },
        });
        if (!provider)
          return res.json({
            success: true,
            message: "لطفا اطلاعات کارفرما را از طریق اکانت کارفرما کامل کنید.",
            data: { status: false },
          });
      }

      order.sharelink.push(params);
      order.markModified("sharelink");
      await order.save();

      return res.json({
        success: true,
        message: "لینک اشتراک گذاری با موفقیت ارسال شد",
        data: {
          status: true,
          orderId: req.body.orderId,
          keyLink: params._id,
        },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("createShareLink")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async confirmFinancial(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty().isMongoId();
      req.checkBody("status", "please set order id").notEmpty().isIn[(1, 2)];
      if (this.showValidationErrors(req, res)) return;

      let params = {
        status: req.body.status,
        acceptedAt: new Date().toISOString(),
        acceptedBy: req.decodedData.user_id,
      };

      let filter = { active: true, _id: req.body.orderId };

      let order = await this.model.Order.findOne(filter);

      if (!order)
        return res.json({
          success: true,
          message: "سفارش موجود نیست",
          data: { status: false },
        });

      if (order.financialApproval !== 1) {
        order.financialApproval = params;
        order.markModified("financialApproval");
        await order.save();
      }

      return res.json({
        success: true,
        message: "وضعیت مالی سفارش ثبت شد",
        data: { status: true },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("confirmFinancial")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async uploadDocuments(req, res) {
    try {
      req
        .checkBody("fileName", "please set your fileName")
        .notEmpty()
        .isString();
      req
        .checkBody("orderId", "please set your orderId")
        .notEmpty()
        .isMongoId();
      if (this.showValidationErrors(req, res)) return;

      let filter = { _id: req.body.orderId };
      let extname = path.extname(req.file.originalname).toLowerCase();

      let update = {
        $push: {
          documents: {
            name: req.body.fileName,
            key: req.file.key,
            location: req.file.location,
            size: req.file.size,
            fileType: extname.substr(1),
          },
        },
      };

      await this.model.Order.update(filter, update);

      return res.json({ success: true, message: "مدرک اضافه شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("uploadDocuments")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async showDocuments(req, res) {
    try {
      req
        .checkParams("orderId", "please set your orderId")
        .notEmpty()
        .isMongoId();
      if (this.showValidationErrors(req, res)) return;

      let filter = { _id: req.params.orderId };
      let documents = await this.model.Order.findOne(filter);

      return res.json({
        success: true,
        message: "مدارک سفارش با موفقیت فرستاده شد",
        data: documents.documents,
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("showDocuments")
        .inputParams(req.params)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editSaleOpportunitySellerStatus(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req.checkBody("status", "please set order status").notEmpty().isIn[
        (0, 1)
      ]; //0 => free sale opportunity
      if (this.showValidationErrors(req, res)) return;

      let filter;
      let update;

      if (req.body.status == 0) {
        filter = {
          active: true,
          _id: req.body.orderId,
          provider: req.decodedData.user_employer,
          sellers: { id: req.decodedData.user_id, active: true },
        };
        update = { "sellers.$.active": false };
      } else if (req.body.status == 1) {
        filter = {
          active: true,
          _id: req.body.orderId,
          provider: req.decodedData.user_employer,
        };
        update = {
          $push: { sellers: { id: req.decodedData.user_id, active: true } },
        };
      }

      let order = await this.model.Order.update(filter, update);

      if (req.body.status == 0)
        res.json({ success: true, message: "فرصت فروش با موفقیت آزاد شد" });
      if (req.body.status == 1)
        res.json({ success: true, message: "فرصت فروش با موفقیت گرفته شد" });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editSaleOpportunitySellerStatus")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async addOrderPush(req, res) {
    try {
      req.checkBody("voipId", "please set user id").notEmpty();
      req.checkBody("baseCall", "please set baseCall").notEmpty().isNumeric();
      req
        .checkBody("distinationCall", "please set distinationCall")
        .notEmpty()
        .isNumeric();
      if (this.showValidationErrors(req, res)) return;

      console.time("test addOrderPush");

      if (req.body.distinationCall)
        req.body.distinationCall = parseInt(req.body.distinationCall);

      let filter = { voipNumbers: req.body.distinationCall };
      let user = await this.model.User.findOne(filter)
        .populate({ path: "employee", model: "User", select: "voipNumber" })
        .lean();

      if (!user)
        return res.json({
          success: false,
          message: "کاربری با این شماره  ویپ وجود ندارد",
        });

      let employee = user.employee.filter(
        (item) => item.voipNumber == parseInt(req.body.voipId)
      );

      let pushMessage = { message: { baseCall: req.body.baseCall } };

      if (employee.length === 0) {
        if (user.voipNumber == parseInt(req.body.voipId))
          pushMessage.userId = user._id.toString();
        else
          return res.json({
            success: false,
            message: "کارمندی با این Sip  وجود ندارد",
          });
      } else {
        pushMessage.userId = employee[0]._id.toString();
      }

      await this.sendPushToUser(pushMessage);

      // let params = {
      //     "projectId": "3",
      //     "apiKey": "turboAABMoh",
      //     "isImportant": "1",
      //     "userId": pushMessage.userId,
      //     "ttl": "100",
      //     "message": pushMessage.message
      // }

      // await axios.post(`http://turbotaxi.ir:6061/api/sendPush`, params)

      console.timeEnd("test addOrderPush");

      return res.json({
        success: true,
        message: "پیام سوکت با موفقیت ارسال شد",
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editSaleOpportunitySellerStatus")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async support(req, res) {
    try {
      req
        .checkParams("type", "please set search type")
        .notEmpty()
        .isInt({ min: 1, max: 5 });
      // 1 -> customer number
      // 2 -> customer family
      // 3 -> company
      // 4 -> seller number
      // 5 -> seller family
      req.checkParams("value", "please set search value").notEmpty();
      if (this.showValidationErrors(req, res)) return;

      let { permission } = await this.model.User.findOne(
        { _id: req.decodedData.user_id },
        "permission"
      );

      let filter = { provider: req.decodedData.user_employer };
      if (!permission.getAllSupport){
        filter = {
          $and: [
            { provider: req.decodedData.user_employer },
            {
              $or: [
                { "sellers.active": { $ne: true } },
                {
                  sellers: {
                    id: req.decodedData.user_id,
                    active: true,
                  },
                },
              ],
            },
          ],
        };
        }

      let orders = await this.model.Order.find(
        filter,
        "active status products notes customer address readyTime createdAt updatedAt employee financialApproval sellers seller mobile trackingCode priority"
      )
        .populate([
          { path: "notes.writtenBy", model: "User", select: "family" },
          { path: "sellers.id", model: "User", select: "family" },
          { path: "products._id", model: "Product", select: "name" },
          {
            path: "financialApproval.acceptedBy",
            model: "User",
            select: "family",
          },
        ])
        .populate("seller", "family mobile")
        .populate("customer", "mobile family company phoneNumber")
        .populate("employee", "family")
        .sort({ createdAt: -1 })
        .lean();

      if (req.params.type == "1")
        orders = orders.filter(
          (param) =>
            param.customer.phoneNumber === req.params.value ||
            param.customer.mobile === req.params.value
        );

      if (req.params.type == "2")
        orders = orders.filter((param) => {
          if (param.customer) {
            let re = new RegExp(req.params.value, "i");
            let find = param.customer.family.search(re);
            return find !== -1;
          }
        });

      if (req.params.type == "3")
        orders = orders.filter((param) => {
          if (param.customer && param.customer.company) {
            let re = new RegExp(req.params.value, "i");
            let find = param.customer.company.search(re);
            return find !== -1;
          }
        });

      if (req.params.type == "4")
        orders = orders.filter((param) => {
          if (param.seller) return param.seller.mobile === req.params.value;
          return false;
        });

      if (req.params.type == "5")
        orders = orders.filter((param) => {
          if (param.seller) {
            let re = new RegExp(req.params.value, "i");
            let find = param.seller.family.search(re);
            return find !== -1;
          }
        });

      let paramsNote;
      let dataNote;
      let isPrivate;

      for (let noteIndex = 0; noteIndex < orders.length; noteIndex++) {
        if (orders[noteIndex].notes.length > 0) {
          dataNote = orders[noteIndex].notes.filter(
            (item) => item.private === false
          );
          paramsNote = orders[noteIndex].notes.filter(
            (item) =>
              item.private === true &&
              item.writtenBy._id.toString() === req.decodedData.user_id
          );

          if (paramsNote.length > 0) {
            isPrivate = true;
            paramsNote = paramsNote.reduce((result, item) => {
              result = item;
              dataNote.push(result);
            }, {});
          } else {
            isPrivate = false;
          }

          dataNote.map((item) => {
            item.writtenBy = item.writtenBy?.family;
            return item;
          });
          orders[noteIndex].notes = {
            Notes: dataNote,
            isPrivate: isPrivate,
          };
        }
      }

      // edit data to be exactly like getOrders
      orders = orders.map((order) => {
        return {
          id: order._id,
          active: order.active,
          address: order.address,
          products: order.products.map((product) => {
            return {
              _id: product._id._id,
              name: product._id.name,
              quantity: product.quantity,
              sellingPrice: product.sellingPrice,
            };
          }),
          customer: order.customer,
          financialApproval: {
            status: order.financialApproval.status,
            acceptedAt:
              order.financialApproval.acceptedAt &&
              order.financialApproval.acceptedAt,
            acceptedBy:
              order.financialApproval.acceptedBy &&
              order.financialApproval.acceptedBy.family,
          },
          mobile: order.mobile,
          notes: order.notes,
          readyTime: order.readyTime,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          seller: order.seller,
          sellers: order.sellers,
          status: order.status,
          support: true,
          trackingCode: order.trackingCode,
          priority: order.priority,
        };
      });

      return res.json({
        success: true,
        message: "سفارشات با موفقیت ارسال شد",
        data: orders,
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("support")
        .inputParams(req.params)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async addTrackingCode(req, res) {
    try {
      req
        .checkBody("trackingCode", "please set trackingCode")
        .notEmpty()
        .isNumeric();
      req.checkBody("orderId", "please set orderId").notEmpty().isMongoId();
      req
        .checkBody("customerId", "please set customerId")
        .notEmpty()
        .isMongoId();
      if (this.showValidationErrors(req, res)) return;

      // check for duplicate tracking code
      let customer = await this.model.Customer.findOne({
        _id: req.body.customerId,
      }).populate({ path: "order", model: "Order" });
      let duplicate = customer.order.some(
        (order) => order.trackingCode == req.body.trackingCode
      );

      if (duplicate)
        return res.json({
          success: true,
          message: "کد پیگیری تکراری است",
          data: { status: false },
        });

      // add trackingCode
      let filter = {
        provider: req.decodedData.user_employer,
        _id: req.body.orderId,
      };
      let update = { $set: { trackingCode: req.body.trackingCode, status: 0 } };

      await this.model.Order.updateOne(filter, update);

      return res.json({
        success: true,
        message: "کد پیگیری با موفقیت ثبت شد",
        data: { status: true },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("addTrackingCode")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async failSaleOpportunity(req, res) {
    try {
      req.checkBody("orderId", "please set order id").notEmpty();
      req
        .checkBody("unsuccessfulReason", "please set order unsuccessfulReason")
        .notEmpty();
      req
        .checkBody(
          "unsuccessfulReason.text",
          "please set order unsuccessfulReason text"
        )
        .notEmpty()
        .isString();
      req
        .checkBody(
          "unsuccessfulReason.id",
          "please set order unsuccessfulReason id"
        )
        .notEmpty()
        .isNumeric();
      if (this.showValidationErrors(req, res)) return;

      let filter = {
        active: true,
        _id: req.body.orderId,
        provider: req.decodedData.user_employer,
      };
      let update = {
        $set: {
          failureReason: {
            id: req.body.unsuccessfulReason.id,
            text: req.body.unsuccessfulReason.text,
          },
          status: 4,
        },
      };
      let order = await this.model.Order.findOneAndUpdate(filter, update);

      let employer = await this.model.User.findOne({
        _id: req.decodedData.user_employer,
      });
      if (!employer.setting.order.failureReasons) {
        employer.setting.order.failureReasons = [update.$set.failureReason];
      } else {
        let index = employer.setting.order.failureReasons.findIndex(
          (reason) => reason.id == req.body.unsuccessfulReason.id
        );
        if (index === -1) {
          employer.setting.order.failureReasons.push(update.$set.failureReason);
        }
      }
      employer.markModified("setting.order.failureReasons");
      await employer.save();

      filter = {
        active: true,
        _id: order.customer,
        user: req.decodedData.user_employer,
      };
      update = { $inc: { failOrders: 1 } };
      await this.model.Customer.findOneAndUpdate(filter, update);

      res.json({
        success: true,
        message: "وضعیت فرصت فروش با موفقیت ویرایش شد",
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("failSaleOpportunity")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async getFailureReasons(req, res) {
    try {
      let reasons = await this.model.User.findOne(
        { _id: req.decodedData.user_employer },
        "setting.order"
      );

      res.json({
        success: true,
        message: "دلایل ناموفق فرصت فروش ارسال شد",
        data: reasons.setting.order.failureReasons || [],
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("getFailureReasons")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }
  async editPriority(req, res) {
    try {
      req.checkBody("orderId", "please set orderId").notEmpty().isMongoId();
      req.checkBody("priority", "please set order priority").notEmpty().isInt[
        (0, 1, 2, 3, 4, 5)
      ];
      if (this.showValidationErrors(req, res)) return;

      await this.model.Order.findOneAndUpdate(
        { _id: req.body.orderId },
        { $set: { priority: req.body.priority } },
        { new: true },
        (err, doc) => {
          if (err) {
            throw err;
          }
          if (doc.priority == req.body.priority) {
            return res.json({
              success: true,
              message: "اولویت فرصت فروش با موفقیت تغییر کرد",
            });
          } else {
            return res.json({
              success: false,
              message: "خطا در ویرایش اولویت فرصت فروش",
            });
          }
        }
      );
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editPriority")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async editTrackingTime(req, res) {
    try {
      req.checkBody("orderId", "please set orderId").notEmpty().isMongoId();
      req
        .checkBody("trackingTime", "please set order trackingTime")
        .notEmpty()
        .isISO8601();
      if (this.showValidationErrors(req, res)) return;

      console.time("test editTrackingTime");

      await this.model.Order.findOneAndUpdate(
        { _id: req.body.orderId },
        { $set: { trackingTime: req.body.trackingTime } },
        { new: true },
        (err, doc) => {
          if (err) {
            throw err;
          }
          console.log(new Date(doc.trackingTime).toISOString());
          if (
            new Date(doc.trackingTime).toISOString() == req.body.trackingTime
          ) {
            console.time("test editTrackingTime");
            return res.json({
              success: true,
              message: "تاریخ پیگیری سفارش با موفقیت تغییر کرد",
            });
          } else {
            console.time("test editTrackingTime");
            return res.json({
              success: false,
              message: "خطا در ویرایش تاریخ پیگیری سفارش",
            });
          }
        }
      );
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("editTrackingTime")
        .inputParams(req.body)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async validateOnlinePay(req, res) {
    try {
      req
        .checkQuery("Authority", "please enter Authority")
        .notEmpty()
        .isString();
      req
        .checkQuery("Status", "please enter Status")
        .notEmpty()
        .isIn(["OK", "NOK"]);

      if (this.showValidationErrors(req, res)) return;

      console.time("test validateOnlinePay");

      let filter = {};
      let pay = await this.model.OrderPay.aggregate([
        {
          $match: { authority: req.query.Authority },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "onlinePay",
            as: "ordersInfo",
          },
        },
      ]);

      if (!pay)
        return res.json({
          success: true,
          message: "پرداخت موجود نیست",
          data: { status: false },
        });

      const zarinpal = ZarinpalCheckout.create(pay[0].paymentGateway, false);

      let zarinRes = await zarinpal.PaymentVerification({
        Amount: pay[0].amount, // In Tomans
        Authority: req.query.Authority,
      });

      if (zarinRes.status === 100 || zarinRes.status === 101) {
        pay = await this.model.OrderPay.findOneAndUpdate(
          { authority: req.query.Authority },
          { $set: { paid: true } },
          { new: true }
        );

        filter = { onlinePay: pay._id };
        let order = await this.model.Order.findOneAndUpdate(
          filter,
          {
            $set: {
              status: 0,
              "financialApproval.status": 3,
              "financialApproval.acceptedAt": new Date().toISOString(),
              trackingCode: req.query.Authority,
            },
          },
          { new: true }
        );

        res.redirect(
          `http://crm-x.ir/payment/successful/${pay[0].ordersInfo[0]._id.toString()}/${
            pay[0].keylinkOrder
          }`
        );
      }

      res.redirect(
        `http://crm-x.ir/payment/unsuccessful/${pay[0].ordersInfo[0]._id.toString()}/${
          pay[0].keylinkOrder
        }`
      );
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("validateOnlinePay")
        .inputParams(req.query)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }

  async createPaymentlink(req, res) {
    try {
      req.checkParams("orderId", "please set order id").notEmpty().isMongoId();
      req.checkParams("keylink", "please set keylink").notEmpty();
      if (this.showValidationErrors(req, res)) return;

      console.time("test createPaymentlink");

      let now = new Date().toISOString();
      let orders = await this.model.Order.aggregate([
        {
          $match: {
            active: true,
            _id: ObjectId(req.params.orderId),
            sharelink: {
              $elemMatch: { _id: req.params.keylink, expireTime: { $gt: now } },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "provider",
            foreignField: "_id",
            as: "providerInfo",
          },
        },
        {
          $addFields: {
            providerInfo: { $arrayElemAt: ["$providerInfo", -1] },
          },
        },
      ]);

      let regex =
        /^(([a-z]|[0-9]){8})-([a-z]|[0-9]){4}-([a-z]|[0-9]){4}-([a-z]|[0-9]){4}-([a-z]|[0-9]){12}/;
      let paymentGatewayValidation = regex.test(
        orders[0].providerInfo.paymentGateway
      );

      if (orders.length == 0) {
        console.timeEnd("test createPaymentlink");
        return res.json({
          success: true,
          message: "سفارش موجود نیست",
          data: { status: false },
        });
      } else if (orders[0].financialApproval.status != false) {
        console.timeEnd("test createPaymentlink");
        return res.json({
          success: true,
          message: "سفارش قبلا پرداخت شده است",
          data: { status: false },
        });
      } else if (paymentGatewayValidation == false) {
        console.timeEnd("test createPaymentlink");
        return res.json({
          success: true,
          message: "ابتدا اطلاعات کارفرما را تکمیل کنید",
          data: { status: false },
        });
      }
      let total = 0;
      orders[0].products.map((item) => {
        total += item.sellingPrice * item.quantity;
      });

      //pay link
      const zarinpal = ZarinpalCheckout.create(
        orders[0].providerInfo.paymentGateway,
        // "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        false // false [toggle `Sandbox` mode]
      );
      let zarinRes = await zarinpal.PaymentRequest({
        Amount: total, // In Tomans
        CallbackURL: "http://crm-x.ir/api/user/v1/order/pay/online",
        Description: "از خرید شما ممنونیم",
      });
      if (zarinRes.status != 100)
        return res.json({
          success: true,
          message: "پرداخت ناموفق",
          data: { payStatus: zarinRes.status, ...data },
        });

      let payParams = {
        amount: total,
        authority: zarinRes.authority,
        paymentGateway: orders[0].providerInfo.paymentGateway,
        employer: orders[0].provider._id,
        keylinkOrder: req.params.keylink,
      };

      let onlinePay = await this.model.OrderPay.create(payParams);
      let update = { $addToSet: { onlinePay: onlinePay._id } };
      await this.model.Order.findByIdAndUpdate(req.params.orderId, update);

      let resData = {};
      resData.payStatus = zarinRes.status;
      resData.payURL = zarinRes.url;

      console.timeEnd("test createPaymentlink");

      return res.json({
        success: true,
        message: "لینک پرداخت با موفقیت ارسال شد",
        data: { ...resData },
      });
    } catch (err) {
      let handelError = new this.transforms.ErrorTransform(err)
        .parent(this.controllerTag)
        .class(TAG)
        .method("createPaymentlink")
        .inputParams(req.params)
        .call();

      if (!res.headersSent) return res.status(500).json(handelError);
    }
  }
})();
