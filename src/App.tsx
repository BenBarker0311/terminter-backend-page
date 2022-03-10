import "./App.css";
import Home from "./Home";
import Login from "./Login";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from "@solana/wallet-adapter-wallets";
import {
  BrowserRouter,
  Routes,
  Route, 
  Navigate,
  RouteProps,
} from 'react-router-dom';
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { isAuthenticated } from "./auth";
import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import { createTheme, ThemeProvider } from "@material-ui/core";

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

const txTimeout = 30000; // milliseconds (confirm this works for your project)

const theme = createTheme({
    palette: {
        type: 'dark',
    },
    overrides: {
        MuiButtonBase: {
            root: {
                justifyContent: 'flex-start',
            },
        },
        MuiButton: {
            root: {
                textTransform: undefined,
                padding: '12px 16px',
            },
            startIcon: {
                marginRight: 8,
            },
            endIcon: {
                marginLeft: 8,
            },
        },
    },
});

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);
  const [isAuth, setIsAuth] = useState(false)
  const wallets = useMemo(
    () => [
        getPhantomWallet(),
        getSlopeWallet(),
        getSolflareWallet(),
        getSolletWallet({ network }),
        getSolletExtensionWallet({ network })
    ],
    []
  );
  const auth = async () => {
    let flag:any = await isAuthenticated();
    console.log(flag)
    setIsAuth(flag)  
  }
  useEffect(() => {
    auth()
  }, [])
  return (
      <ThemeProvider theme={theme}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletDialogProvider>
              <BrowserRouter>
                <Routes>
                  {
                    !isAuth?
                    <Route path='/'
                      element={
                      <Login/>
                    } 
                    /> : <Route path='/mint'
                        element={
                            <Home
                              connection={connection}
                              txTimeout={txTimeout}
                              rpcHost={rpcHost}
                            />
                        } 
                      />
                    }
                  
                  
                  
                  <Route path="*" element={<h1 className="text_center white pt_24">Page not found!</h1>}></Route>
                </Routes>
            </BrowserRouter>
            </WalletDialogProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
  );
};

export default App;
