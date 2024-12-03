import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { SeiWalletProvider } from '@sei-js/react';
import { Provider } from "react-redux";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


window.Buffer = window.Buffer || require("buffer").Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SeiWalletProvider
	    chainConfiguration={{
        chainId: process.env.REACT_APP_CHAIN_ID,
        restUrl: process.env.REACT_APP_REST_URL,
        rpcUrl: process.env.REACT_APP_RPC_URL
	    }}
	    wallets={['compass', 'fin', 'keplr', 'leap']}>
    <BrowserRouter>
      <ThemeProvider>
          <App />
          <ToastContainer />
      </ThemeProvider>
    </BrowserRouter>

  </SeiWalletProvider>
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
