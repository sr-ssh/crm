process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user home Tests';
const baseRoute = '/api/user/v1';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let user,appInfo, accessToken, idToken, newUser;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        appInfo = appConfig.test.appInfo;
        newUser = appConfig.test.newUser;
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

    });

    describe('Check Post Apis', () => {

        it('check register', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .send(newUser);
            res.should.have.status(200);
        });

        it('check login', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/login`)
                .send(user);
            res.should.have.status(200);
        });


        it('check app info', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/app/info`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(appInfo);
            res.should.have.status(200);
        })

        
        it('check verification code', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/verificationcode`)
                .send(user);
            res.should.have.status(200);
        });

        it('check password forgetting', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/password`)
                .send(user);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
