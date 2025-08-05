"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.adminDb = exports.adminApp = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
require("dotenv/config");
let adminApp;
let adminAuth;
let adminDb;
/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This "lazy initialization" pattern ensures that environment variables are loaded
 * before the SDK is used, which is crucial in complex server environments like Next.js.
 * This function should be called at the beginning of any server-side logic that needs Firebase services.
 */
function initializeAdmin() {
    if ((0, app_1.getApps)().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            console.error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features are disabled.');
            return;
        }
        try {
            // Clean up the key before parsing
            const cleanedKey = serviceAccountKey.replace(/\\n/g, '\\n');
            const serviceAccount = JSON.parse(cleanedKey);
            exports.adminApp = adminApp = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccount),
            });
            exports.adminAuth = adminAuth = (0, auth_1.getAuth)(adminApp);
            exports.adminDb = adminDb = (0, firestore_1.getFirestore)(adminApp);
        }
        catch (e) {
            console.error('[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it\'s valid, single-line JSON in your .env file.', e);
        }
    }
    else {
        exports.adminApp = adminApp = (0, app_1.getApps)()[0];
        exports.adminAuth = adminAuth = (0, auth_1.getAuth)(adminApp);
        exports.adminDb = adminDb = (0, firestore_1.getFirestore)(adminApp);
    }
}
// Initialize on first import.
initializeAdmin();
//# sourceMappingURL=firebaseServer.js.map