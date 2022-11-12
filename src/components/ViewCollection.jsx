import React, { useEffect, useState, useRef } from "react";
import { useMoralis, useMoralisQuery, useMoralisWeb3Api, useWeb3ExecuteFunction } from "react-moralis";
import { Card, Image, Tooltip, Modal, Badge, Skeleton, Alert, Checkbox } from "antd";
import { getNativeByChain } from "helpers/networks";
import {
    FileSearchOutlined,
    ShoppingCartOutlined,
    CloseCircleOutlined
} from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import getCollections from "../MockAPI/getCollections";
import { useParams } from "react-router-dom";
import getContractABI from "MockAPI/getContractABI";
import { useHistory } from "react-router-dom";
import { Pagination } from 'antd';
import getStyles from "../MockAPI/getStyles";
import axios from 'axios';

const { Meta } = Card;

const styles = {
    NFTs: {
        display: "flex",
        flexWrap: "wrap",
        WebkitBoxPack: "start",
        justifyContent: "flex-start",
        margin: "0 auto",
        maxWidth: "1000px",
        width: "100%",
        gap: "10px",
    },
};


function ViewCollection(props) {
    const Web3Api = useMoralisWeb3Api()
    const { Moralis, chainId, account ,user,address,isAuthenticated} = useMoralis();
    const [visible, setVisibility] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [NFTs, setNFTs] = useState(null);
    const [nftToBuy, setNftToBuy] = useState(null);
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    let { collectionId } = useParams();
    const queryMarketItems = useMoralisQuery('CreatedMarketItems', query => query.limit(10000000)); const nativeName = getNativeByChain(chainId);
    const contractProcessor = useWeb3ExecuteFunction();
    let history = useHistory();
    const [pageNumber, setPageNumber] = useState(1);
    const [loadedPageNumbers, setLoadedPageNumbers] = useState([1]);
    const topOfPage = useRef(null);
    const [loading, setLoading] = useState(false);
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
    const addItemImage = () => {
        const ItemImage = Moralis.Object.extend("ItemImages");
        const itemImage = new ItemImage();
        const metadata = nftToBuy.metadata;
        const nft = { ...nftToBuy, ...metadata }

        itemImage.set("image", nft.image);
        itemImage.set("nftContract", nft.token_address);
        itemImage.set("tokenId", nft.token_id);
        itemImage.set("name", nft.name);

        itemImage.save();
    }

    const filterNFTs = (nfts) => {
        const collection = getCollections().find(x => x.id === Number(collectionId));
        let result = nfts.filter(n => collection.items.includes(Number(n.token_id)));
        return { result, collectionName: collection.name };
    }

    function getAllTokenIds() {
        const collection = getCollections().find(x => x.id === Number(collectionId));
        const startId = collection.items[0];
        const endId = collection.items[collection.items.length - 1];

        let NFTz = [];
        for (let i = startId; i <= endId; i++) {
            let paddedId = ("0000000000000000000000000000000000000000000000000000000000000000" + i).slice(-64);
            let nft = {
                token_id: String(i),
                token_uri: `https://mfarmgame.com/NFTs/${paddedId}.json`,
                token_address: process.env.REACT_APP_CONTRACT_ADDRESS,
            }
            NFTz.push(nft);
        }
        return NFTz
    }

    async function getMetaDataAndReplace(NFTs) {
        setLoading(true);
        const collection = getCollections().find(x => x.id === Number(collectionId));
        let startIndex = (pageNumber - 1) * 20;
        let endIndex = startIndex + 20;
        //
        console.log("startIndex "+startIndex)
        console.log("endIndex "+endIndex)
        let result = NFTs;
        for (let i = 0; i < NFTs.length; i++) {
            if (i >= startIndex && i <= endIndex) {
                let nft = await fetchNFTMetaDataV2(NFTs[i]);
                result[i] = nft[0];
                if (i % 3 === 0 && nft[0].metadata) {
                    setNFTs({ result, collectionName: collection.name })
                }
            }
        }
        setNFTs({ result, collectionName: collection.name });
        setLoading(false);
    }

    async function fetchNFTMetaDataV2(nft) {
        let promises = [];
       
            let marketItem=await getMarketItem(nft)  
            console.log(nft.token_id)
            console.log(parseFloat(marketItem[5]))
           
           
          let  metadata2 = {
            name:`Land #${nft.token_id}`,
            isSold:marketItem[6],
            isCanceled:marketItem[7],
            price:parseFloat(marketItem[5]),
            owner:marketItem[3],
            image:`https://mfarmgame.com/NFTs/${nft.token_id}.png`,
        }
  console.log(metadata2)
  promises.push({ ...nft,...metadata2 } )
          return Promise.all(promises);
    }


    async function getContractNFTs() {
        const CONTRACT_NFTS = getAllTokenIds();
        let filteredNFTs = filterNFTs(CONTRACT_NFTS);
        filteredNFTs.result.sort((a, b) => a.token_id - b.token_id);
        if (filteredNFTs.length !== 0) {
            //getting the first 20 metadatas at first & the rest on page change
            await getMetaDataAndReplace(filteredNFTs.result)
        }
    }

    const handleBuyClick = (nft) => {
        setNftToBuy(nft);
        setVisibility(true);
    }
    const removeNFT = async (nft) => {
        
      
        const OPTIONS = {
            contractAddress:process.env.REACT_APP_CONTRACT_ADDRESS,
            functionName: 'cancelMarketItem',
            abi: getContractABI(),
            params: {
                nftContractAddress:process.env.REACT_APP_CONTRACT_ADDRESS,
              marketItemId:nft.token_id,
            },
          };
  
          await contractProcessor.fetch({
            params: OPTIONS,
            onSuccess: () => {
              alert('NFT removed!');
            },
            onError: (error) => {
              if (error.data?.message !== undefined) {
                alert(error.data?.message);
              }
            },
          });
    }
    const buyNFT = async (nft) => {
       
        

        const OPTIONS2 = {
            contractAddress: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
            functionName: 'approve',
            abi: tokenAbi,
            params: {
              _spender: process.env.REACT_APP_CONTRACT_ADDRESS,
              _value: parseInt(nft.price).toString(),
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
                  itemId:nft.token_id,
                },
              };
      
              await contractProcessor.fetch({
                params: OPTIONS,
                onSuccess: () => {
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


    const getMarketItem = async (nft) => {
        let result={
            
        }
        if(isAuthenticated){
            const OPTIONS = {
                contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
                functionName: "fetchItem",
                abi: getContractABI(),
                params: {
                    _tokenId: nft.token_id
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

    useEffect(() => {
      if(account){

        getContractNFTs(process.env.REACT_APP_CHAIN_ID);
      }
    }, [chainId,account]);

    useEffect(() => {
        topOfPage.current.scrollIntoView({behavior: 'smooth'});
        if (!loadedPageNumbers.includes(pageNumber)) {
            let pages = loadedPageNumbers;
            pages.push(pageNumber);
            setLoadedPageNumbers(pages);
            const updateMetadata = async () => {
                await getMetaDataAndReplace(NFTs.result);
            }
            updateMetadata();
        }
    }, [pageNumber])

    return (
        <div style={{ padding: "15px", maxWidth: "1030px", width: "100%" }}>
            <h1 ref={topOfPage}>{NFTs?.collectionName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Checkbox
                    disabled={!NFTs?.result}
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                <div style={{ marginLeft: '0.4rem' }}>Show only available items</div>
            </div>
            <div style={styles.NFTs}>
                <Skeleton loading={!NFTs?.result}>
                    {NFTs?.result &&
                        NFTs?.result.slice((pageNumber - 1) * 20, ((pageNumber - 1) * 20) + 20).map((nft, index) => {
                          
                            return (

                                <Card
                                    hoverable
                                    actions={[
                                        <Tooltip title="View On Blockexplorer">
                                            <FileSearchOutlined
                                                onClick={() =>
                                                    window.open(
                                                        `${getExplorer(chainId)}address/${nft.token_address
                                                        }`,
                                                        "_blank"
                                                    )
                                                }
                                            />
                                        </Tooltip>,
                                        // <Tooltip title="Transfer NFT">
                                        //   <SendOutlined onClick={() => handleTransferClick(nft)} />
                                        // </Tooltip>,
                                       nft?.owner&&
                                     <Tooltip title={nft?.owner.toString().toLowerCase()===account.toLowerCase().toLowerCase()?"Remove NFT":"Buy NFT"}>
                                            {nft?.owner.toString().toLowerCase()===account.toLowerCase().toLowerCase()?
                                            parseFloat(nft?.price)===0  ?null:<CloseCircleOutlined
                                                onClick={() => removeNFT(nft)}
                                            />:parseFloat(nft?.price)===0 ?null:<ShoppingCartOutlined
                                                onClick={() => buyNFT(nft)}
                                            />}
                                        </Tooltip>,
                                    ]}
                                    style={{ width: 240, border: customStyles.cardBorder }}
                                    cover={
                                        <Image
                                            onClick={() => history.push(`/nft/${nft?.token_id}`)}
                                            preview={false}
                                            src={nft?.image || "error"}
                                            fallback="data:image/png;base64,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"
                                            alt=""
                                            style={{ height: "300px" }}
                                        />
                                    }
                                    key={nft?.token_id}
                                >
                                    <Meta title={nft?.name} description={`#${nft?.token_id}`} />
                                    {
                                        nft?.price!=="0"&&!nft?.isCanceled &&!nft?.isSold&&
                                        <Badge.Ribbon
                                            text={`${nft?.price / ("1e" + 18)} BUSD`}
                                            color='green'
                                        />
                                    } 
                                    
                                    {parseFloat(nft?.price)===0  && <Badge.Ribbon text={'Not Avaliable'} color='gray' />}

                                                                       {parseFloat(nft?.price)===0  && <Badge.Ribbon text={'Not Avaliable'} color='gray' />}

                                  </Card>

                            );
                        })}
                </Skeleton>
            </div>
            <Pagination
                style={{ marginTop: '1rem' }}
                current={pageNumber}
                onChange={(p) => setPageNumber(p)}
                total={NFTs?.result.length}
                defaultPageSize={20}
                showSizeChanger={false}
                disabled={loading}
            />
          
        </div>
    );
}

export default ViewCollection;

const tokenAbi = [
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