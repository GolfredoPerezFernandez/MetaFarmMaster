import React, { useEffect, useState } from "react";
import { Card, List, Badge, Skeleton, Divider, Button } from "antd";
import getContractABI from "MockAPI/getContractABI";
import { useParams,useHistory } from "react-router-dom";
import { useMoralis, useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { getNativeByChain } from "helpers/networks";
import getStyles from "../MockAPI/getStyles";


export default function ViewNFT() {
    const [NFT, setNFT] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const { id } = useParams();
    const { Moralis, chainId, isAuthenticated,account } = useMoralis();
    const queryMarketItems = useMoralisQuery('CreatedMarketItems', query => query.limit(10000000));
    const nativeName = getNativeByChain(chainId);
    const contractProcessor = useWeb3ExecuteFunction();
    let history = useHistory();
    const customStyles = getStyles();

    const fetchMarketItems = JSON.parse(
        JSON.stringify(queryMarketItems.data, [
            "objectId",
            "createdAt",
            "price",
            "nftContract",
            "itemId",
            "sold",
            "tokenId",
            "seller",
            "owner",
            "confirmed"
        ])
    );


    const getTransactions =async () => {
        let result = [];
        const options = {
            chain: "0x61",
            address: process.env.REACT_APP_CONTRACT_ADDRESS,
            token_id: id,
          };
        const transfersNFT = await Moralis.Web3API.token.getWalletTokenIdTransfers(options);


        for(let i=0;i<transfersNFT.result.length;i++){

            if(transfersNFT.result[i].from_address?.toString().toLowerCase()===process.env.REACT_APP_CONTRACT_ADDRESS.toString().toLowerCase()){
                console.log('aqui1'+JSON.stringify(transfersNFT.result[i]))
                const options = {
            chain: "0x61",
                    transaction_hash:
                    transfersNFT.result[i].transaction_hash,
                  };
                  const transaction = await Moralis.Web3API.native.getTransaction(options);
console.log(parseInt(transaction.logs[0].data.toString()))
if(parseInt(transaction.logs[0].data.toString())!==2.315841784746324e+77){
  result=[...result,{
    from_address:transfersNFT.result[0].from_address,                    
    to_address:transfersNFT.result[0].to_address,                  
    value:Moralis.Units.FromWei(parseInt(transaction.logs[0].data.toString()).toString()),
  }]
  
}
                    

            }
            
        }
        setTransactions(result)
        return result;
    }

    const getNFTMetaData = () => {
        let parsedURI = `${process.env.REACT_APP_MORALIS_SERVER_URL}/functions/getNFT?_ApplicationId=${process.env.REACT_APP_MORALIS_APPLICATION_ID}&nftId=${id}`
        let result = fetch(parsedURI)
            .then(response => response.json())
            .then(response => { return response })
        return Promise.resolve(result);
    }


    const getMarketItem = async (token_id) => {
        let result={
            
        }
        console.log(token_id)
        if(isAuthenticated){
            const OPTIONS = {
                contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
                functionName: "fetchItem",
                abi: getContractABI(),
                params: {
                    _tokenId: token_id
                },
            };
    
            await contractProcessor.fetch({
                params: OPTIONS,
                onSuccess: (res) => {
                    result=res
                },
                onError: (error) => { console.log(error); alert(error) }
            })
        }
        return result;
    }

    const getNFT = async () => {
         let marketItem=await getMarketItem(id)  
        console.log(parseFloat(marketItem[5]))
       
       let  metadata2 = {
         name:`Land #${id}`,
         isSold:marketItem[6],
         isCanceled:marketItem[7],
         price:parseFloat(marketItem[5]),
         owner:marketItem[3],
         image:`https://mfarmgame.com/NFTs/${id}.png`,
     }
        setNFT(metadata2);
    }

    const updateSoldMarketItem = async () => {
        const marketId = getMarketItem(id).objectId;
        const marketList = Moralis.Object.extend("CreatedMarketItems");
        const query = new Moralis.Query(marketList);
        await query.get(marketId)
            .then(obj => {
                obj.set("sold", true);
                obj.set("owner", account);
                obj.save();
            })
    }

    const addItemImage = () => {
        const ItemImage = Moralis.Object.extend("ItemImages");
        const itemImage = new ItemImage();
        const nft = NFT
        const tokenDetails = getMarketItem(id);

        itemImage.set("image", nft.image);
        itemImage.set("name", nft.name);
        itemImage.set("nftContract", tokenDetails.nftContract);
        itemImage.set("tokenId", tokenDetails.tokenId);

        itemImage.save();
    }

    const buyNFT = async () => {
       
        
console.log(parseInt(NFT).toString())

console.log(id)
        const OPTIONS2 = {
            contractAddress: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
            functionName: 'approve',
            abi: tokenAbi,
            params: {
              _spender: process.env.REACT_APP_CONTRACT_ADDRESS,
              _value: parseInt(NFT?.price).toString(),
            },
          };
      
          await contractProcessor.fetch({
            params: OPTIONS2,
            onSuccess: async (res) => {
              await res.wait();
      
              const OPTIONS = {
                contractAddress:process.env.REACT_APP_CONTRACT_ADDRESS,
                functionName: 'createMarketSale',
                abi: getContractABI(),
                params: {
                  itemId:id,
                },
              };
      
              await contractProcessor.fetch({
                params: OPTIONS,
                onSuccess: (res) => {
                  alert('NFT bought!');
                },
                onError: (error) => {
                  if (error.data?.message !== undefined) {
                    alert(error.data?.message);
                  }
                },
              });
            },
            onError: (error) => {
              if (error.data?.message !== undefined) {
                alert(error.data?.message);
              }
            },
          })


    }

    useEffect(() => {
      if(account){

        getNFT();
        getTransactions()
      }
    }, [account]);


    return (
        <div style={{ padding: "15px", maxWidth: "1030px", width: "100%" }}>
            <Skeleton loading={!NFT}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <img src={NFT?.image} alt={id} style={{ width: '50%' }} />
                    {NFT?.price!==0 ?
                        <Badge.Ribbon
                            text={(NFT?.price / ("1e" + 18)) + ' ' + "BUSD"}
                            color={NFT?.isSold ? 'gray' : 'green'}
                            placement='end'
                        /> :
                        <Badge.Ribbon
                            text={'Not Available'}
                            color={'green'}
                            placement='end'
                        />
                    }
                    <Card style={{ width: '50%', border: customStyles.cardBorder}}>
                        <h1>{NFT?.name}</h1>
                        <p style={{ paddingLeft: '1em' }}>{NFT?.description}</p>
                        <Divider />
                        {NFT?.price!==0  ?
                            <div>
                                <b>Price: </b>
                                {`${NFT?.price / ("1e" + 18)} BUSD`}
                            </div> :
                            <div>
                                <b>Not For Sale</b>
                            </div>
                        }
                        {NFT?.owner  ?
                            <div>
                                <b>Owner: </b>
                                {
                                    NFT?.owner?.slice(0, 5) +
                                    '...' +
                                    NFT?.owner?.slice(NFT?.owner?.length - 5, NFT?.owner?.length)
                                }
                            </div> :
                            <div>
                                <b>Owner: </b>
                                - - - -
                            </div>
                        }
                        {transactions &&
                            <List
                                size='small'
                                header={<b>Transactions</b>}
                                bordered
                                dataSource={transactions}
                                renderItem={
                                    item =>
                                        <List.Item>
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ color: 'green' }}>{'From: '}</div>
                                                <div style={{ marginLeft: '0.4rem', display: 'flex' }}>
                                                  {
                                                        item.from_address.slice(0, 5) +
                                                        '...' +
                                                        item.from_address.slice(item.from_address.length - 5, item.from_address.length)
                                                    } 
                                                </div>
                                                
                                                
                                                <div style={{ width: '20px' }}></div>
                                                <div style={{ color: 'green' }}>{'To: '}</div>
                                                <div style={{ marginLeft: '0.4rem', display: 'flex' }}>
                                                  {
                                                        item.to_address.slice(0, 5) +
                                                        '...' +
                                                        item.to_address.slice(item.to_address.length - 5, item.to_address.length)
                                                    } 
                                                </div>
                                                <div style={{ width: '20px' }}></div>
                                                <div style={{ color: 'green' }}>{'Value: '}</div>
                                                <div style={{ marginLeft: '0.4rem', display: 'flex' }}>
                                                  {
                                                        item.value
                                                    } 
                                                </div>
                                            </div>
                                        </List.Item>
                                }
                            />
                        }{NFT?.price!==0 &&NFT?.owner?.toString().toLowerCase()!==account?.toLowerCase().toLowerCase()?<Button
                            onClick={buyNFT}
                            disabled={NFT?.isSold}
                            style={{ marginTop: '1rem' }}
                            type="primary"
                        >
                        {'Buy Now'}
                        </Button> :NFT?.owner.toString().toLowerCase()===account?.toLowerCase().toLowerCase()? <Button
                        onClick={buyNFT}
                        disabled={NFT?.isSold}
                        style={{ marginTop: '1rem' }}
                        type="primary"
                    >
                        {'Remove From Market'}
                    </Button>:null}
                        
                    </Card>
                </div>
            </Skeleton>
        </div>
    )
}


