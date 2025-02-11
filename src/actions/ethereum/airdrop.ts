import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";
import {
    initWalletProvider,
    WalletProvider,
} from "../../providers/ethereum/wallet";
import type { Transaction, SupportedChain } from "../../types";
import { parseUnits, formatUnits, type Address } from "viem";
import { airdropTokenTemplate } from "../../templates";
import { ERC20_ABI } from "../../utils/token";

// Constants
const BATCH_SIZE = 100; // Maximum number of recipients per batch
const MAX_RETRIES = 3; // Maximum number of retries for failed transactions

// Airdrop parameters interface
interface AirdropParams {
    tokenAddress: Address;
    recipients: Address[];
    amount?: string;
    amounts?: string[];
}

// Token info interface
interface TokenInfo {
    decimals: number;
    balance: bigint;
    symbol: string;
}

export class AirdropAction {
    constructor(private walletProvider: WalletProvider) {}

    private async getTokenInfo(tokenAddress: Address): Promise<TokenInfo> {
        const publicClient = this.walletProvider.getPublicClient(
            this.walletProvider.getCurrentChain().name as SupportedChain
        );

        try {
            const [decimals, balance, symbol] = await Promise.all([
                publicClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "decimals",
                }) as Promise<number>,
                publicClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [this.walletProvider.getAddress()],
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "symbol",
                }) as Promise<string>,
            ]);

            return { decimals, balance, symbol };
        } catch (error) {
            throw new Error(
                `Failed to get token info: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }

    private validateParams(params: AirdropParams): void {
        // Validate token address
        if (!params.tokenAddress?.startsWith("0x")) {
            throw new Error("Invalid token address");
        }

        // Validate recipients
        if (!params.recipients?.length) {
            throw new Error("Recipients array cannot be empty");
        }

        // Validate recipients addresses
        params.recipients.forEach((addr, i) => {
            if (!addr?.startsWith("0x")) {
                throw new Error(`Invalid recipient address at index ${i}`);
            }
        });

        // Validate amounts
        if (!params.amount && !params.amounts) {
            throw new Error("Either amount or amounts must be provided");
        }

        if (params.amount && params.amounts) {
            throw new Error("Cannot provide both amount and amounts");
        }

        if (
            params.amounts &&
            params.amounts.length !== params.recipients.length
        ) {
            throw new Error("Amounts length must match recipients length");
        }

        // Validate amount values
        if (params.amount && isNaN(Number(params.amount))) {
            throw new Error("Invalid amount value");
        }

        if (params.amounts) {
            params.amounts.forEach((amt, i) => {
                if (isNaN(Number(amt))) {
                    throw new Error(`Invalid amount value at index ${i}`);
                }
            });
        }
    }

    private async validateTokenBalance(
        tokenInfo: TokenInfo,
        totalAmount: bigint
    ): Promise<void> {
        if (tokenInfo.balance < totalAmount) {
            throw new Error(
                `Insufficient token balance. Required: ${formatUnits(
                    totalAmount,
                    tokenInfo.decimals
                )} ${tokenInfo.symbol}, Available: ${formatUnits(
                    tokenInfo.balance,
                    tokenInfo.decimals
                )} ${tokenInfo.symbol}`
            );
        }
    }

    private splitIntoBatches<T>(array: T[], size: number): T[][] {
        return array.reduce((acc, _, i) => {
            if (i % size === 0) {
                acc.push(array.slice(i, i + size));
            }
            return acc;
        }, [] as T[][]);
    }

    async airdrop(params: AirdropParams): Promise<Transaction> {
        this.validateParams(params);

        elizaLogger.info(
            `Preparing airdrop to ${params.recipients.length} recipients`
        );

        try {
            const chain = this.walletProvider.getCurrentChain();
            const walletClient = this.walletProvider.getWalletClient(
                chain.name as SupportedChain
            );
            const publicClient = this.walletProvider.getPublicClient(
                chain.name as SupportedChain
            );

            // Get token info
            const tokenInfo = await this.getTokenInfo(params.tokenAddress);
            elizaLogger.info(
                `Token info - Symbol: ${tokenInfo.symbol}, Decimals: ${tokenInfo.decimals}`
            );

            // Prepare amounts array with correct decimals
            const amounts =
                params.amounts ||
                params.recipients.map(() => params.amount as string);
            const amountsInWei = amounts.map((amt) =>
                parseUnits(amt, tokenInfo.decimals)
            );

            // Calculate total amount
            const totalAmount = amountsInWei.reduce(
                (sum, amt) => sum + amt,
                0n
            );

            // Validate balance
            await this.validateTokenBalance(tokenInfo, totalAmount);

            // Split recipients and amounts into batches
            const recipientBatches = this.splitIntoBatches(
                params.recipients,
                BATCH_SIZE
            );
            const amountBatches = this.splitIntoBatches(
                amountsInWei,
                BATCH_SIZE
            );

            let lastHash: `0x${string}` | undefined;

            // Process each batch
            for (let i = 0; i < recipientBatches.length; i++) {
                const batchRecipients = recipientBatches[i];
                const batchAmounts = amountBatches[i];

                elizaLogger.info(
                    `Processing batch ${i + 1}/${
                        recipientBatches.length
                    } (${batchRecipients.length} recipients)`
                );

                // Call batchTransfer
                const hash = await walletClient.writeContract({
                    address: params.tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "batchTransfer",
                    args: [batchRecipients, batchAmounts],
                    chain,
                    account: walletClient.account,
                });

                // Wait for transaction confirmation
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash,
                    timeout: 60_000, // 60 seconds timeout
                });

                if (receipt.status !== "success") {
                    throw new Error(
                        `Batch ${i + 1} failed: Transaction reverted`
                    );
                }

                lastHash = hash;
                elizaLogger.info(`Batch ${i + 1} completed. Hash: ${hash}`);
            }

            if (!lastHash) {
                throw new Error("No transactions were executed");
            }

            return {
                hash: lastHash,
                from: this.walletProvider.getAddress(),
                to: params.tokenAddress,
                data: "0x", // Contract interaction
                value: parseUnits("0", tokenInfo.decimals),
            };
        } catch (error) {
            elizaLogger.error("Error in airdrop:", error);
            throw new Error(
                `Airdrop failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }
}

