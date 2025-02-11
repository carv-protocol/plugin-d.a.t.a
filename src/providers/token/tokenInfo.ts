import {
    IAgentRuntime,
    elizaLogger,
    Memory,
    State,
    generateMessageResponse,
    ModelClass,
    stringToUuid,
    getEmbeddingZeroVector,
    Provider,
} from "@elizaos/core";

// Contract info interface
interface ContractInfo {
    platform: string;
    address: string;
}

// Token info interface matching API response structure
interface TokenInfo {
    ticker: string;
    symbol: string;
    name: string;
    platform: string;
    categories: string[];
    contract_infos: ContractInfo[];
    price: number;
}

// API response interface
interface TokenInfoApiResponse {
    code: number;
    msg: string;
    data: TokenInfo;
}

// Analysis result interface
interface IAnalysisResult {
    context: string;
    queryResult: TokenQueryResult;
}

// Query result interface
interface TokenQueryResult {
    success: boolean;
    data: TokenInfo;
    metadata: {
        queryTime: string;
        queryType: "token";
        executionTime: number;
        cached: boolean;
        queryDetails?: {
            params: {
                ticker: string;
                platform?: string;
            };
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class TokenInfoProvider {
    private readonly API_URL: string;
    private readonly AUTH_TOKEN: string;
    private readonly DATA_PROVIDER_ANALYSIS: boolean;

    constructor(runtime: IAgentRuntime) {
        // Get API configuration from runtime settings
        this.API_URL = runtime.getSetting("DATA_API_KEY");
        this.AUTH_TOKEN = runtime.getSetting("DATA_AUTH_TOKEN");
        this.DATA_PROVIDER_ANALYSIS =
            runtime.getSetting("DATA_PROVIDER_ANALYSIS") === "true";
    }

    public getProviderAnalysis(): boolean {
        return this.DATA_PROVIDER_ANALYSIS;
    }

    private fetchTokenInfoTemplate(): string {
        return `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "ticker": "AAVE",
    "platform": "ethereum"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the token query:
- Token ticker (required)
  - Common formats: "AAVE", "$AAVE", "aave", "Aave"
  - Popular tokens: ETH, USDC, USDT, BTC, AAVE, UNI, etc.
  - Remove any $ prefix if present
  - Normalize to uppercase
- Platform/chain to query (optional)
  - Common platforms: ethereum, arbitrum-one, base, opbnb, solana
  - Default to ethereum if not specified
  - Normalize to lowercase

Notes for extraction:
1. Token ticker examples:
   - "$ETH" or "ETH" -> "ETH"
   - "Aave" or "AAVE" -> "AAVE"
   - "usdc" or "USDC" -> "USDC"

2. Platform examples:
   - "Ethereum" or "ETH" -> "ethereum"
   - "Base" -> "base"
   - "Arbitrum" -> "arbitrum-one"
   - "Solana" or "SOL" -> "solana"

3. Context understanding:
   - Look for token names in various formats
   - Consider common token symbols and names
   - Handle both formal and informal token references
   - Extract platform from context if mentioned

4. Special cases:
   - For native tokens like "ETH" on Ethereum, "SOL" on Solana
   - For stablecoins like USDC, USDT that exist on multiple chains
   - For wrapped tokens like WETH, WBTC

Respond with a JSON markdown block containing only the extracted values.`;
    }

    private getTokenInfoTemplate(): string {
        return `
Please analyze the provided token information and generate a comprehensive report. Focus on:

1. Token Overview
- Basic token information (name, symbol, ticker)
- Current price and market status
- Platform availability and deployment

2. Category Analysis
- Primary use cases and sectors
- Ecosystem involvement
- Market positioning

3. Platform Coverage
- Number of supported platforms
- Platform-specific details
- Cross-chain availability

4. Technical Analysis
- Contract deployment status
- Platform-specific characteristics
- Integration capabilities

Please provide a natural language analysis that:
- Uses professional blockchain terminology
- Highlights key features and capabilities
- Provides specific platform details
- Draws meaningful conclusions about token utility
- Includes relevant market context
- Notes any unique characteristics

Token Data:
{{tokenData}}

Query Metadata:
{{queryMetadata}}
`;
    }

    private getAnalysisInstruction(): string {
        return `
            1. Token Overview:
                - Analyze the basic token information
                - Evaluate price and market status
                - Assess platform coverage

            2. Category Analysis:
                - Examine token categories and use cases
                - Analyze ecosystem involvement
                - Evaluate market positioning

            3. Platform Coverage:
                - Analyze deployment across platforms
                - Evaluate cross-chain capabilities
                - Assess platform-specific features

            4. Technical Assessment:
                - Evaluate contract deployments
                - Analyze platform integration
                - Consider technical capabilities

            Please provide a comprehensive analysis of the token based on this information.
            Focus on significant features, capabilities, and insights that would be valuable for understanding the token.
            Use technical blockchain terminology and provide specific examples to support your analysis.
        `;
    }

    /**
     * Query token information by ticker
     * @param ticker The token ticker to query
     * @returns Promise<TokenInfo>
     */
    public async queryTokenInfo(ticker: string): Promise<TokenInfo> {
        try {
            elizaLogger.log(`Querying token info for ticker: ${ticker}`);
            const startTime = Date.now();

            // Build request URL
            const url = `${this.API_URL}/token_info?ticker=${encodeURIComponent(ticker.toLowerCase())}`;

            // Make API request
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: this.AUTH_TOKEN ? `${this.AUTH_TOKEN}` : "",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const result = (await response.json()) as TokenInfoApiResponse;

            // Validate response
            if (result.code !== 0) {
                throw new Error(`API error: ${result.msg}`);
            }

            if (!result.data) {
                throw new Error("No token data returned from API");
            }

            elizaLogger.log(`Successfully retrieved token info for ${ticker}`);
            return result.data;
        } catch (error) {
            elizaLogger.error(
                `Error querying token info for ${ticker}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Validate token info response
     * @param info TokenInfo object to validate
     * @returns boolean
     */
    public validateTokenInfo(info: TokenInfo): boolean {
        return !!(
            info.ticker &&
            info.symbol &&
            info.name &&
            info.platform &&
            Array.isArray(info.categories) &&
            Array.isArray(info.contract_infos) &&
            typeof info.price === "number"
        );
    }

    /**
     * Get supported platforms from a token's contract infos
     * @param info TokenInfo object
     * @returns string[] Array of supported platforms
     */
    public getSupportedPlatforms(info: TokenInfo): string[] {
        return info.contract_infos.map((contract) => contract.platform);
    }

    /**
     * Get contract address for a specific platform
     * @param info TokenInfo object
     * @param platform Platform to get address for
     * @returns string | undefined Contract address if found
     */
    public getContractAddress(
        info: TokenInfo,
        platform: string
    ): string | undefined {
        const contract = info.contract_infos.find(
            (c) => c.platform === platform
        );
        return contract?.address;
    }

    public async analyzeQuery(
        queryResult: TokenQueryResult,
        message: Memory,
        runtime: IAgentRuntime,
        state: State
    ): Promise<string> {
        try {
            if (!queryResult?.data) {
                elizaLogger.warn("Invalid query result for analysis");
                return null;
            }

            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const template = this.getTokenInfoTemplate();
            const context = template
                .replace(
                    "{{tokenData}}",
                    JSON.stringify(queryResult.data, null, 2)
                )
                .replace(
                    "{{queryMetadata}}",
                    JSON.stringify(queryResult.metadata, null, 2)
                );

            const analysisResponse = await generateMessageResponse({
                runtime,
                context: context,
                modelClass: ModelClass.LARGE,
            });

            return typeof analysisResponse === "string"
                ? analysisResponse
                : analysisResponse.text || null;
        } catch (error) {
            elizaLogger.error("Error in analyzeQuery:", error);
            return null;
        }
    }

    public async processD_A_T_AQuery(
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<IAnalysisResult | null> {
        try {
            const template = this.fetchTokenInfoTemplate();

            // Replace the template placeholder with actual message content
            const buildContext = template.replace(
                "{{recentMessages}}",
                `User's message: ${message.content.text}`
            );

            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            elizaLogger.log(
                "Generating token info query from message:",
                message.content.text
            );
            const preResponse = await generateMessageResponse({
                runtime: runtime,
                context: buildContext,
                modelClass: ModelClass.LARGE,
            });

            const userMessage = {
                agentId: runtime.agentId,
                roomId: message.roomId,
                userId: message.userId,
                content: message.content,
            };

            // Save response to memory
            const preResponseMessage: Memory = {
                id: stringToUuid(message.id + "-" + runtime.agentId),
                ...userMessage,
                userId: runtime.agentId,
                content: preResponse,
                embedding: getEmbeddingZeroVector(),
                createdAt: Date.now(),
            };

            await runtime.messageManager.createMemory(preResponseMessage);
            await runtime.updateRecentMessageState(state);

            let params: { ticker: string; platform?: string } = {
                ticker: null,
                platform: null,
            };

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

            elizaLogger.log("preResponse", preResponse);
            elizaLogger.log("responseText:", responseText);

            if (!params.ticker) {
                elizaLogger.error("No ticker found in response");
                return null;
            }

            const startTime = Date.now();
            elizaLogger.log(
                "%%%% D.A.T.A. Querying token info for ticker:",
                params.ticker
            );

            try {
                const tokenInfo = await this.queryTokenInfo(params.ticker);

                const queryResult: TokenQueryResult = {
                    success: true,
                    data: tokenInfo,
                    metadata: {
                        queryTime: new Date().toISOString(),
                        queryType: "token",
                        executionTime: Date.now() - startTime,
                        cached: false,
                        queryDetails: {
                            params: {
                                ticker: params.ticker,
                                platform: params.platform,
                            },
                        },
                    },
                };

                elizaLogger.log(
                    "%%%% D.A.T.A. queryResult:",
                    JSON.stringify(queryResult, null, 2)
                );

                const analysisInstruction = this.getAnalysisInstruction();
                const context = `
                    # query by user
                    ${message.content.text}

                    # query result
                    ${JSON.stringify(queryResult, null, 2)}

                    # Analysis Instructions
                    ${analysisInstruction}
                `;

                return {
                    context: context,
                    queryResult: queryResult,
                };
            } catch (error) {
                elizaLogger.error("Error querying token info:", {
                    error: error.message,
                    stack: error.stack,
                    ticker: params.ticker,
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

export const createTokenInfoProvider = (runtime: IAgentRuntime) => {
    return new TokenInfoProvider(runtime);
};

export const tokenInfoProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> => {
        try {
            const provider = createTokenInfoProvider(runtime);
            if (!provider.getProviderAnalysis()) {
                return null;
            }
            const result = await provider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );
            return result ? result.context : null;
        } catch (error) {
            elizaLogger.error("Error in tokenInfoProvider:", error);
            return null;
        }
    },
};
