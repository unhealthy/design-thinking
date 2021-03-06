"use strict";
const IO = require('socket.io-client');
const onoff = require('onoff');
const Pigpio = require('pigpio');
const messageManager_1 = require('./messageManager');
const events = require('events');
const nameSpace_js_1 = require('./nameSpace.js');
const eventType_js_1 = require('./eventType.js');
const Gpio = onoff.Gpio;
const PWMGpio = Pigpio.Gpio;
const MOTOR_MAX_PULSEWIDTH = 2000;
const MOTOR_MIN_PULSEWIDTH = 900;
const ROOM_NAME = 'design-thinking';
class PiClient {
    constructor(hostUrl, userName) {
        this._loginSuccess = false;
        this._sendOrPlayButton = new Gpio(22, 'in', 'falling');
        this._recordHandlerButton = new Gpio(24, 'in', 'both');
        this._motor = new PWMGpio(23, { mode: PWMGpio.OUTPUT });
        this._motorPulseWidth = 2000;
        this._motorIncremental = 50;
        this._motorMoveTimeGap = 200;
        this.onDisconnect = () => {
            console.info('disconnect');
            this._socket.off(eventType_js_1.TEST_PI);
            this._sendOrPlayButton.unwatch();
            this._recordHandlerButton.unwatch();
        };
        this.onConnect = () => {
            console.info('connected');
            this._socket.emit(eventType_js_1.LOGIN, {
                userName: this._userName,
                roomName: ROOM_NAME
            });
        };
        this.onLoginRes = (res) => {
            if (res.state) {
                this._userType = res.userType;
                this._loginSuccess = true;
                console.log('loginSuccess');
                this._sendOrPlayButton.watch((err, value) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(`sentButton ${value}`);
                    if (value === 0) {
                        this._messageManager.sendOrPlayMesssage();
                    }
                });
                this._recordHandlerButton.watch((err, value) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(`recordHandler ${value}`);
                    if (value === 0) {
                        this._messageManager.recordMessage(true);
                    }
                    else {
                        this._messageManager.recordMessage(false);
                    }
                });
            }
            else {
                console.warn(res.info);
            }
        };
        this.openFlower = () => {
            this._motorIncremental = this._motorIncremental > 0 ? this._motorIncremental : -this._motorIncremental;
            this._motorTimer = setInterval(() => {
                if (this._motorPulseWidth >= MOTOR_MAX_PULSEWIDTH) {
                    clearInterval(this._motorTimer);
                }
                else {
                    console.log(this._motorPulseWidth);
                    this._motorPulseWidth += this._motorIncremental;
                    this._motor.servoWrite(this._motorPulseWidth);
                }
            }, this._motorMoveTimeGap);
        };
        this.closeFlower = () => {
            console.log('try close the flower');
            this._motorIncremental = this._motorIncremental < 0 ? this._motorIncremental : -this._motorIncremental;
            this._motorTimer = setInterval(() => {
                if (this._motorPulseWidth <= MOTOR_MIN_PULSEWIDTH) {
                    clearInterval(this._motorTimer);
                }
                else {
                    console.log(this._motorPulseWidth);
                    this._motorPulseWidth += this._motorIncremental;
                    this._motor.servoWrite(this._motorPulseWidth);
                }
            }, this._motorMoveTimeGap);
        };
        this.clearAllGPIO = () => {
            this._sendOrPlayButton.unexport();
            this._recordHandlerButton.unexport();
            this._motor.servoWrite(0);
        };
        this._userName = userName;
        this._socket = IO(`${hostUrl}${nameSpace_js_1.NS_VASE}`);
        this._eventManager = new events.EventEmitter();
        this._messageManager = new messageManager_1.default(this._socket, this._eventManager);
        this._socket.on(eventType_js_1.CONNECT, this.onConnect);
        this._socket.on(eventType_js_1.DISCONNECT, this.onDisconnect);
        this._socket.on(eventType_js_1.LOGIN_RESULT, this.onLoginRes);
        this._socket.on(eventType_js_1.MESSAGE, this.closeFlower);
        this._eventManager.on(messageManager_1.default.EMPTY_UNREAD_MESSAGE, this.openFlower);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PiClient;
//# sourceMappingURL=piClent.js.map