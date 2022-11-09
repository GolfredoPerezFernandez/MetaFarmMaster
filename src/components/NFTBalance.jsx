import React, { useEffect, useState, useRef } from "react";
import { useMoralis, useMoralisWeb3Api, useWeb3ExecuteFunction } from "react-moralis";
import { Card, Image, Tooltip, Modal, Input, Skeleton } from "antd";
import {
  FileSearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import { useVerifyMetadata } from "hooks/useVerifyMetadata";
import getContractABI from "../MockAPI/getContractABI";
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { Pagination } from 'antd';
import {useHistory} from "react-router-dom";
import getStyles from "../MockAPI/getStyles";

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

function NFTBalance(props) {
  const [NFTBalances, setNFTBalances] = useState(null);
  const { Moralis, chainId, account, web3 } = useMoralis();
  const [visible, setVisibility] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { verifyMetadata } = useVerifyMetadata();
  const [nftToSell, setNftToSell] = useState(null);
  const [price, setPrice] = useState(null);
  const Web3Api = useMoralisWeb3Api();
  const contractProcessor = useWeb3ExecuteFunction();
  const [pageNumber, setPageNumber] = useState(1);
  const [loadedPageNumbers, setLoadedPageNumbers] = useState([1]);
  const topOfPage = useRef(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const customStyles = getStyles();

  const addItemImage = () => {
    const ItemImage = Moralis.Object.extend("ItemImages");
    const itemImage = new ItemImage();
    const metadata = nftToSell.metadata;
    const nft = { ...nftToSell, ...metadata }

    itemImage.set("image", nft.image);
    itemImage.set("nftContract", nft.token_address);
    itemImage.set("tokenId", nft.token_id);
    itemImage.set("name", nft.name);

    itemImage.save();
  }

  const sellNft = async (nft, currentPrice) => {
    const p = currentPrice * ("1e" + 18);
    console.log(nft.token_id)
    const OPTIONS = {
      contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
      functionName: "createMarketItem",
      abi: getContractABI(),
      params: {
        nftContract: nft.token_address,
        tokenId: nft.token_id,
        price: String(p)
      }
    };
    await contractProcessor.fetch({
      params: OPTIONS,
      onSuccess: () => {
        alert("Success");
        setVisibility(false);
      },
      onError: (error) => alert(error)
    })
  }

  const getAllNftsForContract = async () => {
    await Moralis.start({
      serverUrl: process.env.REACT_APP_MORALIS_SERVER_URL,
      appId: process.env.REACT_APP_MORALIS_APPLICATION_ID
    });
    //REPLACE CHAIN ID (chainId)
    const OPTIONS = {
      address: account,
      chain: process.env.REACT_APP_CHAIN_ID,
      token_address: process.env.REACT_APP_CONTRACT_ADDRESS
    };
    const initBalance = await Web3Api.account.getNFTsForContract(OPTIONS);
    let NFTz = [initBalance.result];
    console.log(initBalance)
    for (let offset = 500; offset <= Number(initBalance.total); offset += 500) {
      let nft_batch = await Web3Api.account.getNFTsForContract({ ...OPTIONS, offset });
      NFTz.push(nft_batch.result);
    }

    setNFTBalances({ result: NFTz.flat() });
    //getting the first 20 metadatas at first & the rest on page change
    await getMetaDataAndReplace(NFTz.flat());
  }

  async function getMetaDataAndReplace(NFTs) {
    setLoading(true);
    let startIndex = (pageNumber - 1) * 20;
    let endIndex = startIndex + 20;
    //
    let result = NFTs;
    for (let i = 0; i < NFTs.length; i++) {
      if (i >= startIndex && i <= endIndex) {
        let nft = await fetchNFTMetaDataV2(NFTs[i]);
        result[i] = nft[0];
        if (i % 3 === 0 && nft[0].metadata) {
          setNFTBalances({ result })
        }
      }
    }
    setNFTBalances({ result });
    setLoading(false);
  }

  const getContractBalance = async () => {
    await getAllNftsForContract();
  }

  const handleSellClick = (nft) => {
    setNftToSell(nft);
    setVisibility(true);
  }

  useEffect(() => {
    getContractBalance()
  }, [chainId])

  async function fetchNFTMetaDataV2(nft) {
    let promises = [];
    console.log(nft)
    const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/nft/${nft.token_address}/${nft.token_id}`,
        params: {chain: '0x61', format: 'decimal'},
        headers: {accept: 'application/json', 'X-API-Key': 'zhBPujnqzsfrUcHgXlaxxjydt94ApDBx4tLwQ4ZjF8Zv1W2OUMUTG3APLLA18nap'}
      };
      let  metadata2 = {
        name:`Land #${nft.token_id}`,
        image:`https://mfarmgame.com/NFTs/${nft.token_id}.png`,
    }

      console.log(metadata2)
      promises.push({ ...nft,...metadata2 } )
      return Promise.all(promises);
}

  useEffect(() => {
    topOfPage.current.scrollIntoView({behavior: 'smooth'});
    if (!loadedPageNumbers.includes(pageNumber)) {
      let pages = loadedPageNumbers;
      pages.push(pageNumber);
      setLoadedPageNumbers(pages);
      const updateMetadata = async () => {
        await getMetaDataAndReplace(NFTBalances.result);
      }
      updateMetadata();
    }
  }, [pageNumber])

  return (
    <div ref={topOfPage} style={{ padding: "15px", maxWidth: "1030px", width: "100%" }}>
      <h1>💰 NFT Balances</h1>
      <div style={styles.NFTs}>
        <Skeleton loading={!NFTBalances?.result}>
          {NFTBalances?.result &&
            NFTBalances.result.slice((pageNumber - 1) * 20, ((pageNumber - 1) * 20) + 20).map((nft, index) => {
              return (
                <Card
                  key={nft.token_id}
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
                    <Tooltip title="Sell NFT">
                      <ShoppingCartOutlined
                        onClick={() => handleSellClick(nft)}
                      />
                    </Tooltip>,
                  ]}
                  style={{ width: 240, border: customStyles.cardBorder }}
                  cover={
                    <Image
                      preview={false}
                      src={`https://mfarmgame.com/NFTs/${nft.token_id}.png` || "error"}
                      fallback="data:image/png;base64,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"
                      alt=""
                      style={{ height: "300px" }}
                    />
                  }
                  key={index}
                >
                  <Meta title={nft.name} description={`#${nft.token_id}`} />
                </Card>
              );
            })}
        </Skeleton>
      </div>
      <Pagination
        style={{ marginTop: '1rem' }}
        current={pageNumber}
        onChange={(p) => setPageNumber(p)}
        total={NFTBalances?.result.length}
        defaultPageSize={20}
        showSizeChanger={false}
        disabled={loading}
      />
      <Modal
        title={`Sell ${nftToSell?.name || "NFT"}`}
        visible={visible}
        onCancel={() => setVisibility(false)}
        onOk={() => sellNft(nftToSell, price)}
        confirmLoading={isPending}
        okText="Sell"
      >
        {nftToSell &&
          <Image
            preview={false}
            src={nftToSell?.image || "error"}
            fallback="data:image/png;base64,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"
            alt=""
            style={{ height: "300px" }}
          />
        }
        <Input autoFocus placeholder="Set price" onChange={e => setPrice(e.target.value)} />
      </Modal>
    </div>
  );
}

export default NFTBalance;
