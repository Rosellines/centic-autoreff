import axios, { AxiosResponse } from "axios";
import chalk from "chalk";
import Web3 from "web3";
import { logMessage } from "../utils/logger";
import { getProxyAgent } from "./proxy";

export class CenticRefferal {
  private refCode: string;
  private proxy: string | null;
  private axiosConfig: any;
  private wallet: any;

  constructor(refCode: string, proxy: string | null = null) {
    this.refCode = refCode;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 60000,
    };
    const web3 = new Web3();
    this.wallet = web3.eth.accounts.create();
  }

  public getWallet(): any {
    return this.wallet;
  }

  async generateSignature(nonce: number): Promise<string> {
    const message = `I am signing my one-time nonce: ${nonce}.\n\nNote: Sign to log into your Centic account. This is free and will not require a transaction.`;
    const signature = this.wallet.sign(message);
    return signature.signature;
  }

  async makeRequest(method: string, url: string, config: any = {}, retries: number = 3): Promise<AxiosResponse | null> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          method,
          url,
          ...this.axiosConfig,
          ...config,
        });
        return response;
      } catch (error) {
        if (i === retries - 1) {
          logMessage(null, null, `Request failed: ${(error as any).message}`, "error");
          if (this.proxy) {
            logMessage(null, null, `Failed proxy: ${this.proxy}`, "error");
          }
          return null;
        }
        console.log(chalk.yellow(`Retrying... (${i + 1}/${retries})`));
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    return null;
  }

  async login(): Promise<string | null> {
    const nonce = Math.floor(Math.random() * 1000000);
    const signature = await this.generateSignature(nonce);
    const loginData = {
      address: this.wallet.address,
      nonce: nonce,
      signature: signature,
    };

    const response = await this.makeRequest("post", "https://develop.centic.io/dev/v3/auth/login", {
      data: loginData,
      headers: {
        "x-ApiKey": "dXoriON31OO1UopGakYO9f3tX2c4q3oO7mNsjB2nJsKnW406",
      },
    });
    if (response && response.data && response.data.apiKey) {
      return response.data.apiKey;
    } else {
      logMessage(null, null, "Failed to login", "error");
      return null;
    }
  }

  async checkInvite(apiKey: string): Promise<boolean> {
    const inviteData = {
      referralCode: this.refCode,
    };
  
    const response = await this.makeRequest("post", "https://develop.centic.io/ctp-api/centic-points/invites", {
      data: inviteData,
      headers: {
        "x-ApiKey": apiKey,
      },
    });
  
    if (response && response.data) {
      logMessage(null, null, "Referral successful", "success");
      return true;
    } else {
      logMessage(null, null, "Failed to check invite", "error");
      return false;
    }
  }
}