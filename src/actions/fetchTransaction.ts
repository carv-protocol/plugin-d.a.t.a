import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {
    DatabaseProvider,
    databaseProvider,
} from "../providers/ethereum/ethereumData";

// Query parameter interface with stricter types
interface FetchTransactionParams {
    address?: string;
    startDate?: string;
    endDate?: string;
    minValue?: string;
    maxValue?: string;
    limit?: number;
    orderBy?: "block_timestamp" | "value" | "gas_price";
    orderDirection?: "ASC" | "DESC";
}

// Response interface with enhanced metadata
interface TransactionQueryResult {
    success: boolean;
    data: any[];
    metadata: {
        total: number;
        queryTime: string;
        queryType: "transaction" | "token" | "aggregate" | "unknown";
        executionTime: number;
        cached: boolean;
        queryDetails?: {
            params: FetchTransactionParams;
            query: string;
            paramValidation?: string[];
        };
        blockStats?: {
            blockRange: {
                startBlock: string;
                endBlock: string;
                blockCount: number;
            };
            timeRange: {
                startTime: string;
                endTime: string;
                timeSpanSeconds: number;
            };
            uniqueBlocks: number;
            averageTransactionsPerBlock: number;
        };
        transactionStats?: {
            uniqueFromAddresses: number;
            uniqueToAddresses: number;
            txTypeDistribution: Record<string, number>;
            gasStats: {
                totalGasUsed: number;
                averageGasUsed: number;
                minGasUsed: number;
                maxGasUsed: number;
                averageGasPrice: number;
                totalGasCost: string; // in ETH
            };
            valueStats: {
                totalValue: string; // in ETH
                averageValue: string; // in ETH
                minValue: string; // in ETH
                maxValue: string; // in ETH
                zeroValueCount: number;
            };
            contractStats: {
                contractTransactions: number;
                normalTransactions: number;
                contractInteractions: {
                    uniqueContracts: number;
                    topContracts: Array<{
                        address: string;
                        count: number;
                    }>;
                };
            };
            addressStats: {
                topSenders: Array<{
                    address: string;
                    count: number;
                    totalValue: string; // in ETH
                }>;
                topReceivers: Array<{
                    address: string;
                    count: number;
                    totalValue: string; // in ETH
                }>;
            };
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class FetchTransactionAction {
    constructor(private dbProvider: DatabaseProvider) {}

    public async fetchTransactions(
        message: Memory,
        runtime: IAgentRuntime,
        state: State
    ): Promise<{
        type: "analysis" | "transaction";
        result: string | TransactionQueryResult;
    } | null> {
        let transactionResult: any;
        let analysisResult: any;
        try {
            const ret = await this.dbProvider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );

            if (!ret || !ret.queryResult) {
                throw new Error("Failed to fetch transactions");
            }

            transactionResult = ret.queryResult as TransactionQueryResult;

            // Try to get analysis
            analysisResult = await this.dbProvider.analyzeQuery(
                transactionResult,
                message,
                runtime,
                state
            );

            // If analysis fails, return transaction result
            if (!analysisResult) {
                return {
                    type: "transaction",
                    result: transactionResult,
                };
            }

            // If analysis succeeds, return analysis result
            return {
                type: "analysis",
                result: analysisResult,
            };
        } catch (error) {
            elizaLogger.error("Error fetching transactions:", error);
            return null;
        }
    }
}

export const fetchTransactionAction: Action = {
    name: "fetch_transactions",
    description:
        "Fetch and analyze Ethereum transactions with comprehensive statistics",
    similes: [
        "get transactions",
        "show transfers",
        "display eth transactions",
        "find transactions",
        "search transfers",
        "check transactions",
        "view transfers",
        "list transactions",
        "recent transactions",
        "transaction history",
        "today's transactions",
        "yesterday's transfers",
        "last week's transactions",
        "monthly transaction history",
        "transactions from last month",
        "address transactions",
        "wallet transfers",
        "account activity",
        "address history",
        "wallet history",
        "large transactions",
        "high value transfers",
        "transactions above",
        "transfers worth more than",
        "big eth movements",
        "contract interactions",
        "smart contract calls",
        "contract transactions",
        "dapp interactions",
        "protocol transactions",
        "recent large transfers",
        "recent large transfers",
        "high value contract calls",
        "address contract interactions",
        "wallet activity last week",
        "today's big transactions",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the latest 10 Ethereum transactions",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Get transactions for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Analyze gas fees trend in the last 24 hours and compare with last week's average",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find whale addresses with transactions over 100 ETH in the past 24 hours",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me USDT transactions with value over 100,000 USD in the last hour",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Analyze cross-chain bridge transactions in the last 24 hours",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Compare gas fees between peak hours and off-peak hours today",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me the most active DEX contracts by transaction volume today",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find all transactions involving Uniswap V3 pools in the last hour",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Analyze stablecoin transfer patterns between major exchanges",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me the top 10 NFT marketplace transactions by value today",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find large token transfers (>$1M) between unknown addresses",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Analyze MEV bot activities in the latest 1000 blocks",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me failed transactions with high gas fees in the last hour",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find arbitrage transactions between major DEX platforms",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime) => {
        const apiKey = runtime.getSetting("DATA_API_KEY");
        return !!apiKey;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = databaseProvider(runtime);
            const action = new FetchTransactionAction(provider);

            const result = await action.fetchTransactions(
                message,
                runtime,
                state
            );

            if (callback) {
                if (result) {
                    if (result.type === "analysis") {
                        callback({
                            text: result.result as string,
                        });
                    } else {
                        callback({
                            text: JSON.stringify(result.result, null, 2),
                        });
                    }
                } else {
                    callback({
                        text: "Query failed, please try again",
                    });
                }
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error in fetch transaction action:", error);
            if (callback) {
                callback({
                    text: `Error fetching transactions: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
};

export default fetchTransactionAction;
