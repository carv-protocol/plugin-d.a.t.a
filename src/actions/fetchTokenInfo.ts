import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {
    TokenInfoProvider,
    createTokenInfoProvider,
} from "../providers/token/tokenInfo";

// Query parameter interface
interface FetchTokenInfoParams {
    ticker: string; // Token ticker (e.g., "CARV")
    platform?: string; // Specific platform to query (optional)
}

// Response interface with metadata
interface TokenInfoQueryResult {
    success: boolean;
    data: {
        ticker: string;
        symbol: string;
        name: string;
        platform: string;
        categories: string[];
        contract_infos: Array<{
            platform: string;
            address: string;
        }>;
        price: number;
    };
    metadata: {
        queryTime: string;
        executionTime: number;
        queryType: "token";
        cached: boolean;
        queryDetails?: {
            params: FetchTokenInfoParams;
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class FetchTokenInfoAction {
    constructor(private provider: TokenInfoProvider) {}

    /**
     * Validate query parameters
     */
    private validateParams(params: FetchTokenInfoParams): string[] {
        const validationMessages: string[] = [];

        if (!params.ticker) {
            validationMessages.push("Token ticker is required");
        }

        // Remove any $ prefix from ticker
        if (params.ticker?.startsWith("$")) {
            params.ticker = params.ticker.substring(1);
        }

        // Additional validations as needed
        if (params.platform && typeof params.platform !== "string") {
            validationMessages.push("Platform must be a string if provided");
        }

        return validationMessages;
    }

    /**
     * Format categories into readable text
     */
    private formatCategories(categories: string[]): string {
        if (!categories.length) {
            return "No categories available";
        }
        return categories.join(", ");
    }

    /**
     * Format contract addresses into readable text
     */
    private formatContractAddresses(
        contractInfos: Array<{ platform: string; address: string }>
    ): string {
        if (!contractInfos.length) {
            return "No contract addresses available";
        }

        return contractInfos
            .map(
                (info) =>
                    `- ${info.platform.charAt(0).toUpperCase() + info.platform.slice(1)}: ${info.address}`
            )
            .join("\n");
    }

    /**
     * Format price information with fallback message
     */
    private formatPriceInfo(price: number): string {
        if (!price) {
            return "Price information is currently unavailable. Please try again later.";
        }
        return `$${price.toFixed(6)}`;
    }

    /**
     * Process token info into natural language response
     */
    public processTokenInfo(info: TokenInfoQueryResult["data"]): string {
        const priceInfo = this.formatPriceInfo(info.price);
        const categoriesInfo = this.formatCategories(info.categories);
        const contractsInfo = this.formatContractAddresses(info.contract_infos);

        return `
Token Information for ${info.name} (${info.symbol}):

Price: ${priceInfo}

Categories/Use Cases:
${categoriesInfo}

Deployed Contracts:
${contractsInfo}

This token is available on ${info.contract_infos.length} platform${
            info.contract_infos.length !== 1 ? "s" : ""
        }.
`;
    }

    /**
     * Fetch token information
     */
    public async fetchTokenInfo(
        message: Memory,
        runtime: IAgentRuntime,
        state: State
    ): Promise<{
        type: "analysis" | "token";
        result: string | TokenInfoQueryResult;
    } | null> {
        let tokenResult: TokenInfoQueryResult;
        let analysisResult: string | null;

        try {
            const ret = await this.provider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );

            if (!ret || !ret.queryResult) {
                throw new Error("Failed to fetch token information");
            }

            tokenResult = ret.queryResult as unknown as TokenInfoQueryResult;

            // If analysis fails or is disabled, return token result
            if (!analysisResult) {
                return {
                    type: "token",
                    result: tokenResult,
                };
            }

            // If analysis succeeds, return analysis result
            return {
                type: "analysis",
                result: analysisResult,
            };
        } catch (error) {
            elizaLogger.error("Error fetching token info:", error);
            return null;
        }
    }
}

export const fetchTokenInfoAction: Action = {
    name: "FETCH_TOKEN_INFO",
    description:
        "Fetch and analyze token information including deployment, categories, and price",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = createTokenInfoProvider(runtime);
            const action = new FetchTokenInfoAction(provider);

            const result = await action.fetchTokenInfo(message, runtime, state);

            if (callback) {
                if (result) {
                    if (result.type === "analysis") {
                        callback({
                            text: result.result as string,
                        });
                    } else {
                        const tokenResult =
                            result.result as TokenInfoQueryResult;
                        if (tokenResult.success) {
                            const analysisText = action.processTokenInfo(
                                tokenResult.data
                            );
                            callback({
                                text: analysisText,
                                content: {
                                    success: true,
                                    data: tokenResult.data,
                                    metadata: tokenResult.metadata,
                                },
                            });
                        } else {
                            callback({
                                text: `Error fetching token info: ${tokenResult.error?.message}`,
                                content: { error: tokenResult.error },
                            });
                        }
                    }
                } else {
                    callback({
                        text: "Failed to fetch token information. Please try again.",
                    });
                }
            }

            return (
                result?.type === "analysis" ||
                (result?.type === "token" &&
                    (result.result as TokenInfoQueryResult).success)
            );
        } catch (error) {
            elizaLogger.error("Error in fetch token info action:", error);
            if (callback) {
                callback({
                    text: `Error analyzing token: ${error.message}`,
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
                    text: "Can you tell me about the CARV token?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll help you analyze the CARV token",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What's the current price of CARV?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Let me check the current price and details for CARV",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Which chains is CARV deployed on?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll look up the deployment information for CARV across different blockchains",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What category is CARV in?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll check the categories and use cases for CARV",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
    ],
    similes: [
        "GET_TOKEN_INFO",
        "TOKEN_ANALYSIS",
        "CHECK_TOKEN",
        "TOKEN_DETAILS",
        "TOKEN_PRICE",
        "TOKEN_PLATFORMS",
        "TOKEN_CATEGORIES",
        "ANALYZE_TOKEN",
        "TOKEN_CHECK",
        "TOKEN_LOOKUP",
        "SHOW_TOKEN",
        "FIND_TOKEN",
        "TOKEN_SEARCH",
        "TOKEN_STATUS",
        "TOKEN_REPORT",
    ],
};

export default fetchTokenInfoAction;
