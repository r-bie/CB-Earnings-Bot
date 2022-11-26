const { EmbedBuilder } = require(`discord.js`);

const Web3 = require('web3');
const puppeteer = require('puppeteer');

const cryptoblades = "0x39Bea96e13453Ed52A734B6ACEeD4c41F57B2271";
const treasury = '0x812Fa2f7d89e5d837450702bd51120920dccaA99';
const USER_ADDRESS = "0xA8e48AfbD74f58d16290A5253571430665A3f78c";

const cbABI = require('./abis/cryptoblades.json');
const treasuryABI = require('./abis/treasury.json');

const node = 'https://rpc.ankr.com/bsc';

const dexURL = 'https://dexscreener.com/bsc/0x8730c8dedc59e3baffb67bf1fa63d4f0e2d9ecc9';
const xPath = '//*[@id="root"]/div/main/div/div/div[2]/div/div/div[1]/div[1]/div[2]/span[2]/div/span';

const gasFee = 0.00063716; // fight cost
const swapFee = 0.00057813; // swap cost
const sendFee = 0.000105; // send cost
const claimFee = 0.00066842; // claim cost
const fightMultiplier = 5; // 40 stamina * fightMultiplier
const charLimit = 4; // character limit per account

/*  This are variables for getTokenGainForFight contract call.
    This can be updated when in need to adjust profitability for both GEN1 and GEN2 characters.*/
const averageWeapon = 1000; // average weapon power
const charPower = 1000; // average character power
const bonusPower = 0; // bonus power

/*  This are variables for GEN2 earnings data.
    This can be updated when in need to adjust profitability for GEN2 chars.*/
const valorMultiplier = 0.4927; // VALOR / VALOR
const dayMultiplier = 5; // days variable before claiming
const accountMultiplier = 5; // number of accounts
const winRate = 0.9; // GEN2 winrate currently set @ %90
const totalFights = charLimit * accountMultiplier * dayMultiplier;
const sendMultiplier = getSendFee(accountMultiplier);


/*  Setting up crypto prices.
    */
async function getFromCoingecko() {
    const bnbURL = 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd';
    const skillURL = 'https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades&vs_currencies=usd';

    const bnbResponse = await fetch(bnbURL).then(data => { return data.json() });
    const bnbValue = bnbResponse.binancecoin.usd;
    const skillResponse = await fetch(skillURL).then(data => { return data.json() });
    const skillValue = skillResponse.cryptoblades.usd;

    return [bnbValue, skillValue];
}

function getSendFee(accountMultiplier) {
    if (accountMultiplier === 1) return accountMultiplier;

    if (accountMultiplier > 1 ) {
        accountMultiplier -= 1;
        return accountMultiplier;
    }
}

async function getValorPrice() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(dexURL);
    var datatype, span;

    const [el] = await page.$x(xPath);
    datatype = await el.getProperty('textContent');
    span = await datatype.jsonValue();
    responseArray = span.split(" ");

    await browser.close();
    return responseArray[0];
}

async function getTokenGainForFight(lowestUnalignedPower) {
    const web3 = new Web3(new Web3.providers.HttpProvider(node));

    const contract = new web3.eth.Contract(cbABI, cryptoblades);
    const getTokenGainForFight = await contract.methods.getTokenGainForFight(lowestUnalignedPower).call({ from: USER_ADDRESS });
    var tokenInEther = parseFloat(getTokenGainForFight * 0.000000000000000001).toFixed(6);
    return tokenInEther;
}



async function getSkillMultiplier() {
    // declaring web3 environment
    const web3 = new Web3(new Web3.providers.HttpProvider(node));

    const contract = new web3.eth.Contract(treasuryABI, treasury);
    const getActivePartnerProjectsIds = await contract.methods.getActivePartnerProjectsIds().call({ from: USER_ADDRESS });
    let projectArray = getActivePartnerProjectsIds;
    const getAmountOfActiveProjects = await contract.methods.getAmountOfActiveProjects().call({ from: USER_ADDRESS });
    x = getAmountOfActiveProjects;
    var multiplierArray = [];

    for (let i = 0; i < x; i++) {
        const getProjectData = await contract.methods.getProjectData(projectArray[i]).call({ from: USER_ADDRESS });
        const getProjectMultiplier = await contract.methods.getProjectMultiplier(projectArray[i]).call({ from: USER_ADDRESS });
        const getRemainingPartnerTokenSupply = await contract.methods.getRemainingPartnerTokenSupply(projectArray[i]).call({ from: USER_ADDRESS });

        // storing data from project data array
        var partnerArray = getProjectData; // project data array
        var tokenDesc = partnerArray[1];
        var getTokenName = tokenDesc.split(" ")[0];
        var multiplier = parseFloat(getProjectMultiplier * 0.000000000000000001).toFixed(4);
        var claimable = parseFloat(getRemainingPartnerTokenSupply * 0.000000000000000001).toFixed(3);

        if (getTokenName != 'VALOR') {
            multiplierArray.push(multiplier);
        }
    }
    var sortedArray = multiplierArray.sort(function (a, b) { return b - a });
    console.log(sortedArray);
    console.log(`Highest SKILL Multiplier: ${sortedArray[0]}`);

    return sortedArray[0];
}

