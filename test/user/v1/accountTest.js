process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user account Tests';
const baseRoute = '/api/user/v1/account';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let user, editAccount, editEmployerAccount, idToken, accessToken;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        editAccount = appConfig.test.editAccount;
        editEmployerAccount = appConfig.test.editEmployerAccount;
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

        it('check get user account', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

    });


    describe('Check put Apis', () => {

        it('check edit user account', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editAccount);
            res.should.have.status(200);
        });


        it('check edit employer account', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/employer`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editEmployerAccount);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
