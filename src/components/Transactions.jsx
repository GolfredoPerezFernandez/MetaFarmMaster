import React, { useState } from 'react';
import { useMoralis, useMoralisQuery } from "react-moralis";
import { Table, Tag, Space } from "antd";
import moment from "moment";
import { BSCLogo } from './Chains/Logos';

const styles = {
    table: {
        margin: "0 auto",
        width: '1000px'
    }
}

function NFTMarketTransactions() {
    const { account } = useMoralis();
    const queryMarketItems = useMoralisQuery('CreatedMarketItems', query => query.limit(10000000));
    const queryItemImages = useMoralisQuery("ItemImages", query => query.limit(10000000));
    const fetchItemImages = JSON.parse(
        JSON.stringify(queryItemImages.data, [
            "nftContract",
            "tokenId",
            "name",
            "image",
        ])
    );
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
    )
        .filter(
            (item) => item.seller === account || item.owner === account
        )
        .sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0
        );

    function getImage(addrs, id) {
        const img = fetchItemImages.find(
            (element) =>
                element.nftContract.toLowerCase() === addrs.toLowerCase() &&
                element.tokenId === id
        );
        return img?.image;
    }

    function getName(addrs, id) {
        const nme = fetchItemImages.find(
            (element) =>
                element.nftContract === addrs &&
                element.tokenId === id
        );
        return nme?.name;
    }

    const data = fetchMarketItems?.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item, index) => ({
        key: index,
        date: moment(item.createdAt).format("DD-MM-YYYY HH:mm"),
        collection: item.nftContract,
        item: item.tokenId,
        tags: [item.seller, item.sold],
        price: item.price / ("1e" + 18)
    }));

    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date"
        },
        {
            title: "Item",
            key: "item",
            render: (text, record) => (
                <Space size="middle">
                    <img
                        alt=""
                        src={getImage(record.collection, record.item)}
                        style={{ width: "40px", borderRadius: "4px" }}
                    />
                    <span>#{record.item}</span>
                </Space>
            ),
        },
        {
            title: "Name",
            key: "collection",
            render: (text, record) => (
                <Space size="middle">
                    <span>{getName(record.collection, record.item)}</span>
                </Space>
            ),
        },
        {
            title: "Transaction Status",
            dataIndex: "tags",
            key: "tags",
            render: (tags) => (
                <>
                    {tags.map((tag) => {
                        let color = "geekblue";
                        let status = "BUY";
                        if (tag === false) {
                            color = "volcano";
                            status = "waiting";
                        } else if (tag === true) {
                            color = "green";
                            status = "confirmed";
                        }
                        if (tag === account) {
                            status = "SELL";
                        }
                        return (
                            <Tag color={color} key={tag}>
                                {status.toUpperCase()}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (e) => (
                <Space size='middle'>
                    <span>{e}</span>
                    <BSCLogo />
                </Space>
            )
        },
    ]

    console.log(fetchMarketItems, 'fmi')
    console.log(fetchItemImages, 'itemImages')
    console.log(data, 'data')
    return (
        <>
            <div>
                <div style={styles.table}>
                    <Table columns={columns} dataSource={data} />
                </div>
            </div>
        </>
    )
}

export default NFTMarketTransactions;