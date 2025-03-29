const { Keypair } = require("@solana/web3.js"); const nacl = require("tweetnacl"); const bs58 = require("bs58"); const axios = require("axios"); const fs = require("fs"); const readline = require("readline"); const { HttpsProxyAgent } = require("https-proxy-agent"); const chalk = require("chalk"); const figlet = require("figlet");

function print_banner() { console.log(chalk.cyan(figlet.textSync("HAIO BOT"))); console.log(chalk.cyan("╔════════════════════════════════════════════════════╗")); console.log(chalk.cyan("║                 SOLANA REFERRAL BOT                ║")); console.log(chalk.cyan("║         Automate your HAiO referral process!       ║")); console.log(chalk.cyan("║    Developed by: https://t.me/Offical_Im_kazuha    ║")); console.log(chalk.cyan("║    GitHub: https://github.com/Kazuha787            ║")); console.log(chalk.cyan("╚════════════════════════════════════════════════════╝")); }

print_banner();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); async function getInput(prompt) { return new Promise(resolve => rl.question(chalk.yellow(prompt), resolve)); }

const proxyList = fs.readFileSync("proxy.txt", "utf8").split("\n").map(p => p.trim()).filter(p => p); function getRandomProxy() { return proxyList[Math.floor(Math.random() * proxyList.length)]; }

(async () => { console.log(chalk.green("🔹 Running Script...")); const referralCode = await getInput("🎟️ Enter referral code: "); let referralCount = await getInput("🔢 Number of referrals (max 50): "); referralCount = Math.min(Math.max(parseInt(referralCount), 1), 50); rl.close();

async function getIP(proxy) {
    try {
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.get("https://api.ipify.org?format=json", { httpsAgent: agent });
        console.log(chalk.green("🌍 Proxy IP: " + response.data.ip));
    } catch (error) {
        console.error(chalk.red("❌ Failed to retrieve proxy IP: " + error.message));
    }
}

async function requestChallenge(publicKey, agent) {
    try {
        const response = await axios.post("https://prod-api.haio.fun/api/auth/request-challenge", { publicKey }, { httpsAgent: agent });
        return response.data.success ? response.data.content.message : null;
    } catch (error) {
        console.error(chalk.red("❌ Error requesting challenge: " + (error.response?.data || error.message)));
        return null;
    }
}

function signMessage(message, secretKey) {
    try {
        const messageUint8 = new TextEncoder().encode(message);
        const signature = nacl.sign.detached(messageUint8, secretKey);
        return bs58.encode(signature);
    } catch (error) {
        console.error(chalk.red("❌ Error signing message: " + error.message));
        return null;
    }
}

async function verifyLogin(publicKey, secretKey, challengeMessage, agent) {
    const signature = signMessage(challengeMessage, secretKey);
    if (!signature) return null;
    try {
        const response = await axios.post("https://prod-api.haio.fun/api/auth/verify", { publicKey, signature }, { httpsAgent: agent });
        return response.data.success ? response.data.content.accessToken : null;
    } catch (error) {
        console.error(chalk.red("❌ Error verifying login: " + (error.response?.data || error.message)));
        return null;
    }
}

async function useReferral(token, agent) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await axios.post("https://login-er46geo74a-uc.a.run.app/", { referralCode }, { headers: { Authorization: `Bearer ${token}` }, httpsAgent: agent });
        console.log(response.data.success ? chalk.green("✅ Referral Applied Successfully!") : chalk.red("❌ Failed to use referral"));
    } catch (error) {
        console.error(chalk.red("❌ Error using referral: " + (error.response?.data || error.message)));
    }
}

async function claimReward(token, agent) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await axios.post("https://claimscratchboxcoupon-er46geo74a-uc.a.run.app/", {}, { headers: { Authorization: `Bearer ${token}` }, httpsAgent: agent });
        console.log(response.data.success ? chalk.green("✅ Reward Claimed Successfully!") : chalk.red("❌ Failed to claim reward"));
    } catch (error) {
        console.error(chalk.red("❌ Error claiming reward: " + (error.response?.data || error.message)));
    }
}

for (let i = 0; i < referralCount; i++) {
    console.log(chalk.blue(`\n🔄 Creating Wallet ${i + 1}...`));
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKey = bs58.encode(keypair.secretKey);
    console.log(chalk.green("✅ Solana Wallet Created"));
    console.log("🔑 Public Key:", chalk.yellow(publicKey));
    console.log("🔐 Secret Key:", chalk.red(secretKey));
    const proxy = getRandomProxy();
    const agent = new HttpsProxyAgent(proxy);
    console.log("🌐 Using Proxy:", chalk.magenta(proxy));
    await getIP(proxy);
    const challengeMessage = await requestChallenge(publicKey, agent);
    if (!challengeMessage) continue;
    const token = await verifyLogin(publicKey, keypair.secretKey, challengeMessage, agent);
    if (!token) continue;
    console.log(chalk.green(`🔄 Applying referral ${i + 1}/${referralCount}...`));
    await useReferral(token, agent);
    console.log(chalk.green("🎁 Claiming reward..."));
    await claimReward(token, agent);
}

console.log(chalk.green("📂✅ All wallets have been saved in data.txt"));

})();

 
