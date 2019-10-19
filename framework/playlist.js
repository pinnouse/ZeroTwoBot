'use strict';

const { PLAYER_STATUS, LOOP_MODE } = require('./playerDefs');

/** Playlist class for each server */
module.exports = class Playlist {
    /** 
     * Creates a new playlist object
     * @constructor
     * @param {import('discord.js').Snowflake} id ID of the playlist
     * @param {import('./playerDefs').LOOP_MODE} loop Should the playlist loop and how
     */
    constructor(id, loop) {
        this.id = id;
        /** @type {import('./playerDefs').PLAYER_STATUS} */
        this.status = PLAYER_STATUS.OFF;
        /** @type {import('./playerDefs').LOOP_MODE} */
        this.loopMode = loop || LOOP_MODE.NONE;
        /** @type {Array<import('./song')>} */
        this.songs = [];
        /** @type {Array<import('./song')>} */
        this.selectList = [];
    }
}