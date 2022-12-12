import { useMoralis } from "react-moralis";
import { getEllipsisTxt } from "helpers/formatters";
import Blockie from "../Blockie";
import { Button, Card, Modal } from "antd";
import Moralis from 'moralis-v1';

import { useState } from "react";
import Address from "../Address/Address";
import { SelectOutlined } from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import Text from "antd/lib/typography/Text";
import { connectors } from "./config";
const styles = {
  account: {
    height: "42px",
    padding: "0 15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "12px",
    backgroundColor: "rgb(51, 102, 102)",
    cursor: "pointer",
    border: "1px solid rgb(231, 234, 243)",
    borderRadius: "12px",
  },
  text: {
    color: "#21BF96",
  },
  connector: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    height: "auto",
    justifyContent: "center",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "20px 5px",
    cursor: "pointer",
  },
  icon: {
    alignSelf: "center",
    fill: "rgb(40, 13, 95)",
    flexShrink: "0",
    marginBottom: "8px",
    height: "30px",
  },
};

function Account() {
  const { authenticate, enableWeb3,isAuthenticated, account, chainId, logout } = useMoralis();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  async function addNetwork() {
    let ethereum = window.ethereum;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: process.env.REACT_APP_CHAIN_ID }],
      });
    } catch (error) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: process.env.REACT_APP_CHAIN_ID, // Hexadecimal version of 80001, prefixed with 0x
            chainName: process.env.REACT_APP_CHAIN_NAME,
            nativeCurrency: {
              name: process.env.REACT_APP_NATIVE_CURRENCY_NAME,
              symbol: process.env.REACT_APP_NATIVE_CURRENCY_SYMBOL,
              decimals: Number(process.env.REACT_APP_NATIVE_CURRENCY_DECIMAL),
            },
            rpcUrls: [process.env.REACT_APP_RPC_URL],
            blockExplorerUrls: [process.env.REACT_APP_BLOCK_EXPLORER],
            iconUrls: [""],
          }],
        });
        alert("Network added please try switching network again");
      } catch (addError) {
        console.log('did not add network', addError)
      }
    }
  }

  console.log(chainId, process.env.REACT_APP_CHAIN_ID)

  if (!isAuthenticated || !account || chainId !== process.env.REACT_APP_CHAIN_ID) {
    return (
      <>
        <div>
          <p style={styles.text}>Authenticate</p>
        </div>
        <Modal
          visible={!isAuthenticated || !account || chainId !== process.env.REACT_APP_CHAIN_ID}
          footer={null}
          bodyStyle={{
            padding: "15px",
            fontSize: "17px",
            fontWeight: "500",
          }}
          style={{ fontSize: "16px", fontWeight: "500" }}
          width="340px"
        >
          <div style={{ padding: "10px", display: "flex", justifyContent: "center", fontWeight: "700", fontSize: "20px", color: 'black' }}>
            Connect Wallet
          </div>
          {!isAuthenticated || !account ?
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {connectors.map(({ title, icon, connectorId }, key) => (
                <div
                  style={styles.connector}
                  key={key}
                  onClick={async () => {
                    try {
                      console.log('initiate login');
                      await enableWeb3({ throwOnError: true, provider: 'metamask' });
                      let user=await Moralis.User.current()
                      console.log('user '+user)

                      const { message } = await Moralis.Cloud.run('requestMessage', {
                        address: "0xFE7ef3E7F8A45E4F4F8331C9Bc1c1896655596a1",
                        chain: '0x61',
                        networkType: 'evm',
                      })
                      console.log('initiate login');
                      await authenticate({ 
                        throwOnError: true,
                        signingMessage: message }).then((res)=>{

                          console.log("account "+JSON.stringify(res))
                          
                          console.log("account "+JSON.stringify(account))
                        });
                      window.localStorage.setItem("connectorId", connectorId);
                      setIsAuthModalVisible(false);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <img src={icon} alt={title} style={styles.icon} />
                  <Text style={{ fontSize: "14px" }}>{title}</Text>
                </div>
              ))}
            </div> :
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h5 style={{ color: 'black' }}>
                Switch Network to {process.env.REACT_APP_CHAIN_NAME}
              </h5>
              <Button onClick={() => addNetwork()} type="primary" style={{ marginTop: '1rem' }}>
                Switch Network
              </Button>
            </div>
          }
        </Modal>
      </>
    );
  }

  return (
    <>
      {/* <button
        onClick={async () => {
          try {
            console.log("change")
            await web3._provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x38" }],
            });
            console.log("changed")
          } catch (e) {
            console.error(e);
          }
        }}
      >
        Hi
      </button> */}
      <div style={styles.account} onClick={() => setIsModalVisible(true)}>
        <p style={{ marginRight: "5px", ...styles.text }}>{getEllipsisTxt(account, 6)}</p>
        <Blockie currentWallet scale={3} />
      </div>
      <Modal
        visible={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        bodyStyle={{
          padding: "15px",
          fontSize: "17px",
          fontWeight: "500",
        }}
        style={{ fontSize: "16px", fontWeight: "500" }}
        width="400px"
      >
        Account
        <Card
          style={{
            marginTop: "10px",
            borderRadius: "1rem",
          }}
          bodyStyle={{ padding: "15px" }}
        >
          <Address avatar="left" size={6} copyable style={{ fontSize: "20px" }} />
          <div style={{ marginTop: "10px", padding: "0 10px" }}>
            <a href={`${getExplorer(chainId)}/address/${account}`} target="_blank" rel="noreferrer">
              <SelectOutlined style={{ marginRight: "5px" }} />
              View on Explorer
            </a>
          </div>
        </Card>
        <Button
          size="large"
          type="primary"
          style={{
            width: "100%",
            marginTop: "10px",
            borderRadius: "0.5rem",
            fontSize: "16px",
            fontWeight: "500",
          }}
          onClick={async () => {
            await logout();
            window.localStorage.removeItem("connectorId");
            setIsModalVisible(false);
          }}
        >
          Disconnect Wallet
        </Button>
      </Modal>
    </>
  );
}

export default Account;
