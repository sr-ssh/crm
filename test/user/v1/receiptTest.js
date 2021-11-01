process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user receipt Tests';
const baseRoute = '/api/user/v1/receipt';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let receipt, user, getReceipts, shopConfirmation, editReceiptStatus, editReceipt, editReceiptNoteStatus, newUser;
const axios = require('axios').default;

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        receipt = appConfig.test.receipt;
        shopConfirmation = appConfig.test.shopConfirmation;
        user = appConfig.test.user;
        getReceipts = appConfig.test.getReceipts;
        editReceiptStatus = appConfig.test.editReceiptStatus
        editReceipt = appConfig.test.editReceipt;
        editReceiptNoteStatus = appConfig.test.editReceiptNoteStatus
        newUser = appConfig.test.newUser
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

        it('check get receipts', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/${getReceipts.supplierName}/${encodeURI(getReceipts.supplierMobile)}/${getReceipts.startDate}/${getReceipts.endDate}`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


    });

    describe('Check Post Apis', () => {

        it('check add receipt', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(receipt);
            res.should.have.status(200);
        });

        it('check receipt confirm shop', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/confirm/shop`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(shopConfirmation);
            res.should.have.status(200);
        });

    });


    describe('Check Put Apis', () => {

        it('check edit Receipt status', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/status`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editReceiptStatus);
            res.should.have.status(200);
        });

        it('check edit receipt   ', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/edit`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editReceipt);
            res.should.have.status(200);
        });

        it('check edit receipt note status', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/note/status`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editReceiptNoteStatus);
            res.should.have.status(200);
        });

    });

    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
