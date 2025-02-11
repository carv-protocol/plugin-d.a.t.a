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
import { parseEther } from "viem";
import { deployTokenTemplate } from "../../templates";

// Deploy token parameters interface
interface DeployTokenParams {
    name: string;
    symbol: string;
    decimals?: number;
    initialAmount?: string;
    chain?: SupportedChain;
}

export class DeployTokenAction {
    constructor(private walletProvider: WalletProvider) {}

    async deployToken(params: DeployTokenParams): Promise<Transaction> {
        elizaLogger.info(
            `Deploying token: ${params.name} (${params.symbol}) with ${
                params.decimals || 18
            } decimals and initial supply of ${
                params.initialAmount || "1000000"
            }`
        );

        if (params.chain) {
            this.walletProvider.switchChain(params.chain);
        }

        try {
            const result = await this.walletProvider.deployERC20(
                params.name,
                params.symbol,
                params.decimals,
                params.initialAmount
            );

            return {
                hash: result.hash,
                from: this.walletProvider.getAddress(),
                to: result.address, // Contract address
                data: "0x", // Contract creation
                value: parseEther("0"), // No ETH value for deployment
            };
        } catch (error) {
            elizaLogger.error("Error deploying token:", error);
            throw new Error(
                `Token deployment failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        }
    }
}

const buildDeployTokenDetails = async (
    state: State,
    runtime: IAgentRuntime
): Promise<DeployTokenParams> => {
    const context = composeContext({
        state,
        template: deployTokenTemplate,
    });

    const deployDetails = (await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    })) as DeployTokenParams;

    // Validate required parameters
    if (!deployDetails.name || !deployDetails.symbol) {
        throw new Error("Token name and symbol are required");
    }

    // Validate decimals
    if (
        deployDetails.decimals !== undefined &&
        (deployDetails.decimals < 0 || deployDetails.decimals > 18)
    ) {
        throw new Error("Decimals must be between 0 and 18");
    }

    // Validate initial amount
    if (
        deployDetails.initialAmount !== undefined &&
        isNaN(Number(deployDetails.initialAmount))
    ) {
        throw new Error("Initial amount must be a valid number");
    }

    return deployDetails;
};

export const deployTokenAction: Action = {
    name: "deploy_token",
    description: "Deploy a new ERC20 token contract",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        elizaLogger.info("Deploy token action handler called");

        try {
            const walletProvider = initWalletProvider(runtime);
            const action = new DeployTokenAction(walletProvider);

            // Build deployment parameters
            const params = await buildDeployTokenDetails(state, runtime);

            // Deploy token
            const deployResult = await action.deployToken(params);

            if (callback) {
                callback({
                    text: `Successfully deployed token ${params.name} (${
                        params.symbol
                    })\nContract Address: ${
                        deployResult.to
                    }\nTransaction Hash: ${deployResult.hash}\nDecimals: ${
                        params.decimals || 18
                    }\nInitial Supply: ${params.initialAmount || "1000000"}`,
                    content: {
                        success: true,
                        contractAddress: deployResult.to,
                        hash: deployResult.hash,
                        name: params.name,
                        symbol: params.symbol,
                        decimals: params.decimals || 18,
                        initialSupply: params.initialAmount || "1000000",
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in deploy token action:", error);
            if (callback) {
                callback({
                    text: `Error deploying token: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`,
                    content: {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
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
                    text: "I'll help you deploy a new ERC20 token named 'My Token' with symbol 'MTK'",
                    action: "DEPLOY_TOKEN",
                },
            },
            {
                user: "user",
                content: {
                    text: "Deploy a new token called My Token with symbol MTK",
                    action: "DEPLOY_TOKEN",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Create a new USDT-like token with 6 decimals and 1M initial supply",
                    action: "DEPLOY_TOKEN",
                },
            },
        ],
    ],
    similes: [
        "create token",
        "deploy erc20",
        "create erc20",
        "launch token",
        "new token",
        "token deployment",
        "deploy contract",
        "create cryptocurrency",
        "mint token",
    ],
};