async function getValorMultiplier() {
    // declaring web3 environment
    const web3 = new Web3(new Web3.providers.HttpProvider(node));

    const contract = new web3.eth.Contract(treasuryABI, treasury);
    const getActivePartnerProjectsIds = await contract.methods.getActivePartnerProjectsIds().call({ from: USER_ADDRESS });
    let projectArray = getActivePartnerProjectsIds;
    const getAmountOfActiveProjects = await contract.methods.getAmountOfActiveProjects().call({ from: USER_ADDRESS });
    x = getAmountOfActiveProjects;
    var multiplierArray = [];

    for (let i = 0; i < x; i++) {
        const getProjectData = await contract.methods.getProjectData(projectArray[i]).call({ from: USER_ADDRESS });
        const getProjectMultiplier = await contract.methods.getProjectMultiplier(projectArray[i]).call({ from: USER_ADDRESS });
        const getRemainingPartnerTokenSupply = await contract.methods.getRemainingPartnerTokenSupply(projectArray[i]).call({ from: USER_ADDRESS });

        // storing data from project data array
        var partnerArray = getProjectData; // project data array
        var tokenDesc = partnerArray[1];
        var getTokenName = tokenDesc.split(" ")[0];
        var multiplier = parseFloat(getProjectMultiplier * 0.000000000000000001).toFixed(4);
        var claimable = parseFloat(getRemainingPartnerTokenSupply * 0.000000000000000001).toFixed(3);

        if (getTokenName === 'VALOR') {
            multiplierArray.push(multiplier);
        }
    }
    var sortedArray = multiplierArray.sort(function (a, b) { return b - a });
    console.log(sortedArray);
    console.log(`Highest VALOR Multiplier: ${sortedArray[0]}`);

    return sortedArray[0];
}

