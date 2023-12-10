"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = exports.ActivityKind = void 0;
const xml_js_1 = require("xml-js");
var ActivityKind;
(function (ActivityKind) {
    ActivityKind["Observation"] = "observation";
    ActivityKind["Thought"] = "thought";
    ActivityKind["Action"] = "action";
})(ActivityKind || (exports.ActivityKind = ActivityKind = {}));
class Activity {
    constructor(params) {
        Object.assign(this, params);
    }
    toString() {
        var _a;
        return (0, xml_js_1.js2xml)({ [this.kind]: { _attributes: (_a = this.attributes) !== null && _a !== void 0 ? _a : {}, _text: `\n${this.input}\n` } }, { compact: true });
    }
    toObject() {
        return { ...this };
    }
    static fromObject({ kind, attributes, input }) {
        return new Activity({ kind, attributes, input });
    }
}
exports.Activity = Activity;
Activity.defaults = {};
//# sourceMappingURL=activity.js.map