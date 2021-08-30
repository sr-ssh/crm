process.env.NODE_ENV = 'test';
let chai = require('chai');
let should = chai.should();
const sectionName = 'V1 user employee Tests';
const baseRoute = '/api/user/v1/employee';
let chaiHttp = require('chai-http');
let server = require('../../../server');
let appConfig = require('config');
let user, editedEmployee, deleteEmployee, editApplication;
const axios = require('axios').default;


chai.use(chaiHttp);

describe(`${sectionName}`, () => {


    before((done) => {
        console.log('Waiting to ensure database connection stablished ');
        user = appConfig.test.user;
        employee = appConfig.test.employee;
        editedEmployee = appConfig.test.editedEmployee;
        deleteEmployee = appConfig.test.deleteEmployee;
        editApplicationByEmployer = appConfig.test.editApplicationByEmployer;
        editApplicationByEmployee = appConfig.test.editApplicationByEmployee;
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

        it('check get employees', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });

        it('check get permission', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/permission`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


        it('check get applications', async () => {
            const res = await chai
                .request(server)
                .get(`${baseRoute}/application`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send();
            res.should.have.status(200);
        });


    });

    describe('Check Post Apis', () => {

        it('check add employee', async () => {
            const res = await chai
                .request(server)
                .post(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(employee);
            res.should.have.status(200);
        });

    });


    describe('Check Put Apis', () => {

        it('check edit employee permissions', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editedEmployee);
            res.should.have.status(200);
        });

        it('check edit employee application', async () => {
            const res = await chai
                .request(server)
                .put(`${baseRoute}/application`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(editApplicationByEmployer);
            res.should.have.status(200);
        });

    });

    describe('Check Delete Apis', () => {

        it('check delete employee', async () => {
            const res = await chai
                .request(server)
                .delete(`${baseRoute}/`)
                .set('Authorization', accessToken)
                .set('idToken', idToken)
                .send(deleteEmployee);
            res.should.have.status(200);
        });

    });



    after(async () => {
        console.log(`Section ${sectionName} finished`);
    });

});
