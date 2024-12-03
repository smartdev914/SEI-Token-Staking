import PrimaryButton from "../components/buttons/PrimaryButton";
import { useEffect, useRef, useState } from "react";
import { Reveal } from 'react-awesome-reveal';
import { fadeInUp } from "../utils/constants";
import useClient from "../utils/client";
import { useWallet } from "@sei-js/react";
import { toast } from "react-toastify";


export default function Stake({ className }) {
  const [depositeAmount, setDepositeAmount] = useState("");
  const [totalStaked, setTotalStaked] = useState(0);
  const [meStaked, setMeStaked] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [reward, setReward] = useState(0);
  const [dailyReturn, setDailyReturn] = useState(0);
  const {queryContractConfig, queryTokenBalance, queryStakerInfo, stakeMajin, unstakeMajin, claimReward} = useClient();
  const {connectedWallet} = useWallet();

  const fetch = async () => {
    const config = await queryContractConfig();
    if (config) {
      setDailyReturn(config.daily_return);
      setTotalStaked(Number(config.total_staked) / 10 ** 6)
    }
    const stakerInfo = await queryStakerInfo();
    if ( stakerInfo ) {
      setMeStaked(Number(stakerInfo.amount) / 10 ** 6)
      setReward(Number(stakerInfo.reward) / 10 ** 6)
    }

    const balance = await queryTokenBalance();
    if ( balance ) {
      setTokenBalance(Number(balance) / 10 ** 6);
    } 
}

  useEffect(() => {
    fetch();
  }, [connectedWallet, queryTokenBalance, queryContractConfig, queryStakerInfo]);

  const formatBlanace = (v, digits = 4) => {
    return Math.floor(v * (10 ** digits) + 1e-2) / (10 ** digits);
  }

  function commafy( num ) {
    const fmtNum = formatBlanace(num);
    const str = fmtNum.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
  }

  const onStake = async () => {
    const amount = Number(depositeAmount);
    if ( amount <= 0 || amount > tokenBalance ) {
      toast("Invalid amount");
      return;
    }
    let result = false;
    try {
     result = await stakeMajin(amount);
    } catch (e) {
      console.log(e);
    }

    if ( result ) {
      toast(`${amount} Majin staked`);
      fetch();
      setDepositeAmount("");
    } else {
      toast(`Failed to stake Majin`);
    }
  }

  const onUnstake = async() => {
    if ( !connectedWallet || !meStaked ) {
      return;
    }
    let result = false;
    try {
     result = await unstakeMajin();
    } catch (e) {
      console.log(e);
    }

    if ( result ) {
      toast(`${meStaked} Majin unstaked`);
      fetch();
    } else {
      toast(`Failed to unstake Majin`);
    }
  }

  const onClaimRewards = async() => {
    if ( !connectedWallet || !reward ) {
      return;
    }
    let result = false;
    try {
     result = await claimReward();
    } catch (e) {
      console.log(e);
    }

    if ( result ) {
      toast(`${reward} Majin claimed`);
      fetch();
    } else {
      toast(`Failed to claim reward`);
    }
  }

  return (
    <div className={`${className} flex flex-col  `}>
      <div className="w-full flex flex-row justify-center">
        <div
          className="overflow-hidden w-full md:w-[640px] flex flex-col justify-between "
        >
          <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
            <div className="flex flex-col"> 
              <div className="rounded-[15px] border-2 border-highlight flex flex-col items-center justify-center px-[45px] py-[50px]">
                <span className="text-highlight font-[700] text-[28px]">MAJIN STAKING</span>
                <div className="flex flex-row justify-between items-center w-full mt-[30px]">
                  <span className="text-primary font-[500] text-[18px]">TOTAL VALUE LOCKED (TVL)</span>
                  <span className="text-primary font-[500] text-[18px]">$ {commafy(totalStaked * 0.0019 )}</span>
                </div>
                <div className="flex flex-row justify-between items-center w-full mt-[18px]">
                  <span className="text-primary font-[500] text-[18px]">STAKED</span>
                  <span className="text-primary font-[500] text-[18px]">{commafy(meStaked)} MAJIN</span>
                </div>
                <div className="flex flex-row justify-between items-center w-full mt-[18px]">
                  <span className="text-primary font-[500] text-[18px]">AVAILABLE</span>
                  <span className="text-primary font-[500] text-[18px]">{commafy(tokenBalance)} MAJIN</span>
                </div>
                <div className="w-4/6 flex flex-col">
                  <div className="w-full rounded-[20px] border-2 border-highlight flex items-center justify-end px-[20px] py-[12px] mt-[40px]">
                    <input
                        className="text-[18px] font-[500] bg-transparent outline-none flex-auto text-right pr-[10px] text-primary"
                        size="10"
                        placeholder="0"
                        value={depositeAmount}
                        onChange={(e) => setDepositeAmount(e.target.value)}
                      ></input>
                    <span className="text-primary font-[500] text-[18px]">MAJIN</span>
                  </div>

                  <PrimaryButton
                    className="font-[700] text-[18px] mt-[18px]"
                    label="STAKE & EARN MAJIN"
                    onClick={() => {
                      onStake();
                    }}
                  />

                  <div className="flex flex-row justify-between items-center w-full mt-[28px]">
                    <span className="text-primary font-[400] text-[14px]">YOUR REWARDS</span>
                    <span className="text-primary font-[400] text-[14px]">{commafy(reward)} MAJIN</span>
                  </div>

                  <div className="flex flex-row justify-between items-center w-full mt-[24px]">
                    <PrimaryButton
                      className="w-[45%] text-[14px] py-[8px]"
                      label="UNSTAKE"
                      onClick={() => {
                        onUnstake();
                      }}
                    />
                    <PrimaryButton
                      className="w-[45%] text-[14px] py-[8px]"
                      label="CLAIM REWARDS"
                      onClick={() => {
                        onClaimRewards();
                      }}
                    />
                  </div>

                  
                </div>
              </div>


              <div className="rounded-[20px] border-2 border-highlight flex flex-col items-center justify-center px-[45px] py-[50px] mt-[40px]">
                <span className="text-highlight font-[700] text-[28px]">OVERALL METRICS</span>
                <div className="w-4/6 flex flex-col">
                  
                  <div className="flex flex-row justify-between items-center w-full mt-[28px]">
                    <span className="text-primary font-[400] text-[18px]">DAILY RETURN</span>
                    <span className="text-primary font-[400] text-[18px]">{commafy(dailyReturn)}%</span>
                  </div>

                  <div className="flex flex-row justify-between items-center w-full mt-[28px]">
                    <span className="text-primary font-[400] text-[18px]">APR</span>
                    <span className="text-primary font-[400] text-[18px]">{commafy(dailyReturn*365)}%</span>
                  </div>

                  <div className="flex flex-row justify-between items-center w-full mt-[28px]">
                    <span className="text-primary font-[400] text-[18px]">PROTOCOL FEE</span>
                    <span className="text-primary font-[400] text-[18px]">1%</span>
                  </div>
                  
                </div>
              </div>
            </div>
          </Reveal>
        </div>

      </div>

    </div>
  );
}
