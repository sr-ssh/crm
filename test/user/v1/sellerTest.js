process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user seller Tests';
const baseRoute = '/api/user/v1/seller';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let user, seller, getSellers;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        seller = appConfig.test.seller;
        getSellers = appConfig.test.getSellers;
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

        it("check get sellers", async () => {
          const res = await chai
            .request(server)
            .get(
              `${baseRoute}/${encodeURI(getSellers.company)}/${encodeURI(
                getSellers.phone
              )}/${encodeURI(getSellers.mobile)}/${encodeURI(
                getSellers.address
              )}`
            )
            .set("Authorization", accessToken)
            .set("idToken", idToken)
            .send();
          res.should.have.status(200);
        });

        it("check get seller", async () => {
            const res = await chai
              .request(server)
              .get(
                `${baseRoute}/${encodeURI(getSellers.mobile)}`
              )
              .set("Authorization", accessToken)
              .set("idToken", idToken)
              .send();
            res.should.have.status(200);
          });
        
    });
        describe('Check post Apis', () => {

        it('check add seller', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(seller);
            res.should.have.status(200);
        });

    });


    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
