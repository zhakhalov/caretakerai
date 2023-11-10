"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = exports.ActivityKind = void 0;
var ActivityKind;
(function (ActivityKind) {
    ActivityKind["Observation"] = "Observation";
    ActivityKind["Thought"] = "Thought";
    ActivityKind["Action"] = "Action";
})(ActivityKind || (exports.ActivityKind = ActivityKind = {}));
class Activity {
    constructor(params) {
        Object.assign(this, params);
    }
    toString() {
        return `//${this.kind} ${this.order}// ${this.input}`;
    }
    toObject() {
        return { ...this };
    }
    static parse(text) {
        var _a, _b;
        const kindRegexp = /^\/\/(.+?)\s/;
        const orderRegexp = /^\/\/\w+\s(.+?)\/\//;
        if (!kindRegexp.test(text)) {
            throw new Error('Cannot parse kind from the given text');
        }
        const kind = (_a = text.match(kindRegexp)) === null || _a === void 0 ? void 0 : _a[1].trim();
        if (!orderRegexp.test(text)) {
            throw new Error('Cannot parse order from the given text');
        }
        const order = parseInt((_b = text.match(orderRegexp)) === null || _b === void 0 ? void 0 : _b[1].trim());
        const input = text.replace(/^\/\/.+\/\/\s/, '');
        const activity = new Activity({ kind, order, input });
        return activity;
    }
    static fromObject({ kind, order, input }) {
        return new Activity({ kind, order, input });
    }
}
exports.Activity = Activity;
Activity.defaults = {};
//# sourceMappingURL=activity.js.map