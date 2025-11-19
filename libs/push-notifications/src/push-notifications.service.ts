/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
// import * as firebase from 'firebase-admin';

@Injectable()
export class PushNotificationsService {

    private logger = new Logger('PushNotificationsService');

    public pushNotification(firebaseToken: string, payload: unknown, options: unknown) {
        // set  file path from server where firebase configuration file
        // if (firebaseToken) {
        //     return firebase.messaging().sendToDevice(firebaseToken, payload, options)
        //         .then(response => {
        //             this.logger.log(`Notification sent successfully${JSON.stringify(response)}`);
        //         })
        //         .catch(error => {
        //             this.logger.error(error);
        //             return `notification sent ${JSON.stringify(error)}`;
        //         });
        // }
    }


    public webPushNotification(firebaseToken: string, payload: unknown) {
        // set  file path from server where firebase configuration file
        const options = {
            priority: 'high',
            timeToLive: 60 * 69 * 24
        };
        // if (firebaseToken) {
        //     return firebase.messaging().sendToDevice(firebaseToken, payload, options)
        //         .then(response => {
        //             this.logger.debug(`\nfirebaseToken: ${firebaseToken} \n payload: ${JSON.stringify(payload)}`);
        //             this.logger.log(`Web Notification sent successfully${JSON.stringify(response)}`);
        //         })
        //         .catch(error => {
        //             this.logger.error(error);
        //             return `notification sent ${JSON.stringify(error)}`;
        //         });
        // }
    }
}