const tokenAbi=[
    {
      constant: false,
      inputs: [],
      name: 'disregardProposeOwner',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'name',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'assetProtectionRole',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: 'r', type: 'bytes32[]' },
        { name: 's', type: 'bytes32[]' },
        { name: 'v', type: 'uint8[]' },
        { name: 'to', type: 'address[]' },
        { name: 'value', type: 'uint256[]' },
        { name: 'fee', type: 'uint256[]' },
        { name: 'seq', type: 'uint256[]' },
        { name: 'deadline', type: 'uint256[]' },
      ],
      name: 'betaDelegatedTransferBatch',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: 'sig', type: 'bytes' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'seq', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
      name: 'betaDelegatedTransfer',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_from', type: 'address' },
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'initializeDomainSeparator',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'unpause',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'unfreeze',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'claimOwnership',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_newSupplyController', type: 'address' }],
      name: 'setSupplyController',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'paused',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'initialize',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'pause',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'getOwner',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ name: 'target', type: 'address' }],
      name: 'nextSeqOf',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_newAssetProtectionRole', type: 'address' }],
      name: 'setAssetProtectionRole',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'freeze',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'owner',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_newWhitelister', type: 'address' }],
      name: 'setBetaDelegateWhitelister',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_value', type: 'uint256' }],
      name: 'decreaseSupply',
      outputs: [{ name: 'success', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'isWhitelistedBetaDelegate',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'whitelistBetaDelegate',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_proposedOwner', type: 'address' }],
      name: 'proposeOwner',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_value', type: 'uint256' }],
      name: 'increaseSupply',
      outputs: [{ name: 'success', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'betaDelegateWhitelister',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'proposedOwner',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'unwhitelistBetaDelegate',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [
        { name: '_owner', type: 'address' },
        { name: '_spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'wipeFrozenAddress',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'EIP712_DOMAIN_HASH',
      outputs: [{ name: '', type: 'bytes32' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ name: '_addr', type: 'address' }],
      name: 'isFrozen',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'supplyController',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [],
      name: 'reclaimBUSD',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    { inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
      name: 'Transfer',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: true, name: 'spender', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'currentOwner', type: 'address' },
        { indexed: true, name: 'proposedOwner', type: 'address' },
      ],
      name: 'OwnershipTransferProposed',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'oldProposedOwner', type: 'address' }],
      name: 'OwnershipTransferDisregarded',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'oldOwner', type: 'address' },
        { indexed: true, name: 'newOwner', type: 'address' },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    { anonymous: false, inputs: [], name: 'Pause', type: 'event' },
    { anonymous: false, inputs: [], name: 'Unpause', type: 'event' },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'addr', type: 'address' }],
      name: 'AddressFrozen',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'addr', type: 'address' }],
      name: 'AddressUnfrozen',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'addr', type: 'address' }],
      name: 'FrozenAddressWiped',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'oldAssetProtectionRole', type: 'address' },
        { indexed: true, name: 'newAssetProtectionRole', type: 'address' },
      ],
      name: 'AssetProtectionRoleSet',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
      name: 'SupplyIncreased',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
      name: 'SupplyDecreased',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'oldSupplyController', type: 'address' },
        { indexed: true, name: 'newSupplyController', type: 'address' },
      ],
      name: 'SupplyControllerSet',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
        { indexed: false, name: 'seq', type: 'uint256' },
        { indexed: false, name: 'fee', type: 'uint256' },
      ],
      name: 'BetaDelegatedTransfer',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'oldWhitelister', type: 'address' },
        { indexed: true, name: 'newWhitelister', type: 'address' },
      ],
      name: 'BetaDelegateWhitelisterSet',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'newDelegate', type: 'address' }],
      name: 'BetaDelegateWhitelisted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'oldDelegate', type: 'address' }],
      name: 'BetaDelegateUnwhitelisted',
      type: 'event',
    },
  ]