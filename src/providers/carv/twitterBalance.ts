import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    generateMessageResponse,
    ModelClass,
} from "@elizaos/core";
import { fetchTwitterBalanceTemplate } from "../../templates";

// API request parameters interface
export interface TwitterBalanceParams {
    twitter_user_id: string;
    chain_name: string;
    token_ticker: string;
}

// API response interface
export interface TwitterBalanceResponse {
    code: number;
    msg: string;
    data?: {
        balance: string;
    };
    detail?: string;
}

// Query result interface
export interface TwitterBalanceQueryResult {
    success: boolean;
    data?: {
        balance: string;
    };
    metadata: {
        queryTime: string;
        queryType: "twitter_balance";
        executionTime: number;
        cached: boolean;
        queryDetails?: {
            params: TwitterBalanceParams;
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

// Analysis result interface
export interface IAnalysisResult {
    context: string;
    queryResult: TwitterBalanceQueryResult;
}

export class TwitterBalanceProvider {
    private readonly API_URL: string;
    private readonly AUTH_TOKEN: string;

    constructor(runtime: IAgentRuntime) {
        this.API_URL = runtime.getSetting("DATA_API_URL");
        this.AUTH_TOKEN = runtime.getSetting("DATA_AUTH_TOKEN");
    }

    /**
     * Query balance information by parameters
     * @param params TwitterBalanceParams object
     * @returns Promise<TwitterBalanceResponse>
     */
    private async queryBalance(
        params: TwitterBalanceParams
    ): Promise<TwitterBalanceResponse> {
        try {
            elizaLogger.log(
                `Querying balance for user: ${params.twitter_user_id}`
            );
            const startTime = Date.now();

            const url = `${this.API_URL}/user_balance?twitter_user_id=${params.twitter_user_id}&chain_name=${params.chain_name}&token_ticker=${params.token_ticker}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.AUTH_TOKEN ? `${this.AUTH_TOKEN}` : "",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const result = (await response.json()) as TwitterBalanceResponse;

            if (result.code !== 0) {
                throw new Error(`API error: ${result.msg}`);
            }

            elizaLogger.log(
                `Successfully retrieved balance for ${params.twitter_user_id}`
            );
            return result;
        } catch (error) {
            elizaLogger.error(`Error querying balance:`, error);
            throw error;
        }
    }

    /**
     * Process D.A.T.A query
     */
    public async processD_A_T_AQuery(
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<IAnalysisResult | null> {
        try {
            const template = fetchTwitterBalanceTemplate;
            const buildContext = template.replace(
                "{{recentMessages}}",
                `User's message: ${message.content.text}`
            );

            if (!state) {
                state = await runtime.composeState(message);
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            elizaLogger.log(
                "Generating twitter balance query from message:",
                message.content.text
            );

            const preResponse = await generateMessageResponse({
                runtime,
                context: buildContext,
                modelClass: ModelClass.LARGE,
            });

            let params: TwitterBalanceParams = null;
            let responseText = preResponse as any;

            if (typeof preResponse === "string") {
                try {
                    responseText = JSON.parse(preResponse);
                } catch (e) {
                    elizaLogger.error(
                        "Failed to parse preResponse as JSON:",
                        e
                    );
                    return null;
                }
            }

            params = responseText;

            if (
                !params?.twitter_user_id ||
                !params?.chain_name ||
                !params?.token_ticker
            ) {
                elizaLogger.error("Missing required parameters in response");
                return null;
            }

            const startTime = Date.now();
            elizaLogger.log(
                "Querying balance for user:",
                params.twitter_user_id
            );

            try {
                elizaLogger.log(`%%%% D.A.T.A. queryBalance: ${params}`);
                const balanceInfo = await this.queryBalance(params);
                elizaLogger.log(
                    `%%%% D.A.T.A. balanceInfo: ${JSON.stringify(balanceInfo, null, 2)}`
                );

                elizaLogger.log("Balance info:", balanceInfo);

                const queryResult: TwitterBalanceQueryResult = {
                    success: true,
                    data: balanceInfo.data,
                    metadata: {
                        queryTime: new Date().toISOString(),
                        queryType: "twitter_balance",
                        executionTime: Date.now() - startTime,
                        cached: false,
                        queryDetails: {
                            params: {
                                twitter_user_id: params.twitter_user_id,
                                chain_name: params.chain_name,
                                token_ticker: params.token_ticker,
                            },
                        },
                    },
                };

                const context = `
                    # Query by user
                    ${message.content.text}

                    # Query result
                    ${JSON.stringify(queryResult, null, 2)}
                `;

                return {
                    context,
                    queryResult,
                };
            } catch (error) {
                elizaLogger.error("Error querying balance:", {
                    error: error.message,
                    stack: error.stack,
                    params,
                });
                return null;
            }
        } catch (error) {
            elizaLogger.error("Error in processD_A_T_AQuery:", {
                error: error.message,
                stack: error.stack,
            });
            return null;
        }
    }
}

export const createTwitterBalanceProvider = (runtime: IAgentRuntime) => {
    return new TwitterBalanceProvider(runtime);
};

export const twitterBalanceProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> => {
        try {
            const provider = createTwitterBalanceProvider(runtime);
            const result = await provider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );
            return result ? result.context : null;
        } catch (error) {
            elizaLogger.error("Error in twitterBalanceProvider:", error);
            return null;
        }
    },
};
