'use strict';


/** Class representing definign a command. */
class Command {
    /**
     * A command
     * @constructor
     * @param {string} name Name of command (not to explicitly how to call command).
     * @param {string} category Category of command.
     * @param {Array<string>} aliases Different ways to execute command.
     * @param {Array<string>} optArgs Optional arguments for command.
     * @param {Array<string>} reqArgs Required arguments for command.
     * @param {boolean} unlimitedArgs Arguments separated by space are not constrained.
     * @param {boolean} nsfw Is command an NSFW command.
     * @param {Array<string>} permissions All required permissions to execute the command.
     * @param {boolean} showCommand Whether or not to display the command in 'help'.
     * @param {}
     * @param {function} executeCommand The function to be executed when the command is run.
     */
    constructor(
        name,
        category,
        aliases,
        optArgs,
        reqArgs,
        unlimitedArgs,
        nsfw,
        permissions,
        showCommand,
        executeCommand,
    ) {
        this.name = name
        this.category = category
        this.aliases = aliases
        this.optArgs = optArgs
        this.reqArgs = reqArgs
        this.unlimitedArgs = unlimitedArgs
        this.nsfw = nsfw
        this.permissions = permissions
        this.showCommand = showCommand
        this.executeCommand = executeCommand
    }
}

module.export = Command;