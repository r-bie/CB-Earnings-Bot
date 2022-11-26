const chalk = require('chalk');
const w3func = require('../../web3')

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.pickPresence;
        console.log(`${client.user.tag} is ${chalk.green('online')}!`);

        await w3func.firstGenEarnings(client);
        await w3func.secondGenEarnings(client);
    }
}