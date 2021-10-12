process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user lead Tests';
const baseRoute = '/api/user/v1/lead';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let lead, user;
const axios = require('axios').default;
const path = require('path')

chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.userMJH;
        lead = appConfig.test.lead;
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

        it('check add lead', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(lead);
            res.should.have.status(200);
        });

      
    });

    describe('Check Put Apis', () => {

     
    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
