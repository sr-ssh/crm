process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user product Tests';
const baseRoute = '/api/user/v1/product';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let product, user, editedProduct;
const axios = require('axios').default;
const path = require('path')

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        product = appConfig.test.product;
        editedProduct = appConfig.test.editedProduct;
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

        it('check get products', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


        it('check get excel products', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/excel`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


    });

    describe('Check Post Apis', () => {

        it('check add product', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(product);
            res.should.have.status(200);
        });

        it('check upload excel', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/uploadExcel`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .attach('excel', `${path.resolve('./ExcelProducts.xlsx')}`)
            res.should.have.status(200);
        });

    });

    describe('Check Put Apis', () => {

        it('check edit product', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editedProduct);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
