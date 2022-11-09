import { useMoralis } from "react-moralis";
import { getEllipsisTxt } from "helpers/formatters";
import Blockie from "../Blockie";
import { Button, Card, Modal } from "antd";
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
  const { authenticate, isAuthenticated, enableWeb3,account, chainId, logout } = useMoralis();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);


  console.log(chainId, process.env.REACT_APP_CHAIN_ID)

  if (!isAuthenticated ) {
    return (
      <>
        <div>
          <Button style={styles.text}  onClick={async () => {
                    try {
                      console.log('initiate login');
                      await authenticate();
                      console.log(isAuthenticated)
                   
                    } catch (e) {
                      console.error(e);
                    }
                  }}>Authenticate</Button>
        </div>
      
      </>
    );
  }else{ return (
    <div style={styles.account} onClick={() => setIsModalVisible(true)}>
    <p style={{ marginRight: "5px", ...styles.text }}>{getEllipsisTxt(account, 6)}</p>
    <Blockie currentWallet scale={3} />
  </div>)
  }

}

export default Account;
