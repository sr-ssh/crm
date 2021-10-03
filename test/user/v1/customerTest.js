process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user customer Tests';
const baseRoute = '/api/user/v1/customer';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let customer, user, getCustomerParams;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.userMJH;
        customer = appConfig.test.customer;
        getCustomerParams = appConfig.test.getCustomerParams;
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

        it('check get customers', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/list/${encodeURI(getCustomerParams.family)}/${encodeURI(getCustomerParams.mobile)}/${encodeURI(getCustomerParams.createdAtFrom)}/${encodeURI(getCustomerParams.createdAtTo)}/${encodeURI(getCustomerParams.lastBuyFrom)}/${encodeURI(getCustomerParams.lastBuyTo)}/${encodeURI(getCustomerParams.orderFrom)}/${encodeURI(getCustomerParams.orderTo)}/${encodeURI(getCustomerParams.totalFrom)}/${encodeURI(getCustomerParams.totalTo)}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });



        it('check get excel customers', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/excel/${encodeURI(getCustomerParams.family)}/${encodeURI(getCustomerParams.mobile)}/${encodeURIComponent(getCustomerParams.createdAtFrom)}/${encodeURIComponent(getCustomerParams.createdAtTo)}/${encodeURIComponent(getCustomerParams.lastBuyFrom)}/${encodeURIComponent(getCustomerParams.lastBuyTo)}/${encodeURIComponent(getCustomerParams.orderFrom)}/${encodeURIComponent(getCustomerParams.orderTo)}/${encodeURIComponent(getCustomerParams.totalFrom)}/${encodeURIComponent(getCustomerParams.totalTo)}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

        it('check get customer by mobile', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/${encodeURI(getCustomerParams.mobile)}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
