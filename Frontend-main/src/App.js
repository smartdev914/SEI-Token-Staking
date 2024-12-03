import "./App.css";

import NavbarWithCTAButton from "./components/Navbar";
import { useRoutes } from "react-router-dom";
import Routes from "./Routes";

import { Spinner } from "@material-tailwind/react";

import { EventBus, minAddress } from "./utils/methods";
import { BTN_HEIGHT_IN_MAIN_AREA, BTN_WIDTH_IN_MAIN_AREA, SET_LOADING, SOCIAL_TELEGRAM, SOCIAL_TWITTER } from "./utils/constants";
import { useEffect, useState } from "react";
import PrimaryButton from "./components/buttons/PrimaryButton";
import Stake from "./pages/Stake";
import SocialIcon from "./components/SocialIcon";
import WalletConnectButton from "./components/buttons/WalletConnectButton";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const showWalletMenu = false;
  
  const setLoading = (data) => {
    setIsLoading(data);
  };

  useEffect(() => {
    EventBus.on(SET_LOADING, (data) => {
      setLoading(data);
    });

    return () => {
      EventBus.remove(SET_LOADING);
    };
  }, []);


  return (

    <div
      className="App flex flex-col bg-black min-h-[100vh] overflow-x-hidden text-eloblack items-center"
    >
      <div className="flex w-[100vw] lg:w-[1200px] justify-between h-max px-6 md:px-10 py-5 md:py-8 items-start ">
        <div className="w-full relative">
          <header className="flex flex-row justify-between items-center w-full">
            <div className="flex">
              <img src="/logo.png" className="w-[64px] h-[70px]" alt=""/>
              <span className="text-highlight font-black text-left text-[24px] ml-2">MAJIN<br/>STAKING</span>
            </div>
            <div className="flex flex-row items-center ">
              <SocialIcon social={SOCIAL_TWITTER}/>
              <SocialIcon className="ml-[22px]" social={SOCIAL_TELEGRAM}/>
              <WalletConnectButton className="ml-[22px]" />
            </div>
          </header>
          <div className="w-full py-[30px]">
            <Stake />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 999,
          top: 0,
          left: 0,
          display: `${isLoading ? "flex" : "none"}`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner color="blue" className="h-10 w-10" />
      </div>
    </div>
  );
}

export default App;
