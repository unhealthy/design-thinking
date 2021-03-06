// import * as IO from 'socket.io-client';
import * as fs from 'fs';
import * as PlaySound from 'node-aplay';
import * as RecordSound from 'node-arecord';
import * as events from 'events';
import {
    MESSAGE,
    PUSH_UNREAD_MESSAGE,
    READ_MESSAGE,
    SEND_MESSAGE,
} from './eventType.js';

/**
 * MessageManager
 */
interface Message {
    id: string;
    fileName: string;
}

interface RawMessage extends Message {
    buffer: Buffer;
}

const SENT_MESSAGE_PATH = './resource/sent';
const RECEIVED_MESSAGE_PATH = './resource/received';
const TEMP_RECORD_FILE = 'temp.wav';
export default class MessageManager {
    static EMPTY_UNREAD_MESSAGE: string = 'EMPTY_UNREAD_MESSAGE';

    private _eventManager: NodeJS.EventEmitter;
    private _socket: SocketIOClient.Socket;

    private _unReadMessages: Array<Message>;
    private _readMessages: Array<Message>;
    private _sentMessageFileList: Array<string>;

    private _isPlaying: boolean = false;
    private _isRecording: boolean = false;
    private _recordTimeoutGap: number = 1500;
    private _recordTimer: NodeJS.Timer;
    private _recordSound: Sound;

    constructor(socket: SocketIOClient.Socket, eventManager: NodeJS.EventEmitter) {
        this._socket = socket;
        this._eventManager = eventManager;

        this._unReadMessages = [];
        this._readMessages = [];
        // init received message files
        fs.readdir(RECEIVED_MESSAGE_PATH, (err, files) => {
            const unReadMarkLength = '_unread.wav'.length;
            const extLength = '.wav'.length;
            files.filter(file => file !== '.gitkeep').forEach((fileName: string) => {
                if (fileName.includes('unread')) {
                    this._unReadMessages.push({
                        id: fileName.slice(0, fileName.length - unReadMarkLength),
                        fileName: `${RECEIVED_MESSAGE_PATH}/${fileName}`
                    });
                } else {
                    this._readMessages.push({
                        id: fileName.slice(0, fileName.length - extLength),
                        fileName: `${RECEIVED_MESSAGE_PATH}/${fileName}`
                    });
                }
            });
        });
        // init sent message files
        fs.readdir(SENT_MESSAGE_PATH, (err, files) => {
            this._sentMessageFileList = files.filter(file => file !== '.gitkeep').map(file => `${SENT_MESSAGE_PATH}/${file}`);
        });
        this._socket.on(MESSAGE, this.receiveMessage);
        this._socket.on(PUSH_UNREAD_MESSAGE, this.receiveUnreadMessages);
    }

    public recordMessage = (begin = true) => {
        this._isRecording = begin;
        if (this._isRecording) {
            clearTimeout(this._recordTimer);
            if (this._recordSound) return;
            this._recordSound = new RecordSound({
                destination_folder: SENT_MESSAGE_PATH,
                filename: TEMP_RECORD_FILE,
                alsa_format: 'U8',
                alsa_addn_args: ['-c1', '-r8000']
            });
            this._recordSound.on('complete', () => {
                this._recordSound = null;
                console.info('finish recording');
            });
            this._recordSound.record();
        } else {
            this._recordTimer = setTimeout(() => {
                if (!this._recordSound) return;
                this._recordSound.stop();
            }, this._recordTimeoutGap);
        }
    }

    public sendOrPlayMesssage = () => {
        if (this._isPlaying || this._isRecording) return;
        let tempFileName = `${SENT_MESSAGE_PATH}/${TEMP_RECORD_FILE}`;
        fs.access(tempFileName, err => {
            if (err) {
                // if no record file then play messages
                console.log('unread message');
                console.log(this._unReadMessages);
                // first play unread message
                if (this._unReadMessages.length) {
                    const msg = this._unReadMessages.shift();
                    const sound = new PlaySound(msg.fileName);
                    this._isPlaying = true;
                    sound.play();
                    sound.on('complete', () => {
                        // rename
                        const newFileName = `${RECEIVED_MESSAGE_PATH}/${msg.id}.wav`;
                        try {
                            fs.renameSync(msg.fileName, newFileName);
                            this._readMessages.push({
                                id: msg.id,
                                fileName: newFileName
                            })
                        } catch (renameErr) {
                            console.log(renameErr);
                        }
                        this._isPlaying = false;
                    });
                    this._socket.emit(READ_MESSAGE, msg.id);
                    if (this._unReadMessages.length === 0) {
                        this._eventManager.emit(MessageManager.EMPTY_UNREAD_MESSAGE);
                    }
                } else {
                    console.log(this._readMessages);
                    if (this._readMessages.length === 0) return;
                    const msg = this._readMessages.shift();
                    const sound = new PlaySound(msg.fileName);
                    this._isPlaying = true;
                    sound.play();
                    sound.on('complete', () => {
                        this._isPlaying = false;
                        console.info('complete playing');
                    });
                    this._readMessages.push(msg);
                }
            } else {
                fs.readFile(tempFileName, (err, file) => {
                    if (err) {
                        console.error("read send file err");
                        console.error(err);
                        return;
                    }
                    try {
                        this._socket.emit(SEND_MESSAGE, { buffer: file });
                        const newFileName = `${SENT_MESSAGE_PATH}/sm${this._sentMessageFileList.length}.wav`;
                        this._sentMessageFileList.push(newFileName);
                        fs.renameSync(tempFileName, newFileName);
                    } catch (renameErr) {
                        console.error(renameErr);
                    }
                });
            }
        });
    }

    private receiveMessage = (message: RawMessage) => {
        if (message.id) {
            const fileName = `${RECEIVED_MESSAGE_PATH}/${message.id}-unread.wav`;
            this._unReadMessages.push({
                id: message.id,
                fileName
            });
            fs.writeFile(fileName, message.buffer, err => {
                if (err) console.error(err);
            });
        }
    }

    private receiveUnreadMessages = (messages: Array<RawMessage>) => {
        if (!messages) return;
        messages.forEach(this.receiveMessage);
    }

}
