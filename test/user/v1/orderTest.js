process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user order Tests';
const baseRoute = '/api/user/v1/order';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let order, user, getOrderParams, editOrderStatus, deliverySms, editSms, editOrderPrice;
const axios = require('axios').default;

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        order = appConfig.test.order;
        user = appConfig.test.user;
        getOrderParams = appConfig.test.getOrderParams;
        editOrderStatus = appConfig.test.editOrderStatus;
        editOrderPrice = appConfig.test.editOrderPrice;
        deliverySms = appConfig.test.deliverySms;
        editSms = appConfig.test.editSms;
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
                .get(`${baseRoute}/${encodeURI(getOrderParams.customerName)}/09307580142/${getOrderParams.startDate}/${getOrderParams.endDate}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
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
                .put(`${baseRoute}/price`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editOrderPrice);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
