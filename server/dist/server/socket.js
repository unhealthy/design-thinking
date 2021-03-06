"use strict";
const Socket = require('socket.io');
const decay_1 = require('../decay');
const fs = require('fs');
const nameSpace_js_1 = require('../nameSpace.js');
const eventType_js_1 = require('../eventType.js');
const messageController_1 = require('../controllers/messageController');
const PARENT = "parent";
const CHILD = "child";
const RESOURCE_PATH = './resource';
function attachIO(server) {
    const io = Socket(server);
    const userNameToUser = {};
    const roomNameToRooms = {};
    const rooms = [];
    const tickInterval = 1000;
    const decayInitvalue = 100;
    const loginedAlbumUser = new Set();
    const loginedVaseUser = new Set();
    io.of(nameSpace_js_1.NS_ALBUM).on('connection', socket => {
        console.info('user connect');
        let userName;
        let roomName;
        let targetType;
        let userType;
        let loginSuccess = false;
        socket.on(eventType_js_1.LOGIN, (params) => {
            console.info(params);
            if (!params || !params.roomName || !params.userName) {
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'no login params' });
                console.error('no login params');
                return;
            }
            if (params.userName !== 'daddy' && params.userName !== "boy") {
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'wrong userName' });
                console.error('wrong username');
                return;
            }
            if (loginedAlbumUser.has(params.userName)) {
                const user = userNameToUser[params.userName];
                io.sockets.connected[user.album] && io.sockets.connected[user.album].disconnect();
                console.error('this user already login, but I just disconnect him');
            }
            userName = params.userName;
            roomName = params.roomName;
            userType = userName === "daddy" ? PARENT : CHILD;
            targetType = userType === CHILD ? PARENT : CHILD;
            if (!(roomName in roomNameToRooms)) {
                const room = roomNameToRooms[roomName] = {
                    parent: { album: null, vase: null },
                    child: { album: null, vase: null },
                    roomName: roomName,
                    decayManager: new decay_1.default(decayInitvalue)
                };
                rooms.push(room);
            }
            if (!(userType in roomNameToRooms[roomName])) {
                roomNameToRooms[roomName][userType] = { album: null, vase: null };
            }
            roomNameToRooms[roomName][userType].album = socket.id;
            if (!(userName in userNameToUser)) {
                userNameToUser[userName] = {
                    userName: userName,
                    type: userType,
                    roomName: roomName,
                    album: null,
                    vase: null,
                };
            }
            userNameToUser[userName].album = socket.id;
            socket.join(roomName, joinRoomErr => {
                if (joinRoomErr) {
                    console.error(joinRoomErr);
                    socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'join room failed' });
                    return;
                }
                console.info('join room success');
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: true, info: 'login success', userType: userType });
                loginSuccess = true;
                loginedAlbumUser.add(userName);
            });
        });
        socket.on(eventType_js_1.MOVE_SLIDES, slidesIndex => {
            if (!loginSuccess)
                return;
            if (userType === PARENT) {
                socket.in(roomName).emit(eventType_js_1.MOVE_SLIDES, slidesIndex);
            }
        });
        socket.on('disconnect', () => {
            if (!loginSuccess)
                return;
            const room = roomNameToRooms[roomName];
            if (room) {
                if (!room[userType])
                    return;
                room[userType].album = null;
                if (!room[userType].vase) {
                    delete room[userType];
                    if (!room[targetType]) {
                        delete roomNameToRooms[roomName];
                    }
                }
            }
            loginSuccess = false;
            loginedAlbumUser.delete(userName);
            console.info('user disconnected');
        });
    });
    io.of(nameSpace_js_1.NS_VASE).on('connection', socket => {
        console.info('user connect');
        let userName;
        let roomName;
        let targetType;
        let userType;
        let loginSuccess = false;
        socket.on(eventType_js_1.LOGIN, (params) => {
            console.info(params);
            if (!params || !params.roomName || !params.userName) {
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'no login params' });
                return;
            }
            if (params.userName !== 'daddy' && params.userName !== "boy") {
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'wrong userName' });
                return;
            }
            if (loginedVaseUser.has(params.userName)) {
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'this user already login' });
                return;
            }
            userName = params.userName;
            roomName = params.roomName;
            userType = userName === "daddy" ? PARENT : CHILD;
            targetType = userType === CHILD ? PARENT : CHILD;
            if (!(roomName in roomNameToRooms)) {
                const room = roomNameToRooms[roomName] = {
                    parent: { album: null, vase: null },
                    child: { album: null, vase: null },
                    roomName: roomName,
                    decayManager: new decay_1.default(decayInitvalue)
                };
                rooms.push(room);
            }
            if (!(userType in roomNameToRooms[roomName])) {
                roomNameToRooms[roomName][userType] = { album: null, vase: null };
            }
            roomNameToRooms[roomName][userType].vase = socket.id;
            if (!(userName in userNameToUser)) {
                userNameToUser[userName] = {
                    userName: userName,
                    type: userType,
                    roomName: roomName,
                    album: null,
                    vase: null,
                };
            }
            userNameToUser[userName].vase = socket.id;
            socket.join(roomName, joinRoomErr => {
                if (joinRoomErr) {
                    console.error(joinRoomErr);
                    socket.emit(eventType_js_1.LOGIN_RESULT, { state: false, info: 'join room failed' });
                    return;
                }
                console.info('join room success');
                socket.emit(eventType_js_1.LOGIN_RESULT, { state: true, info: 'login success', userType: userType });
                loginSuccess = true;
                loginedVaseUser.add(userName);
                messageController_1.default.fetchUnReadMessage(targetType, (err, messages) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    if (messages.length) {
                        for (let i = 0, len = messages.length; i < len; ++i) {
                            const msg = messages[i];
                            const filePath = `${RESOURCE_PATH}/${targetType}/${msg.id}.wav`;
                            try {
                                fs.accessSync(filePath);
                                const buffer = fs.readFileSync(filePath);
                                msg.buffer = buffer;
                            }
                            catch (err) {
                                msg.buffer = new Buffer('');
                            }
                        }
                        socket.emit(eventType_js_1.PUSH_UNREAD_MESSAGE, messages);
                    }
                });
            });
        });
        socket.on(eventType_js_1.SEND_MESSAGE, msg => {
            if (!loginSuccess)
                return;
            const room = roomNameToRooms[roomName];
            if (!room)
                return;
            const message = {
                roomName: roomName,
                userType: userType,
                isRead: false,
                isReceived: false,
            };
            if (userType === CHILD) {
                room.decayManager.childSendMessage(10 * 1000);
            }
            console.log('send message try to detect targetType');
            if (room[targetType] && room[targetType].vase) {
                console.log('ready to insertMessage');
                messageController_1.default.insertMessage(message, (err, recordId) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    socket.in(roomName).emit(eventType_js_1.MESSAGE, { buffer: msg.buffer, id: recordId });
                    message.isReceived = true;
                    const filePath = `${RESOURCE_PATH}/${userType}/${recordId}.wav`;
                    fs.writeFile(filePath, msg.buffer, err => {
                        if (err) {
                            console.error(err.message);
                            console.error(err.stack);
                        }
                        else {
                            console.info('write resource success');
                        }
                    });
                });
            }
            else {
                messageController_1.default.insertMessage(message, (err, recordId) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    const filePath = `${RESOURCE_PATH}/${userType}/${recordId}.wav`;
                    fs.writeFile(filePath, msg.buffer, err => {
                        if (err) {
                            console.error(err.message);
                            console.error(err.stack);
                        }
                        else {
                            console.info('write resource success');
                        }
                    });
                });
            }
        });
        socket.on(eventType_js_1.READ_MESSAGE, messageId => {
            if (!loginSuccess)
                return;
            if (!messageId || !messageId.length)
                return;
            const room = roomNameToRooms[roomName];
            if (!room)
                return;
            if (userType === CHILD) {
                room.decayManager.childReadMessage(10 * 1000);
            }
            messageController_1.default.readMessage(messageId, (err, res) => {
                if (err) {
                    console.error(err);
                }
            });
        });
        socket.on('disconnect', () => {
            if (!loginSuccess)
                return;
            const room = roomNameToRooms[roomName];
            if (room) {
                if (!room[userType])
                    return;
                room[userType].vase = null;
                if (!room[userType].album) {
                    delete room[userType];
                    if (!room[targetType]) {
                        delete roomNameToRooms[roomName];
                    }
                }
            }
            loginSuccess = false;
            loginedVaseUser.delete(userName);
            console.info('user disconnected');
        });
    });
    const timer = setInterval(() => {
        rooms.forEach(room => {
            if (!room || !room.child || !room.child.album)
                return;
            const decayManager = room.decayManager;
            io.of(nameSpace_js_1.NS_ALBUM).to(room.child.album).emit(eventType_js_1.DECAY, decayManager.decayOnce(tickInterval));
        });
    }, tickInterval);
    return io;
}
exports.attachIO = attachIO;
//# sourceMappingURL=socket.js.map