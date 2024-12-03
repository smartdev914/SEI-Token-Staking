import { useSelectWallet, useWallet, WalletConnectButton as WCButton } from "@sei-js/react";
import React, { useState } from "react";
import { minAddress } from "../../utils/methods";

const WalletConnectButton = ({ className}) => {
  const { connectedWallet, accounts  } = useWallet();
  const { openModal, closeModal } = useSelectWallet();

  const onClick = async () => {
    if ( connectedWallet ) {
      // await connectedWallet.disconnect();
      // window.location.reload(false);      
    }
    else {
      openModal();
    }
      
  }

  const getAddress = () => {
    return minAddress(accounts[0].address);
  }

  return (
      <button
        className={`${className} text-primary bg-[#1B0B37] hover:bg-[#2B1B47] border-2 border-highlight 
            px-2 h-[48px] text-[18px] font-semibold  rounded-[12px] flex items-center justify-center`}
        onClick={onClick}
      >
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0_11_61" style={{'maskType':'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
            <rect x="0.5" y="0.5" width="24" height="24" fill="#D9D9D9"/>
          </mask>
          <g mask="url(#mask0_11_61)">
            <path d="M5.5 21.5C4.95 21.5 4.47917 21.3042 4.0875 20.9125C3.69583 20.5208 3.5 20.05 3.5 19.5V5.5C3.5 4.95 3.69583 4.47917 4.0875 4.0875C4.47917 3.69583 4.95 3.5 5.5 3.5H19.5C20.05 3.5 20.5208 3.69583 20.9125 4.0875C21.3042 4.47917 21.5 4.95 21.5 5.5V8H19.5V5.5H5.5V19.5H19.5V17H21.5V19.5C21.5 20.05 21.3042 20.5208 20.9125 20.9125C20.5208 21.3042 20.05 21.5 19.5 21.5H5.5ZM13.5 17.5C12.95 17.5 12.4792 17.3042 12.0875 16.9125C11.6958 16.5208 11.5 16.05 11.5 15.5V9.5C11.5 8.95 11.6958 8.47917 12.0875 8.0875C12.4792 7.69583 12.95 7.5 13.5 7.5H20.5C21.05 7.5 21.5208 7.69583 21.9125 8.0875C22.3042 8.47917 22.5 8.95 22.5 9.5V15.5C22.5 16.05 22.3042 16.5208 21.9125 16.9125C21.5208 17.3042 21.05 17.5 20.5 17.5H13.5ZM20.5 15.5V9.5H13.5V15.5H20.5ZM16.5 14C16.9167 14 17.2708 13.8542 17.5625 13.5625C17.8542 13.2708 18 12.9167 18 12.5C18 12.0833 17.8542 11.7292 17.5625 11.4375C17.2708 11.1458 16.9167 11 16.5 11C16.0833 11 15.7292 11.1458 15.4375 11.4375C15.1458 11.7292 15 12.0833 15 12.5C15 12.9167 15.1458 13.2708 15.4375 13.5625C15.7292 13.8542 16.0833 14 16.5 14Z" fill="#FFD6D6"/>
          </g>
        </svg>
        <span className="ml-2">
          {connectedWallet ? getAddress() : "CONNECT WALLET"}
        </span>
        
      </button>
  );
};

export default WalletConnectButton;
