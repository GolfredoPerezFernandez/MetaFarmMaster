import React, { useState } from 'react';
import { Card, Tooltip, Input } from 'antd';
import {
    RadarChartOutlined,
    ShoppingCartOutlined
} from "@ant-design/icons";
import {useWeb3ExecuteFunction, useMoralis} from 'react-moralis';
import getContractABI from 'MockAPI/getContractABI';

const {TextArea} = Input;

const styles = {
    root: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: "15px",
        maxWidth: "1030px",
    },
    input: {
        marginTop: '1rem',
    },
    input2: {
        marginTop: '1rem',
        height:100,
    }
}

const AdminCollectionManager = (props) => {
    const {account} = useMoralis();
    const [mintBatchStartId, setMintBatchStartId] = useState(null);
    const [mintBatchEndId, setMintBatchEndId] = useState(null);
    const [marketItems, setMarketItems] = useState(null);
    const contractProcessor = useWeb3ExecuteFunction();

const numbersToArray = (begin, end) => {
        let result = [];
        for(let i = Number(begin); i <= Number(end); i++){
            result.push(Number(i));
        }
        return result;
    }

    const formatPrices = (list) => {
        let result = list.map(x => String(x * ("1e" + 18)));
        return result;
    }

    const resetMintBatch = () => {
        setMintBatchStartId(null);
        setMintBatchEndId(null);
    }

    const onMintBatch = async() => {
        const ids = numbersToArray(mintBatchStartId, mintBatchEndId);
        const amounts = ids.map(x => 1);//amounts are always 1 since each item is unique
        const OPTIONS = {
            contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
            functionName: "mintBatch",
            abi: getContractABI(),
            params: {
                to: account,
                ids,
                amounts
            }
        }
        console.log(OPTIONS, 'mintBatch Options');
        await contractProcessor.fetch({
            params: OPTIONS,
            onSuccess: () => {alert("Collection Mint Completed!"); resetMintBatch();},
            onError: (err) => {alert("FAIL check console"); console.log(err)}
        })
    }

    const onCreateMarketItemBatch = async() => {
        const inputJSON = JSON.parse(marketItems);
        const {tokenIds, prices} = inputJSON;
        const amounts = tokenIds.map(x => 1);
        console.log(formatPrices(prices))
        console.log(tokenIds)
        console.log(amounts)
        const OPTIONS = {
            contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
            functionName: "createMarketItemBatch",
            abi: getContractABI(),
            params: {
                nftContract: process.env.REACT_APP_CONTRACT_ADDRESS,
                tokenIds,
                prices: formatPrices(prices),
                amounts
            }
        };
        console.log(OPTIONS,'createMarketItemBatch Options');
        await contractProcessor.fetch({
            params: OPTIONS,
            onSuccess: () => { alert("COLLECTION MINTED") },
            onError: (err) => { alert("FAIL check console"); console.log(err) }
        })
    }

    return (
        <div style={styles.root}>
            {/*Mint Batch*/}
            <Card
                hoverable
                actions={[
                    <Tooltip title="Mint Collection">
                        <RadarChartOutlined onClick={() => onMintBatch()}/>
                    </Tooltip>
                ]}
            >
                <h1>Step 1: Mint NFT Collection [a, a+1,...,b]</h1>
                <p style={{color: 'gray'}}>{`from id a to b`}</p>
                <Input
                    style={styles.input}
                    placeholder={'start id (a)'}
                    onChange={(e) => setMintBatchStartId(e.target.value)}
                />
                <Input
                    style={styles.input}
                    placeholder={'end id (b)'}
                    onChange={(e) => setMintBatchEndId(e.target.value)}
                />
            </Card>

            {/*Add to market*/}
            <Card
                style={{marginLeft: '1rem', height: '100%'}}
                hoverable
                actions={[
                    <Tooltip title="Add to market">
                        <ShoppingCartOutlined onClick={() => onCreateMarketItemBatch()}/>
                    </Tooltip>
                ]}
            >
                <h1>Step 2: Add to market</h1>
                <p style={{color: 'gray'}}>{`{"tokenIds": [], "prices": []}`}</p>
                <Input
                    style={styles.input3}
                    rows={3}
                    placeholder={'insert json'}
                    onChange={(e) => setMarketItems(e.target.value)}
                />
            </Card>
        </div>
    )
}

export default AdminCollectionManager