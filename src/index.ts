import chalk from "chalk";
import fs from "fs";
import { CenticRefferal } from "./classes/centic";
import { getRandomProxy, loadProxies } from "./classes/proxy";
import { logMessage, prompt, rl } from "./utils/logger";

async function main(): Promise<void> {
  console.log(
    chalk.cyan(`
░█▀▀░█▀▀░█▀█░▀█▀░▀█▀░█▀▀
░█░░░█▀▀░█░█░░█░░░█░░█░░
░▀▀▀░▀▀▀░▀░▀░░▀░░▀▀▀░▀▀▀
     By : El Puqus Airdrop
     github.com/ahlulmukh
  `)
  );

  const refCode = await prompt(chalk.yellow("Enter Referral Code: "));
  const count = parseInt(await prompt(chalk.yellow("How many do you want? ")));
  const proxiesLoaded = loadProxies();
  if (!proxiesLoaded) {
    console.log(chalk.yellow("No proxy available. Using default IP."));
  }
  let successful = 0;

  const accountsCentic = fs.createWriteStream("accounts.txt", { flags: "a" });

  for (let i = 0; i < count; i++) {
    console.log(chalk.white("-".repeat(85)));
    logMessage(i + 1, count, "Process", "debug");

    const currentProxy = await getRandomProxy();
    const centic = new CenticRefferal(refCode, currentProxy);

    const apiKey = await centic.login();
    if (apiKey) {
      const inviteSuccess = await centic.checkInvite(apiKey);
      if (inviteSuccess) {
        successful++;
        const wallet = centic.getWallet();
        accountsCentic.write(`Wallet Address : ${wallet.address}\nPrivate Key : ${wallet.privateKey}\n`);
        accountsCentic.write(`===================================================================\n`);
      }
    }
  }

  accountsCentic.end();

  console.log(chalk.magenta("\n[*] Dono bang!"));
  console.log(chalk.green(`[*] Account dono ${successful} dari ${count} akun`));
  console.log(chalk.magenta("[*] Result in accounts.txt"));
  rl.close(); 
}

main().catch((err) => {
  console.error(chalk.red("Error occurred:"), err);
  process.exit(1);
});