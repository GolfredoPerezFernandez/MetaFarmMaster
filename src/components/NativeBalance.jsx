import { useMoralis, useNativeBalance } from "react-moralis";

function NativeBalance(props) {
  const { data: balance } = useNativeBalance(props);
  const { account, isAuthenticated } = useMoralis();

  if (!account || !isAuthenticated) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "12px",
        backgroundColor: "rgb(51, 102, 102)",
        cursor: "pointer",
        border: "1px solid rgb(231, 234, 243)",
        borderRadius: "12px",
        height: '42px',
        width: '100px',
        fontSize: '13px',
        color: 'rgb(34, 184, 146)'
      }}
    >
      {balance.formatted}
    </div>
  )
}

export default NativeBalance;
