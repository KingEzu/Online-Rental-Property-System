const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('../config/oprs-3b110-firebase-adminsdk-ipqtk-97d1e7829c.json');

const app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});

module.exports = {
    app
}