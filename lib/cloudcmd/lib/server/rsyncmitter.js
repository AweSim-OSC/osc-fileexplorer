'use strict';
const {EventEmitter} = require('events');

function percentComplete(line) {
    let match = line.match(/(\d+)%/);

    return (match) ? parseInt(match[0]) : 0;
}

function mayHavePercentComplete(line) {
    return line.search(/^\s/) != -1;
}

class RsyncMitter extends EventEmitter {
    constructor(rsyncCmd) {
        super();
        this.cmd = rsyncCmd;
        this._percent_complete = 0;
    }

    run() {
        this._pid = this.cmd.execute(
            this._end.bind(this),
            this._progress.bind(this),
            this._error.bind(this)
        );
    }

    _progress(data) {
        let data_string = data.toString();
        if(mayHavePercentComplete(data_string)) {
            let percent_complete = percentComplete(data_string);
            // Sometimes rsync's progress goes down; let's only go up
            if(percent_complete > this._percent_complete) {
                this._percent_complete = percent_complete;
            }
        }

        this.emit('progress', this._percent_complete);
    }

    _end(error, code, cmd) {
        this.emit('end', error);
    }

    _error(data) {
        this.emit(data.toString());
    }
}

module.exports = RsyncMitter;