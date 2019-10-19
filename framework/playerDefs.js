/**
 * Playlist types module.
 * @module framework/playerDefs
 */

/**
 * Enum for status of player
 * @readonly
 * @enum {number}
 */
module.exports.PLAYER_STATUS = {
    OFF: 0,
    NEXT: 1,
    STREAMING: 2
}

/**
 * Enum for loop modes
 * @readonly
 * @enum {number}
 */
module.exports.LOOP_MODE = {
    NONE: 0,
    SINGLE: 1,
    LIST: 2
}