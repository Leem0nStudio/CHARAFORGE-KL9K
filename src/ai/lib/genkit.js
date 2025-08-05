"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const genkit_1 = require("genkit");
const firebase_1 = require("@genkit-ai/firebase");
const googleai_1 = require("@genkit-ai/googleai");
// Import your Genkit flows here to ensure they are registered
require("./flows/generate-character-bio");
require("./flows/generate-character-image");
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, googleai_1.googleAI)(),
    ],
});
(0, firebase_1.enableFirebaseTelemetry)();
//# sourceMappingURL=genkit.js.map