const buildAirdropDetails = async (
    state: State,
    runtime: IAgentRuntime
): Promise<AirdropParams> => {
    const context = composeContext({
        state,
        template: airdropTokenTemplate,
    });

    const airdropDetails = (await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    })) as AirdropParams;

    // Validate the generated parameters
    if (!airdropDetails.tokenAddress || !airdropDetails.recipients) {
        throw new Error("Token address and recipients are required");
    }

    return airdropDetails;
};

export const airdropAction: Action = {
    name: "airdrop_token",
    description: "Airdrop ERC20 tokens to multiple recipients",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        elizaLogger.info("Airdrop token action handler called");

        try {
            const walletProvider = initWalletProvider(runtime);
            const action = new AirdropAction(walletProvider);

            // Build airdrop parameters
            const params = await buildAirdropDetails(state, runtime);

            // Execute airdrop
            const airdropResult = await action.airdrop(params);

            if (callback) {
                const totalRecipients = params.recipients.length;
                const batchCount = Math.ceil(totalRecipients / BATCH_SIZE);
                const totalAmount = params.amounts
                    ? params.amounts
                          .reduce((sum, amt) => sum + Number(amt), 0)
                          .toString()
                    : (Number(params.amount) * totalRecipients).toString();

                callback({
                    text:
                        `Successfully completed airdrop:\n` +
                        `- Token: ${params.tokenAddress}\n` +
                        `- Recipients: ${totalRecipients}\n` +
                        `- Total Amount: ${totalAmount}\n` +
                        `- Batches: ${batchCount}\n` +
                        `- Final Transaction Hash: ${airdropResult.hash}`,
                    content: {
                        success: true,
                        hash: airdropResult.hash,
                        tokenAddress: params.tokenAddress,
                        recipientCount: totalRecipients,
                        batchCount,
                        totalAmount,
                        recipients: params.recipients,
                        amounts:
                            params.amounts ||
                            params.recipients.map(() => params.amount),
                        batchSize: BATCH_SIZE,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in airdrop action:", error);
            if (callback) {
                callback({
                    text: `Error during airdrop: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`,
                    content: {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                        errorDetails:
                            error instanceof Error
                                ? {
                                      name: error.name,
                                      message: error.message,
                                      stack: error.stack,
                                  }
                                : undefined,
                    },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I'll help you airdrop 100 tokens to multiple addresses",
                    action: "AIRDROP_TOKEN",
                },
            },
            {
                user: "user",
                content: {
                    text: "Airdrop 100 tokens to 0x1234... and 0x5678...",
                    action: "AIRDROP_TOKEN",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Send different amounts to multiple addresses: 100 to 0x1234 and 200 to 0x5678",
                    action: "AIRDROP_TOKEN",
                },
            },
        ],
    ],
    similes: [
        "distribute tokens",
        "token airdrop",
        "batch transfer",
        "send tokens to many",
        "mass transfer",
        "bulk send",
        "token distribution",
        "multiple transfer",
    ],
};
