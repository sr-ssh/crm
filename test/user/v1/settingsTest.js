process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user settings Tests';
const baseRoute = '/api/user/v1/settings';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let order, user, getOrderParams, editOrderStatus, deliverySms, editSms;
const axios = require('axios').default;

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        order = appConfig.test.order;
        user = appConfig.test.user;
        getOrderParams = appConfig.test.getOrderParams;
        editOrderStatus = appConfig.test.editOrderStatus;
        deliverySms = appConfig.test.deliverySms;
        editSms = appConfig.test.editSms;
        axios.post(`http://localhost:4000/api/user/v1/login`, user)
            .then(function (response) {
                response = response.data;
                console.log(response.message)
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

        it('check get sms information', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/order/sms`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send()
            res.should.have.status(200)
        })


    });


    describe('Check Put Apis', () => {

        it('check edit sms', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/order/sms`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editSms);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
