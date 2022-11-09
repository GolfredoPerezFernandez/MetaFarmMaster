import { useLocation } from "react-router";
import React, {useEffect} from "react";
import { Menu, Button } from "antd";
import { NavLink } from "react-router-dom";
import getStyles from "../MockAPI/getStyles";

const customStyles = getStyles();

function MenuItems() {
  const { pathname } = useLocation();
  const [selectedKeys, setSelectedKeys] = React.useState([pathname]);

  useEffect(() => {
    setSelectedKeys([pathname])
  },[pathname])

  return (
    <Menu
      theme="dark"
      mode="horizontal"
      style={{
        display: "flex",
        fontSize: "17px",
        fontWeight: "500",
        width: "100%",
        justifyContent: "center",
        backgroundColor: customStyles.headerBackground,
      }}
      selectedKeys={selectedKeys}
    >
      {/* <Menu.Item key="/quickstart">
        <NavLink to="/quickstart">🚀 Quick Start</NavLink>
      </Menu.Item> */}
      <Menu.Item key="/home">
        <Button onClick={() => window.open("https://mfarmgame.com/")} type="primary">
          Home
        </Button>
      </Menu.Item>

      <Menu.Item key="/lands">
        <Button onClick={() => window.open("https://mfarmgame.com/lands/")} type="primary">
          Lands
        </Button>
      </Menu.Item>

      <Menu.Item key="/presale">
        <Button onClick={() => window.open("https://mfarmgame.com/index.php/ico/metafarm-initial-coin-offering/")} type="primary">
          Presale
        </Button>
      </Menu.Item>

      <Menu.Item key="/">
        <NavLink to="/">
          <div
            style={{
              color: pathname === '/' ? customStyles.activeHeaderTextColor :
                customStyles.offHeaderTextColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            🏦 Explore
          </div>
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/balance">
        <NavLink to="/balance">
          <div
            style={{
              color: pathname === '/balance' ? customStyles.activeHeaderTextColor :
                customStyles.offHeaderTextColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            💰 Your collection
          </div>
        </NavLink>
      </Menu.Item>
      <Menu.Item key="/transactions">
        <NavLink to="/transactions">
          <div
            style={{
              color: pathname === '/transactions' ? customStyles.activeHeaderTextColor :
                customStyles.offHeaderTextColor,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            💸 Transactions
          </div>
        </NavLink>
      </Menu.Item>

      {/* <Menu.Item key="/1inch">
        <NavLink to="/1inch">🏦 Dex</NavLink>
      </Menu.Item> */}
      {/* <Menu.Item key="onramp">
        <NavLink to="/onramp">💵 Fiat</NavLink>
      </Menu.Item>
      <Menu.Item key="/erc20balance">
        <NavLink to="/erc20balance">💰 Balances</NavLink>
      </Menu.Item>
      <Menu.Item key="/erc20transfers">
        <NavLink to="/erc20transfers">💸 Transfers</NavLink>
      </Menu.Item> */}
      {/* <Menu.Item key="/contract">
        <NavLink to="/contract">📄 Contract</NavLink>
      </Menu.Item> */}
    </Menu>
  );
}

export default MenuItems;
