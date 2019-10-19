'use strict';

/** Class representing a song */
class Song {
    /**
     * Creates a song object
     * @constructor
     * @param {string} title The title of the song/video
     * @param {string} source The source that the video comes from
     * @param {string} id ID used to locate the song/video from the source
     * @param {string} duration Duration of the song/video
     */
    constructor(title, source, id, duration) {
        this.title = title;
        this.source = source;
        this.id = id;
        this.duration = duration;
    }

    /**
     * Gets the URL for the stream
     * @returns {string}
     */
    getURL() {
        switch(this.source) {
            case 'youtube':
            default:
                return `https://youtube.com/watch?v=${this.id}`;
        }
    }
}

module.exports = Song;