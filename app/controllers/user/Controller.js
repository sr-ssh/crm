let appConfig = require('config');
const axios = require('axios');


const MainController = require(`${config.path.mainController}`);

module.exports = class Controller extends MainController {
    constructor() {
        super();
        this.controllerTag = 'User'
    }

    
    async sendPushToUser({userId, message}) {

        // message = JSON.stringify(message)
        let pushUrl = appConfig.push.host + '/api/sendPush'
        let pushParams = {
            "projectId": "3",
            "apiKey": "turboAABMoh",
            "isImportant": "1",
            "userId": userId,
            "ttl": "100",
            "message": message

        };
        
        await axios.post(pushUrl, pushParams)
       .then(function (response) {
            console.log(response)            
        })
        .catch(function (error) {
            new this.transforms.ErrorTransform(error)
            .parent(this.controllerTag)
            .class('Controller')
            .method('sendPushToUser')
            .inputParams()
            .call();
        });
      
    }
}