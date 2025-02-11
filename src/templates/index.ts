export const fetchTransactionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "startDate": "2024-01-01",
    "endDate": "2024-03-01",
    "minValue": "1.5",
    "maxValue": null,
    "limit": 10,
    "orderBy": "block_timestamp",
    "orderDirection": "DESC"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the transaction query:
- Wallet address to query (if any)
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)
- Minimum value in ETH (if any)
- Maximum value in ETH (if any)
- Number of transactions to return (default 10, max 100)
- Order by field (block_timestamp, value, or gas_price)
- Order direction (ASC or DESC)

Respond with a JSON markdown block containing only the extracted values.`;

export const fetchTokenInfoTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "symbol": "CARV",
    "platform": "ethereum"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the token query:
- Token symbol (required, remove $ prefix if present)
- Platform/chain to query (optional, e.g., ethereum, base, solana)

Notes for extraction:
- Token symbols like "$CARV" and "CARV" should both return "CARV" as the symbol
- Platform is case-insensitive, normalize to lowercase
- If no platform is specified, return null for platform
- Ignore any other information in the message

Respond with a JSON markdown block containing only the extracted values.`;

export const fetchTwitterBalanceTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "twitter_user_id": "gatsbyter",
    "chain_name": "arbitrum-one",
    "token_ticker": "carv"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the balance query:
- Twitter user ID (required, remove @ prefix if present)
- Chain name (required, normalize to lowercase, e.g., ethereum, arbitrum-one, base, opbnb)
- Token ticker (required, normalize to lowercase)

Notes for extraction:
- Twitter user IDs like "@gatsbyter" and "gatsbyter" should both return "gatsbyter"
- Chain names are case-insensitive, normalize to lowercase
- Token tickers like "$CARV" and "CARV" should both return "carv"
- All three parameters (twitter_user_id, chain_name, token_ticker) are required
- If any required parameter is missing, return null for all values

Example valid chain names:
- ethereum
- arbitrum-one
- base
- opbnb

Respond with a JSON markdown block containing only the extracted values.`;

export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on: Must be one of ["ethereum", "base", ...] (like in viem/chains)
- Amount to transfer: Must be a string representing the amount in ETH (only number without coin symbol, e.g., "0.1")
- Recipient address: Must be a valid Ethereum address starting with "0x"
- Token symbol or address (if not native token): Optional, leave as null for ETH transfers

Respond with a JSON markdown block containing only the extracted values. All fields except 'token' are required:

\`\`\`json
{
    "fromChain": SUPPORTED_CHAINS,
    "amount": string,
    "toAddress": string,
    "token": string | null
}
\`\`\`
`;

export const deployTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "name": "My Token",
    "symbol": "MTK",
    "decimals": 18,
    "initialAmount": "1000000",
    "chain": "ethereum"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the token deployment:
- Token name (required): Full name of the token (e.g., "My Token", "USD Tether")
- Token symbol (required): Short symbol for the token (e.g., "MTK", "USDT")
- Decimals (optional): Number of decimal places (default: 18, range: 0-18)
- Initial amount (optional): Initial token supply as string (default: "1000000")
- Chain (optional): Blockchain network to deploy on (e.g., "ethereum", "base")

Notes for extraction:
- Token name should be a descriptive string
- Token symbol should be 2-6 characters, uppercase
- Decimals must be a number between 0 and 18
- Initial amount should be a string representing the number of tokens
- Chain name should be normalized to lowercase
- Use default values for optional parameters if not specified

Respond with a JSON markdown block containing only the extracted values.`;

export const airdropTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response (single amount):
\`\`\`json
{
    "tokenAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "recipients": [
        "0x1234567890123456789012345678901234567890",
        "0x2345678901234567890123456789012345678901"
    ],
    "amount": "100",
    "amounts": null
}
\`\`\`

Example response (multiple amounts):
\`\`\`json
{
    "tokenAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "recipients": [
        "0x1234567890123456789012345678901234567890",
        "0x2345678901234567890123456789012345678901"
    ],
    "amount": null,
    "amounts": [
        "100",
        "200"
    ]
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the token airdrop:
- Token address (required): The ERC20 token contract address to airdrop
- Recipients (required): Array of Ethereum addresses to receive tokens
- Amount (optional): Single amount to send to all recipients
- Amounts (optional): Array of amounts corresponding to each recipient

Notes for extraction:
- Token address must be a valid Ethereum address starting with "0x"
- Recipients must be an array of valid Ethereum addresses
- Either amount OR amounts must be provided, not both
- If amount is provided, it will be used for all recipients
- If amounts is provided, its length must match recipients length
- All amounts should be strings representing token amounts
- Recipients array must not be empty
- All addresses must be checksummed

Respond with a JSON markdown block containing only the extracted values.`;
