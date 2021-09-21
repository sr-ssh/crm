process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user receipt Tests';
const baseRoute = '/api/user/v1/receipt';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let receipt, user;
const axios = require('axios').default;

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        receipt = appConfig.test.receipt;
        user = appConfig.test.user;
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

        it('check get orders V1', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/v1/${getOrderParams_V1.status}/${encodeURI(getOrderParams_V1.customerName)}/${getOrderParams_V1.customerMobile}/${getOrderParams_V1.startDate}/${getOrderParams_V1.endDate}`)
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


        it('check get order details ', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/details/${getOrderDetails.orderId}/${getOrderDetails.keylink}`)
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

    });

    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