async function firstGenEarnings(client) {
    var lowestUnalignedPower = (((averageWeapon * 0.0025) + 1) * charPower) + bonusPower;
    var [bnbValue, skillValue] = await getFromCoingecko();

    var etherValue = await getTokenGainForFight(lowestUnalignedPower);
    var fullFight = (etherValue * fightMultiplier) * charLimit;
    var fullFightCost = gasFee * charLimit;

    // general info
    console.log(`BNB: ${bnbValue} \nSKILL: ${skillValue}`);
    console.log(`\n================\nGEN1 EARNINGS BREAK DOWN`);
    console.log(`================\nToken Gain per fight\nEther: ${etherValue}`);
    console.log(`================\n200 Stamina fight: ${etherValue * fightMultiplier} SKILL`);
    console.log(`================\nUnclaimed per account: ${fullFight} SKILL`);
    console.log(`Gas Fee per Account : ${fullFightCost} BNB\n================`);

    // gen1 calculation data
    var highestSkillMulti = await getSkillMultiplier();
    var claimedSKILL = parseFloat(fullFight * highestSkillMulti).toFixed(4);
    var claimedSKILLtoUSD = parseFloat(skillValue * claimedSKILL).toFixed(2);
    var gasFeetoUSD = parseFloat((fullFightCost + swapFee + claimFee) * bnbValue).toFixed(2);
    var profit = parseFloat(claimedSKILLtoUSD - gasFeetoUSD).toFixed(2);

    // gen1 calculation result
    console.log(`================\nClaimed SKILL after multiplier: ${claimedSKILL} SKILL`);
    console.log(`Claimed SKILL to USD: ${claimedSKILLtoUSD} USD`);
    console.log(`Fight gas fee to USD: ${gasFeetoUSD} USD`);
    console.log(`Profit after fight: ${profit} USD\n================`);

    const firstGenEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('GEN1 Earnings Data')
        .setDescription('Detailed earnings data for GEN1 characters.')
        .setURL('https://app.cryptoblades.io/')
        .addFields(
            { name: 'BNB', value: `${bnbValue}`, inline: true },
            { name: 'SKILL', value: `${skillValue}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true })
        .addFields(
            { name: 'Character Power', value: `Level 1 (${charPower})`, inline: true },
            { name: 'Weapon Power', value: `5* Battle Power : ${averageWeapon}`, inline: true },
            { name: 'Multiplier (SKILL)', value: `${highestSkillMulti}`, inline: true }
        )
        .addFields(
            { name: 'Unclaimed per character per 200 Stamina', value: `${etherValue * fightMultiplier}`, inline: false })
        .addFields(
            { name: 'Unclaimed per account', value: `${fullFight}`, inline: false })
        .addFields(
            { name: 'Gas Fee (4 fights)', value: `${fullFightCost}`, inline: true },
            { name: 'Gas Fee (Swap)', value: `${swapFee}`, inline: true },
            { name: 'Gas fee(Claim)', value: `${claimFee}`, inline: true })
        .addFields(
            { name: 'Claimed SKILL after multiplier', value: `${claimedSKILL}`, inline: false })
        .addFields(
            { name: 'Claimed SKILL value', value: `$${claimedSKILLtoUSD}`, inline: true },
            { name: 'Gas fee value', value: `$${gasFeetoUSD}`, inline: true },
            { name: 'Profit', value: `$${profit}`, inline: true })
        .setTimestamp()
        .setFooter({ text: `Note : All data are subjected to change depending on cyrpto prices.` });

    client.channels.fetch('989595393778126922')
        .then(channel => {
            channel.send({ embeds: [firstGenEmbed] });
        });
}

async function secondGenEarnings(client) {
    const valorPrice = await getValorPrice();
    var [bnbValue, skillValue] = await getFromCoingecko();

    var lowestUnalignedPower = (((averageWeapon * 0.0025) + 1) * charPower) + bonusPower;
    
    var etherValue = await getTokenGainForFight(lowestUnalignedPower);
    var fullFight = (etherValue * fightMultiplier);
    var fullFightCost = gasFee * totalFights;

    // general info
    console.log(`BNB: ${bnbValue} \nSKILL: ${skillValue} \nVALOR: ${valorPrice}`);
    console.log(`\n================\nGEN2 EARNINGS BREAK DOWN`);
    console.log(`================\nToken Gain per fight\nEther: ${etherValue}`);
    console.log(`================\n200 Stamina fight: ${etherValue * fightMultiplier} SKILL`);
    console.log(`================\nTotal unclaimed for ${accountMultiplier} in ${dayMultiplier} day(s): ${fullFight} SKILL`);
    console.log(`Gas Fee per Account : ${fullFightCost} BNB\n================`);

    // gen2 calculation data
    var highestValorMulti = 1.6;//await getValorMultiplier(); // highest valor multi
    console.log(highestValorMulti);
    var secondGenFullFight = parseFloat(fullFight * totalFights * winRate).toFixed(4); // Unclaimed VALOR
    
    // second gen gas cost
    var secondGenFullFightCost = fullFightCost; // gas fee for 10 accounts for 5 days
    var secondGenFullSendCost = parseFloat(sendFee * sendMultiplier).toFixed(6); // gas fee for sending claimed valor to 1 account
    var secondGenSwapFee = swapFee * 2; // gas fee for swapping from VALOR > SKILL > BUSD/BNB
    var secondGenFullClaimCost = parseFloat(claimFee * accountMultiplier).toFixed(6);
    var secondGenTotalGas = parseFloat(Number(secondGenFullFightCost) + Number(secondGenFullSendCost) + Number(secondGenSwapFee) + Number(secondGenFullClaimCost)).toFixed(6); // total gas fee for fights, claiming and sending
    
    // profit calculation for second gen
    var claimedValor = parseFloat((secondGenFullFight * highestValorMulti) / valorMultiplier).toFixed(4); // claimed valor after multi and valor/valor
    var claimedVALORtoSKILL = parseFloat(claimedValor / valorPrice).toFixed(4); // converting claimed valor to skill
    var secondGenSKILLtoUSD = parseFloat(skillValue * claimedVALORtoSKILL).toFixed(2); // converted skill in usd
    var secondGenGastoUSD = parseFloat(secondGenTotalGas * bnbValue).toFixed(2); // total gas cost in usd
    var secondGenProfit = parseFloat(secondGenSKILLtoUSD - secondGenGastoUSD).toFixed(2); // second gen profit calc

    // gen2 calculation result
    console.log(`================\nUnclaimed Valor for ${accountMultiplier} accounts for ${dayMultiplier} days: ${secondGenFullFight} VALOR`);
    console.log(`================\nGEN2 GAS BREAKDOWN\n================`)
    console.log(`GEN2 Full Fight Cost: ${secondGenFullFightCost} BNB`);
    console.log(`Send cost: ${secondGenFullSendCost} BNB`);
    console.log(`Swap fee: ${secondGenSwapFee} BNB`);
    console.log(`Claim Cost (${accountMultiplier} accounts): ${secondGenFullClaimCost} BNB`);
    console.log(`GEN2 Total Gas spent: ${secondGenTotalGas} BNB`);
    console.log(`================\nClaimed Valor: ${claimedValor} VALOR`);
    console.log(`Valor to Skill conversion: ${claimedVALORtoSKILL} SKILL`);
    console.log(`Claimed SKILL (from VALOR) : ${secondGenSKILLtoUSD} USD`);
    console.log(`Gas used (GEN2) : ${secondGenGastoUSD} USD`);
    console.log(`GEN2 profit: ${secondGenProfit} USD\n================`);

    const secondGenEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('GEN 2 Earnings Data')
        .setDescription(`Detailed earnings data for GEN2 characters. (${accountMultiplier} accounts)`)
        .setURL('https://app.cryptoblades.io/')
        .addFields(
            { name: 'BNB', value: `${bnbValue}`, inline: true },
            { name: 'SKILL', value: `${skillValue}`, inline: true },
            { name: 'VALOR', value: `${valorPrice}`, inline: true })
        .addFields(
            { name: 'Character Power', value: `Level 1 (${charPower})`, inline: true },
            { name: 'Weapon Power', value: `5* Battle Power : ${averageWeapon}`, inline: true },
            { name: 'Multiplier (VALOR)', value: `${highestValorMulti} (${valorMultiplier}/${valorMultiplier})`, inline: true }
        )
        .addFields(
            { name: 'Unclaimed per character per 200 Stamina', value: `${etherValue * fightMultiplier}`, inline: true },
            { name: 'Unclaimed per account', value: `${fullFight * charLimit}`, inline: true })
        .addFields(
            { name: `Unclaimed for ${accountMultiplier} account(s) for ${dayMultiplier} day(s) (%${winRate * 100} Win Rate)`, value: `${secondGenFullFight}`, inline: false })
        .addFields(
            { name: 'Gas Fee (Fights)', value: `${secondGenFullFightCost}`, inline: false },
            { name: 'Gas Fee (2 Swap)', value: `${secondGenSwapFee}`, inline: true },
            { name: `Gas Fee (${accountMultiplier} Claim)`, value: `${secondGenFullClaimCost}`, inline: true },
            { name: `Gas Fee (${sendMultiplier} Send)`, value: `${secondGenFullSendCost}`, inline: true })
        .addFields(
            { name: 'Claimed VALOR', value: `${claimedValor}`, inline: true },
            { name: 'VALOR to SKILL', value: `${claimedVALORtoSKILL}`, inline: true })
        .addFields(
            { name: 'SKILL (From VALOR)', value: `$${secondGenSKILLtoUSD}`, inline: true },
            { name: 'Total Gas Fee', value: `$${secondGenGastoUSD}`, inline: true },
            { name: 'Profit', value: `$${secondGenProfit}`, inline: true })
        .setTimestamp()
        .setFooter({ text: `Note : All data are subjected to change depending on cyrpto prices. Claiming are set to every ${dayMultiplier} days. After claiming send all VALOR to one account then swap to SKILL.` });
    client.channels.fetch('989595393778126922')
        .then(channel => {
            channel.send({ embeds: [secondGenEmbed] });
        });
}

//test function
async function getAllPartners() {
    // declaring web3 environment
    const web3 = new Web3(new Web3.providers.HttpProvider(node));

    const contract = new web3.eth.Contract(treasuryABI, treasury);
    const getActivePartnerProjectsIds = await contract.methods.getActivePartnerProjectsIds().call({ from: USER_ADDRESS });
    let projectArray = getActivePartnerProjectsIds;
    const getAmountOfActiveProjects = await contract.methods.getAmountOfActiveProjects().call({ from: USER_ADDRESS });
    x = getAmountOfActiveProjects;
    var multiplierArray = [];

    for (let i = 0; i < x; i++) {
        const getProjectData = await contract.methods.getProjectData(projectArray[i]).call({ from: USER_ADDRESS });
        const getProjectMultiplier = await contract.methods.getProjectMultiplier(projectArray[i]).call({ from: USER_ADDRESS });
        const getRemainingPartnerTokenSupply = await contract.methods.getRemainingPartnerTokenSupply(projectArray[i]).call({ from: USER_ADDRESS });

        // storing data from project data array
        var partnerArray = getProjectData; // project data array
        var tokenDesc = partnerArray[1];
        var getTokenName = tokenDesc.split(" ")[0];
        var multiplier = parseFloat(getProjectMultiplier * 0.000000000000000001).toFixed(4);
        var claimable = parseFloat(getRemainingPartnerTokenSupply * 0.000000000000000001).toFixed(3);

        console.log(projectArray[i]);
        console.log(getProjectData);
        console.log("");
    }

}

module.exports = { secondGenEarnings, firstGenEarnings }