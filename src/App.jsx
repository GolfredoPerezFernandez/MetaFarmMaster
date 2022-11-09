import { useEffect } from "react";
import { useMoralis, useChain } from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Account from "components/Account/Account";
import Chains from "components/Chains";
import TokenPrice from "components/TokenPrice";
import ERC20Balance from "components/ERC20Balance";
import ERC20Transfers from "components/ERC20Transfers";
import DEX from "components/DEX";
import NFTBalance from "components/NFTBalance";
import Wallet from "components/Wallet";
import { Layout, Tabs } from "antd";
import "antd/dist/antd.css";
import NativeBalance from "components/NativeBalance";
import "./style.css";
import QuickStart from "components/QuickStart";
import Contract from "components/Contract/Contract";
import Text from "antd/lib/typography/Text";
import Ramper from "components/Ramper";
import MenuItems from "./components/MenuItems";
import NFTTokenIds from "components/NFTTokenIds";
import ViewCollection from "components/ViewCollection";
import NFTMarketTransactions from "components/Transactions";
import AdminCollectionManager from "components/AdminCollectionManager";
import ViewNFT from "components/ViewNFT";
import getStyles from "./MockAPI/getStyles";

const { Header, Footer } = Layout;

const NETWORKS = [
  {
    key: "0x1",
    value: "Ethereum",
  },
  {
    key: "0x539",
    value: "Local Chain",
  },
  {
    key: "0x3",
    value: "Ropsten Testnet",
  },
  {
    key: "0x4",
    value: "Rinkeby Testnet",

  },
  {
    key: "0x2a",
    value: "Kovan Testnet",
  },
  {
    key: "0x5",
    value: "Goerli Testnet",
  },
  {
    key: "0x38",
    value: "Binance",
  },
  {
    key: "0x61",
    value: "Smart Chain Testnet",
  },
  {
    key: "0x89",
    value: "Polygon",
  },
  {
    key: "0x13881",
    value: "Mumbai",
  },
  {
    key: "0xa86a",
    value: "Avalanche",
  },
  {
    key: "0xa869",
    value: "Avalanche Testnet",
  },
];

const getChain = (key) => {
  const result = NETWORKS.find(ele => ele.key === key);
  return result;
}

const customStyles = getStyles();

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "110px",
    padding: "10px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: customStyles.headerBackground,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
};
const App = ({ isServerInfo }) => {
  const { isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading, chainId } =
    useMoralis();

  useEffect(() => {
    const connectorId = window.localStorage.getItem("connectorId");
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading)
      enableWeb3({ provider: connectorId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  return (
    <Layout style={{ height: "100vh", overflow: "auto", backgroundColor: '#141414' }}>
      <Router>
        <Header style={styles.header}>
          <Logo />
          <MenuItems />
          <div style={styles.headerRight}>
            <Chains />
            {/* <TokenPrice
              address="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
              chain="eth"
              image="https://cloudflare-ipfs.com/ipfs/QmXttGpZrECX5qCyXbBQiqgQNytVGeZW5Anewvh2jc4psg/"
              size="40px"
            /> */}
            <NativeBalance />
            <Account />
          </div>
        </Header>

        <div style={styles.content}>
          <Switch>
            {/* <Route exact path="/quickstart">
              <QuickStart isServerInfo={isServerInfo} />
            </Route>
            <Route path="/wallet">
              <Wallet />
            </Route> */}
            <Route path="/1inch">
              <Tabs defaultActiveKey="1" style={{ alignItems: "center" }}>
                <Tabs.TabPane tab={<span>Ethereum</span>} key="1">
                  <DEX chain="eth" />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span>Binance Smart Chain</span>} key="2">
                  <DEX chain="bsc" />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span>Polygon</span>} key="3">
                  <DEX chain="polygon" />
                </Tabs.TabPane>
              </Tabs>
            </Route>
            {/* <Route path="/erc20balance">
              <ERC20Balance />
            </Route>
            <Route path="/onramp">
              <Ramper />
            </Route>
            <Route path="/erc20transfers">
              <ERC20Transfers />
            </Route> */}
            <Route exact path="/">
              <NFTTokenIds />
            </Route>
            <Route exact path="/balance">
              <NFTBalance chainName={getChain(chainId)} />
            </Route>
            <Route path="/transactions">
              <NFTMarketTransactions />
            </Route>
            <Route path="/nftMarket/:collectionId">
              <ViewCollection chainName={getChain(chainId)} />
            </Route>
            <Route path="/nft/:id">
              <ViewNFT />
            </Route>
            {/*Hidden route with no direct link only for admin*/}
{           <Route path="/admin-collection-manager">
              <AdminCollectionManager />
            </Route> }
            {/* <Route path="/contract">
              <Contract />
            </Route> */}
            {/* <Route path="/">
              <Redirect to="/quickstart" />
            </Route>
            <Route path="/ethereum-boilerplate">
              <Redirect to="/quickstart" />
            </Route> */}
            <Route path="/nonauthenticated">
              <>Please login using the "Authenticate" button</>
            </Route>
          </Switch>
        </div>
      </Router>
      {/* <Footer style={{ textAlign: "center" }}>
        <Text style={{ display: "block" }}>
          ⭐️ Please star this{" "}
          <a
            href="https://github.com/ethereum-boilerplate/ethereum-boilerplate/"
            target="_blank"
            rel="noopener noreferrer"
          >
            boilerplate
          </a>
          , every star makes us very happy!
        </Text>

        <Text style={{ display: "block" }}>
          🙋 You have questions? Ask them on the {""}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://forum.moralis.io/t/ethereum-boilerplate-questions/3951/29"
          >
            Moralis forum
          </a>
        </Text>

        <Text style={{ display: "block" }}>
          📖 Read more about{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://moralis.io?utm_source=boilerplatehosted&utm_medium=todo&utm_campaign=ethereum-boilerplat"
          >
            Moralis
          </a>
        </Text>
      </Footer> */}
    </Layout>
  );
};

export const Logo = () => (
  <a href="https://mfarmgame.com">
    <div style={{ display: "flex" }}>

      <svg
        width="60"
        height="60"
        viewBox="0 0 183.33 183.33"
        fill="none"
        xmlns="http://www.w3.org/1999/xlink"
      >
        <polygon points="151.9,156.28 121.26,168.97 90.63,181.67 59.99,168.97 29.35,156.28 16.67,125.65 3.97,95.01 16.67,64.37 29.35,33.74 59.99,21.05 90.63,8.36 121.26,21.05 151.9,33.74 164.59,64.37 177.28,95.01 164.59,125.65 "
          fill="#009933"
        />
        <polygon points="99.77,95.35 127.53,150.76 125.26,154.57 119.98,154.57 91.41,110.76 66.51,153.91 55.97,153.91 51.41,146.27 19.88,94.7 40.7,61.91 45.17,71.79 37.7,94.82 60.5,130.67 81.48,94.68 53.72,39.27 56,35.45 61.27,35.45 90.87,77.89 114.74,36.12 125.28,36.12 129.84,43.75 161.38,95.33 140.55,128.11 136.09,118.24 143.55,95.2 120.75,59.35 "
          fill="#ffffff"
        />
      </svg>

    </div>
  </a>
);

export default App;
