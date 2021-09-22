process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user supplier Tests';
const baseRoute = '/api/user/v1/supplier';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let supplier, user,getSuppliersParams;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        supplier = appConfig.test.supplier;
        getSuppliersParams = appConfig.test.getSuppliersParams;
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

        it('check get suppliers', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/${encodeURI(getSuppliersParams.family)}/${encodeURI(getSuppliersParams.mobile)}/${encodeURI(getSuppliersParams.createdAtFrom)}/${encodeURI(getSuppliersParams.createdAtTo)}/${encodeURI(getSuppliersParams.lastBuyFrom)}/${encodeURI(getSuppliersParams.lastBuyTo)}/${encodeURI(getSuppliersParams.receiptFrom)}/${encodeURI(getSuppliersParams.receiptTo)}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });



        // it('check get excel suppliers', async () => {
        //     const res = await chai
        //         .request(server)
        //         .get(`${baseRoute}/excel/${encodeURI(getCustomerParams.family)}/${encodeURI(getCustomerParams.mobile)}/${encodeURI(getCustomerParams.createdAtFrom)}/${encodeURI(getCustomerParams.createdAtTo)}/${encodeURI(getCustomerParams.lastBuyFrom)}/${encodeURI(getCustomerParams.lastBuyTo)}/${encodeURI(getCustomerParams.orderFrom)}/${encodeURI(getCustomerParams.orderTo)}/${encodeURI(getCustomerParams.totalFrom)}/${encodeURI(getCustomerParams.totalTo)}`)
        //         .set('Authorization', accessToken)
        //         .set('idToken', idToken)
        //         .send();
        //     res.should.have.status(200);
        // });

        it('check get supplier by mobile', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/${encodeURI(supplier.mobile)}`)
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
