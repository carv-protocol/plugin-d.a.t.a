import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { fetchTokenInfoAction } from "./actions/fetchTokenInfo";
import { ethereumDataProvider } from "./providers/ethereum/ethereumData";
import { tokenInfoProvider } from "./providers/token/tokenInfo";
import { twitterBalanceAction } from "./actions/carv/twitterBalance";
import { twitterBalanceProvider } from "./providers/carv/twitterBalance";

export const dataPlugin: Plugin = {
    name: "CARV D.A.T.A plugin",
    description: "Enables onchain data / offchain data fetching",
    actions: [fetchTransactionAction, fetchTokenInfoAction, twitterBalanceAction],
    providers: [ethereumDataProvider, tokenInfoProvider, twitterBalanceProvider],
    evaluators: [],
    services: [],
    clients: [],
};
