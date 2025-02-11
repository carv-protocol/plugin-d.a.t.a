import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {
    TwitterBalanceProvider,
    TwitterBalanceParams,
    TwitterBalanceQueryResult,
    createTwitterBalanceProvider,
} from "../../providers/carv/twitterBalance";

export class TwitterBalanceAction {
    constructor(private provider: TwitterBalanceProvider) {}

    /**
     * Validate query parameters
     */
    private validateParams(params: TwitterBalanceParams): string[] {
        const validationMessages: string[] = [];

        if (!params.twitter_user_id) {
            validationMessages.push("Twitter handle is required");
        }

        if (!params.chain_name) {
            validationMessages.push("Chain name is required");
        } else {
            params.chain_name = params.chain_name.toLowerCase();
        }

        if (!params.token_ticker) {
            validationMessages.push("Token ticker is required");
        } else {
            params.token_ticker = params.token_ticker.toUpperCase();
        }

        return validationMessages;
    }

    /**
     * Format response for display
     */
    private formatResponse(result: TwitterBalanceQueryResult): string {
        if (result.success && result.data) {
            const params = result.metadata.queryDetails.params;
            return `🔍 Balance Information:
• Twitter User: @${params.twitter_user_id}
• Chain: ${params.chain_name}
• Token: ${params.token_ticker}
• Balance: ${result.data.balance} ${params.token_ticker}`;
        } else {
            const errorMsg = result.error?.message || "Unknown error occurred";
            switch (errorMsg) {
                case "received rsp err twitter handle not found":
                    return "❌ Error: Twitter handle not found. Please check if the Twitter handle is correct.";
                case "no token found in this chain":
                    return "❌ Error: Token not found on this chain. Please verify the token ticker and chain name.";
                case "unsupported chain name":
                    return "❌ Error: Unsupported blockchain. Please check the chain name.";
                default:
                    return `❌ Error: ${errorMsg}`;
            }
        }
    }

    /**
     * Get Twitter user's token balance
     */
    public async getTwitterBalance(
        message: Memory,
        runtime: IAgentRuntime,
        state: State
    ): Promise<{
        success: boolean;
        response: string;
        data?: TwitterBalanceQueryResult;
    }> {
        try {
            const result = await this.provider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );

            if (!result) {
                return {
                    success: false,
                    response:
                        "❌ Error: Failed to process query. Please make sure to provide Twitter handle, chain name, and token ticker.",
                };
            }

            const { queryResult } = result;
            return {
                success: queryResult.success,
                response: this.formatResponse(queryResult),
                data: queryResult,
            };
        } catch (error) {
            elizaLogger.error("Error in getTwitterBalance:", error);
            return {
                success: false,
                response: `❌ Error: ${error.message}`,
            };
        }
    }
}

export const twitterBalanceAction: Action = {
    name: "TWITTER_BALANCE",
    description: "Check token balance of a Twitter user on specific blockchain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = createTwitterBalanceProvider(runtime);
            const action = new TwitterBalanceAction(provider);
            const result = await action.getTwitterBalance(
                message,
                runtime,
                state
            );

            if (callback) {
                callback({
                    text: result.response,
                    content: {
                        success: result.success,
                        data: result.data,
                    },
                });
            }

            return result.success;
        } catch (error) {
            elizaLogger.error("Error in twitter balance action:", error);
            if (callback) {
                callback({
                    text: `Error checking balance: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        const apiKey = runtime.getSetting("DATA_API_KEY");
        return !!apiKey;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Check CARV balance for Twitter user @gatsbyter on Arbitrum",
                    action: "TWITTER_BALANCE",
                    twitter_user_id: "gatsbyter",
                    chain_name: "arbitrum-one",
                    token_ticker: "carv",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me how many AAVE tokens @vitalik has on Ethereum",
                    action: "TWITTER_BALANCE",
                    twitter_user_id: "vitalik",
                    chain_name: "ethereum",
                    token_ticker: "aave",
                },
            },
        ],
    ],
    similes: [
        "check balance",
        "get token balance",
        "show token amount",
        "view balance",
        "check token holdings",
        "show wallet balance",
        "display token balance",
        "get holdings",
        "check account balance",
        "view token amount",
        "show crypto balance",
        "check token value",
        "get wallet holdings",
        "display account balance",
        "view holdings",
    ],
};
