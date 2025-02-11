const ERC20_ABI = [
    {
        inputs: [
            {
                internalType: "string",
                name: "_name",
                type: "string",
            },
            {
                internalType: "string",
                name: "_symbol",
                type: "string",
            },
            {
                internalType: "uint8",
                name: "_decimals",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "_initAmt",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "allowance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientAllowance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientBalance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "approver",
                type: "address",
            },
        ],
        name: "ERC20InvalidApprover",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
        ],
        name: "ERC20InvalidReceiver",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSender",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSpender",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        inputs: [],
        name: "DECIMALS",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "_to",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "_amounts",
                type: "uint256[]",
            },
        ],
        name: "batchTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transferFrom",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;

const ERC20_BYTECODE =
    "0x60a06040523480156200001157600080fd5b50604051620010cf380380620010cf8339810160408190526200003491620002b0565b83836003620000448382620003cc565b506004620000538282620003cc565b50505060ff821660805262000069338262000073565b50505050620004c0565b6001600160a01b038216620000a35760405163ec442f0560e01b8152600060048201526024015b60405180910390fd5b620000b160008383620000b5565b5050565b6001600160a01b038316620000e4578060026000828254620000d8919062000498565b90915550620001589050565b6001600160a01b03831660009081526020819052604090205481811015620001395760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016200009a565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216620001765760028054829003905562000195565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620001db91815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200021057600080fd5b81516001600160401b03808211156200022d576200022d620001e8565b604051601f8301601f19908116603f01168101908282118183101715620002585762000258620001e8565b81604052838152602092508660208588010111156200027657600080fd5b600091505b838210156200029a57858201830151818301840152908201906200027b565b6000602085830101528094505050505092915050565b60008060008060808587031215620002c757600080fd5b84516001600160401b0380821115620002df57600080fd5b620002ed88838901620001fe565b955060208701519150808211156200030457600080fd5b506200031387828801620001fe565b935050604085015160ff811681146200032b57600080fd5b6060959095015193969295505050565b600181811c908216806200035057607f821691505b6020821081036200037157634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620003c7576000816000526020600020601f850160051c81016020861015620003a25750805b601f850160051c820191505b81811015620003c357828155600101620003ae565b5050505b505050565b81516001600160401b03811115620003e857620003e8620001e8565b6200040081620003f984546200033b565b8462000377565b602080601f8311600181146200043857600084156200041f5750858301515b600019600386901b1c1916600185901b178555620003c3565b600085815260208120601f198616915b82811015620004695788860151825594840194600190910190840162000448565b5085821015620004885787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b80820180821115620004ba57634e487b7160e01b600052601160045260246000fd5b92915050565b608051610bec620004e360003960008181610139015261016f0152610bec6000f3fe608060405234801561001057600080fd5b50600436106100c95760003560e01c8063313ce5671161008157806395d89b411161005b57806395d89b41146101de578063a9059cbb146101e6578063dd62ed3e146101f957600080fd5b8063313ce5671461016d57806370a082311461019357806388d695b2146101c957600080fd5b806318160ddd116100b257806318160ddd1461010f57806323b872dd146101215780632e0f26251461013457600080fd5b806306fdde03146100ce578063095ea7b3146100ec575b600080fd5b6100d661023f565b6040516100e39190610801565b60405180910390f35b6100ff6100fa366004610897565b6102d1565b60405190151581526020016100e3565b6002545b6040519081526020016100e3565b6100ff61012f3660046108c1565b6102eb565b61015b7f000000000000000000000000000000000000000000000000000000000000000081565b60405160ff90911681526020016100e3565b7f000000000000000000000000000000000000000000000000000000000000000061015b565b6101136101a13660046108fd565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6101dc6101d7366004610a30565b61030f565b005b6100d6610365565b6100ff6101f4366004610897565b610374565b610113610207366004610af0565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b60606003805461024e90610b23565b80601f016020809104026020016040519081016040528092919081815260200182805461027a90610b23565b80156102c75780601f1061029c576101008083540402835291602001916102c7565b820191906000526020600020905b8154815290600101906020018083116102aa57829003601f168201915b5050505050905090565b6000336102df818585610382565b60019150505b92915050565b6000336102f985828561038f565b610304858585610463565b506001949350505050565b60005b8251811015610360576103583384838151811061033157610331610b76565b602002602001015184848151811061034b5761034b610b76565b6020026020010151610463565b600101610312565b505050565b60606004805461024e90610b23565b6000336102df818585610463565b610360838383600161050e565b73ffffffffffffffffffffffffffffffffffffffff8381166000908152600160209081526040808320938616835292905220547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff811461045d578181101561044e576040517ffb8f41b200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8416600482015260248101829052604481018390526064015b60405180910390fd5b61045d8484848403600061050e565b50505050565b73ffffffffffffffffffffffffffffffffffffffff83166104b3576040517f96c6fd1e00000000000000000000000000000000000000000000000000000000815260006004820152602401610445565b73ffffffffffffffffffffffffffffffffffffffff8216610503576040517fec442f0500000000000000000000000000000000000000000000000000000000815260006004820152602401610445565b610360838383610656565b73ffffffffffffffffffffffffffffffffffffffff841661055e576040517fe602df0500000000000000000000000000000000000000000000000000000000815260006004820152602401610445565b73ffffffffffffffffffffffffffffffffffffffff83166105ae576040517f94280d6200000000000000000000000000000000000000000000000000000000815260006004820152602401610445565b73ffffffffffffffffffffffffffffffffffffffff8085166000908152600160209081526040808320938716835292905220829055801561045d578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161064891815260200190565b60405180910390a350505050565b73ffffffffffffffffffffffffffffffffffffffff831661068e5780600260008282546106839190610ba5565b909155506107409050565b73ffffffffffffffffffffffffffffffffffffffff831660009081526020819052604090205481811015610714576040517fe450d38c00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff851660048201526024810182905260448101839052606401610445565b73ffffffffffffffffffffffffffffffffffffffff841660009081526020819052604090209082900390555b73ffffffffffffffffffffffffffffffffffffffff821661076957600280548290039055610795565b73ffffffffffffffffffffffffffffffffffffffff821660009081526020819052604090208054820190555b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516107f491815260200190565b60405180910390a3505050565b60006020808352835180602085015260005b8181101561082f57858101830151858201604001528201610813565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8301168501019250505092915050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461089257600080fd5b919050565b600080604083850312156108aa57600080fd5b6108b38361086e565b946020939093013593505050565b6000806000606084860312156108d657600080fd5b6108df8461086e565b92506108ed6020850161086e565b9150604084013590509250925092565b60006020828403121561090f57600080fd5b6109188261086e565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff811182821017156109955761099561091f565b604052919050565b600067ffffffffffffffff8211156109b7576109b761091f565b5060051b60200190565b600082601f8301126109d257600080fd5b813560206109e76109e28361099d565b61094e565b8083825260208201915060208460051b870101935086841115610a0957600080fd5b602086015b84811015610a255780358352918301918301610a0e565b509695505050505050565b60008060408385031215610a4357600080fd5b823567ffffffffffffffff80821115610a5b57600080fd5b818501915085601f830112610a6f57600080fd5b81356020610a7f6109e28361099d565b82815260059290921b84018101918181019089841115610a9e57600080fd5b948201945b83861015610ac357610ab48661086e565b82529482019490820190610aa3565b96505086013592505080821115610ad957600080fd5b50610ae6858286016109c1565b9150509250929050565b60008060408385031215610b0357600080fd5b610b0c8361086e565b9150610b1a6020840161086e565b90509250929050565b600181811c90821680610b3757607f821691505b602082108103610b70577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b808201808211156102e5577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fdfea164736f6c6343000817000a";

export { ERC20_ABI, ERC20_BYTECODE };
