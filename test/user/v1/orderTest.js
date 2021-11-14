process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user order Tests';
const baseRoute = '/api/user/v1/order';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let order,
  user,
  getOrderParams,
  editOrderStatus,
  deliverySms,
  editSms,
  editOrderPrice,
  editOrderQuantity,
  deleteOrder,
  editProductOrder,
  financialConfirmation,
  support,
  addOrderPush,
  trackingCode,
  failSaleOpportunity,
  editPriorityOrder;
const axios = require('axios').default;
const path = require('path')

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection established ');
        failSaleOpportunity = appConfig.test.failSaleOpportunity;
        trackingCode = appConfig.test.trackingCode;
        support = appConfig.test.support;
        order = appConfig.test.order;
        user = appConfig.test.userMJH;
        getOrderParams = appConfig.test.getOrderParams;
        getOrderParams_V1 = appConfig.test.getOrderParams_V1;
        editOrderStatus = appConfig.test.editOrderStatus;
        editOrderPrice = appConfig.test.editOrderPrice;
        deliverySms = appConfig.test.deliverySms;
        editSms = appConfig.test.editSms;
        editOrderQuantity = appConfig.test.editOrderQuantity;
        deleteOrder = appConfig.test.deleteOrder;
        editProductOrder = appConfig.test.editProductOrder;
        getNotes = appConfig.test.getNotes;
        addOrderNotes = appConfig.test.addOrderNotes;
        editeStatusNotes = appConfig.test.editeStatusNotes;
        createShareLinkOrder = appConfig.test.createShareLinkOrder;
        getOrderDetails = appConfig.test.getOrderDetails
        financialConfirmation = appConfig.test.financialConfirmation;
        addOrderPush = appConfig.test.addOrderPush;
        editPriorityOrder = appConfig.test.editPriorityOrder;
        axios.post(`http://localhost:4000/api/user/v1/login`, user)
            .then(function (response) {
                response = response.data;
                if (response.success) {
                    idToken = response.data.idToken
                    accessToken = response.data.accessToken
                } else {
                    console.log("errorrrrrrrrrr: no token provided ");
                }
                setTimeout(() => {
                    console.log('Okay, lets begin!');
                    done();
                }, 1000);
            })
            .catch((error) => {
                console.log("error", error);
            });
    })


    describe('Check get Apis', () => {

        it('check get orders', async () => {
            const res = await chai
              .request(server)
              .get(
                `${baseRoute}/${encodeURI(
                  getOrderParams.status
                )}/${encodeURI(getOrderParams.customerName)}/${encodeURI(
                  getOrderParams.customerMobile
                )}/${getOrderParams.startDate}/${getOrderParams.endDate}`
              )
              .set("Authorization", accessToken)
              .set("idToken", idToken)
              .send();
            res.should.have.status(200);
        });

        it('check get failure reasons', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/failurereasons`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

        it('check get notes ', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/notes/${getNotes}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

        it('check get support', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/${support.type}/${encodeURI(support.value)}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

        it('check get order details ', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/details/${getOrderDetails.orderId}/${getOrderDetails.keylink}`)
                .send();
            res.should.have.status(200);
        });



    });

    describe('Check Post Apis', () => {

        it('check add order', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(order);
            res.should.have.status(200);
        });

        it('check send delivery sms', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/delivery/sms`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(deliverySms);
            res.should.have.status(200);
        });

        it('check get order share link ', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/details/sharelink`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(createShareLinkOrder);
            res.should.have.status(200);
        });


        it('check upload doc ', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/doc`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .field('fileName', 'mjh99')
                .field('orderId', '615c27fb8f031c53fc44ec8f')
                .attach('file', `${path.resolve('./ExcelProduct.xlsx')}`)
            res.should.have.status(200);
        });

        it('check order push notification', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/push`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(addOrderPush);
            res.should.have.status(200);
        });

        it('check order add trackingCode', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/trackingcode`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(trackingCode);
            res.should.have.status(200);
        });

    });


    describe('Check Put Apis', () => {

        it('check edit order status', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/status`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editOrderStatus);
            res.should.have.status(200);
        });

        it('check edit order price', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/product/price`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editOrderPrice);
            res.should.have.status(200);
        });

        it('check edit order quantity', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/product/quantity`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editOrderQuantity);
            res.should.have.status(200);
        });

        it('check delete order ', async () => {
            const res = await chai
                .request(server)
                .delete(`${baseRoute}/product`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(deleteOrder);
            res.should.have.status(200);
        });

        it('check edit product order ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/product`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editProductOrder);
            res.should.have.status(200);
        });

        it('check add order notes ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/notes`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(addOrderNotes);
            res.should.have.status(200);
        });

        it('check edit status order notes ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/notes/status`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editeStatusNotes);
            res.should.have.status(200);
        });

        it('check confirm financial ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/financial/confirm`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(financialConfirmation);
            res.should.have.status(200);
        });

        it('check edit priority order  ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/edit/priority`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editPriorityOrder);
            res.should.have.status(200);
        });
    });

    describe('Check Delete Apis', () => {

        it('check fail sale opportunity ', async () => {
            const res = await chai
                .request(server)
                .delete(`${baseRoute}/opportunity`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(failSaleOpportunity);
            res.should.have.status(200);
        });

    });

    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
