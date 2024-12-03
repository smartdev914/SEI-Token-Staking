use crate::constants::{ONE_DAY_SECONDS, PROTOCOL_FEE, RATIO_100};
use crate::error::ContractError;
use crate::msg::{
    ConfigResponse, ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg, ReceiveMsg, StakerInfo, StakerResponse
};
use crate::state::{Config, CONFIG, STAKERS};
use crate::util;
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    attr, from_binary, to_binary, Addr, Binary, CosmosMsg, Deps, DepsMut, Env, MessageInfo, Order, Response, StdResult, Storage, Uint128
};
use cw2::{get_contract_version, set_contract_version};
use cw20::{Cw20ReceiveMsg, Denom,};

// Version info, for migration info
const CONTRACT_NAME: &str = "incentive";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

///////////////////////////////////////////////////////// this func is called for instantiating the contract //////////////////////////////////
///
///         input params: owner address
///                       stake token address
///         
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    let config = Config {
        owner: info.sender.clone(),
        stake_token_address: msg.stake_token_address,
        daily_return: msg.daily_return,
        total_staked: Uint128::zero()
    };
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::UpdateOwner { owner } => execute_update_owner(deps, info, owner),
        ExecuteMsg::UpdateConfig { daily_return } => execute_update_config(deps, info, daily_return),
        ExecuteMsg::Receive(msg) => execute_receive(deps, env, info, msg),
        ExecuteMsg::WithdrawReward { amount } => execute_withdraw_reward(deps, env, info, amount),
        ExecuteMsg::ClaimReward {  } => {
            execute_claim_reward(deps, env, info)
        }
        ExecuteMsg::Unstake {} => execute_unstake(deps, env, info),
    }
}

pub fn execute_update_reward(
    storage: &mut dyn Storage,
    env: Env,
    addr: Addr
) -> Result<Uint128, ContractError> {
    let cfg = CONFIG.load(storage)?;
    let now = env.block.time.seconds();
    let mut staker_info = STAKERS
                .load(storage, addr.clone())
                .unwrap_or(StakerInfo {
                    address: addr.clone(),
                    amount: Uint128::zero(),
                    reward: Uint128::zero(),
                    last_time: now
                });
    
    staker_info.reward += staker_info.amount.multiply_ratio(
        (now - staker_info.last_time) * cfg.daily_return
        , 100 * ONE_DAY_SECONDS);
    staker_info.last_time = now;

    STAKERS.save(storage, addr.clone(), &staker_info)?;

    Ok(staker_info.reward)
}

///////////////////////////////////////////////////////// this func is called when user click stake button on the frontend //////////////////////////////////
///
///         input params: customer's wallet address
///                       lock_type for claim reward
///         
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn execute_receive(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    wrapper: Cw20ReceiveMsg,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    if wrapper.amount == Uint128::zero() {
        return Err(ContractError::InvalidInput {});
    }
    let user_addr = &deps.api.addr_validate(&wrapper.sender)?;

    if info.sender.clone() != cfg.stake_token_address {
        return Err(ContractError::UnacceptableToken {});
    }
    let now = env.block.time.seconds();

    let msg: ReceiveMsg = from_binary(&wrapper.msg)?;
    let amount = wrapper.amount.multiply_ratio(RATIO_100-PROTOCOL_FEE, RATIO_100);
    match msg {
        ReceiveMsg::Stake { } => {
            execute_update_reward(deps.storage, env, user_addr.clone())?;
            let mut staker_info = STAKERS
                .load(deps.storage, user_addr.clone())
                .unwrap_or(StakerInfo {
                    address: user_addr.clone(),
                    amount: Uint128::zero(),
                    reward: Uint128::zero(),
                    last_time: now
                });

            staker_info.amount = staker_info.amount + amount;

            STAKERS.save(deps.storage, user_addr.clone(), &staker_info)?;

            CONFIG.update(deps.storage, |mut exists| -> StdResult<_> {
                exists.total_staked += amount;
                Ok(exists)
            })?;

            return Ok(Response::new().add_attributes(vec![
                attr("action", "stake"),
                attr("address", user_addr.clone()),
                attr("amount", amount),
            ]));
        }
    }
}

///////////////////////////////////////////////////////// this func is called when we click reward button on frontend//////////////////////////////////
///
///         input params: customer's wallet address
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn execute_claim_reward(
    deps: DepsMut,
    env: Env,
    info: MessageInfo
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    let cw20_reward = execute_update_reward(deps.storage, env.clone(), info.sender.clone()).unwrap();

    let mut staker_info = STAKERS
                .load(deps.storage, info.sender.clone())
                .unwrap_or(StakerInfo {
                    address: info.sender.clone(),
                    amount: Uint128::zero(),
                    reward: Uint128::zero(),
                    last_time: env.block.time.seconds()
                });
   
    let tot_reward_token = util::get_token_amount(
        deps.querier,
        Denom::Cw20(cfg.stake_token_address.clone()),
        env.contract.address.clone(),
    )?;

    if tot_reward_token < cw20_reward {
        return Err(ContractError::NotEnoughReward {});
    }

    staker_info.reward = Uint128::zero();

    STAKERS.save(deps.storage, info.sender.clone(), &staker_info)?;

    let mut msgs: Vec<CosmosMsg> = vec![];
    if !cw20_reward.is_zero() {
        msgs.push(util::transfer_token_message(
            Denom::Cw20(cfg.stake_token_address.clone()),
            cw20_reward,
            info.sender.clone(),
        )?);
    }
    // End

    return Ok(Response::new().add_messages(msgs).add_attributes(vec![
        attr("action", "claim_reward"),
        attr("address", info.sender.clone()),
        attr("reward_amount", Uint128::from(cw20_reward)),
    ]));
}
///////////////////////////////////////////////////////// this func is called when we click unstake button on frontend//////////////////////////////////
///
///         Using this function, we can unstake all staked token
///         input params: none
///         
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn execute_unstake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    let mut staker_info = STAKERS
                .load(deps.storage, info.sender.clone())
                .unwrap_or(StakerInfo {
                    address: info.sender.clone(),
                    amount: Uint128::zero(),
                    reward: Uint128::zero(),
                    last_time: env.block.time.seconds()
                });

    let staked_amount = staker_info.amount.clone();
    let tot_staked = util::get_token_amount(
        deps.querier,
        Denom::Cw20(cfg.stake_token_address.clone()),
        env.contract.address.clone(),
    )?;

    if tot_staked < staked_amount {
        return Err(ContractError::NotEnoughStake {});
    }
    
    staker_info.amount = Uint128::zero();

    STAKERS.save(deps.storage, info.sender.clone(), &staker_info)?;

    CONFIG.update(deps.storage, |mut exists| -> StdResult<_> {
        exists.total_staked -= staked_amount;
        Ok(exists)
    })?;

    let msg = util::transfer_token_message(
        Denom::Cw20(cfg.stake_token_address.clone()),
        staked_amount,
        info.sender.clone(),
    )?;

    return Ok(Response::new().add_message(msg).add_attributes(vec![
        attr("action", "unstake amount"),
        attr("address", info.sender.clone()),
        attr("staked_amount", Uint128::from(staked_amount)),
    ]));
}

///////////////////////////////////////////////////////// this func is called for checking ownership//////////////////////////////////
///
///         Owner is set when contract is instantiated.
///         Using this function, we can authorize the ownership
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn check_owner(deps: &DepsMut, info: &MessageInfo) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;

    if info.sender != cfg.owner {
        return Err(ContractError::Unauthorized {});
    }
    Ok(Response::new().add_attribute("action", "check_owner"))
}

///////////////////////////////////////////////////////// this func is called for updating the ownership//////////////////////////////////
///
///         Owner is set when contract is instantiated.
///         if changing ownership is needed, we can use this function.
///         input params: new owner(new walletaddress)
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

pub fn execute_update_owner(
    deps: DepsMut,
    info: MessageInfo,
    owner: Addr,
) -> Result<Response, ContractError> {
    // authorize owner
    check_owner(&deps, &info)?;

    CONFIG.update(deps.storage, |mut exists| -> StdResult<_> {
        exists.owner = owner;
        Ok(exists)
    })?;
    Ok(Response::new().add_attribute("action", "update_owner"))
}

pub fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    daily_return: u64,
) -> Result<Response, ContractError> {
    // authorize owner
    check_owner(&deps, &info)?;

    CONFIG.update(deps.storage, |mut exists| -> StdResult<_> {
        exists.daily_return = daily_return;
        Ok(exists)
    })?;
    Ok(Response::new().add_attribute("action", "update_config"))
}

///////////////////////////////////////////////////////// this func is called for withdrawing reward //////////////////////////////////
///
///         If withdrawing the reward tokens is needed, this function is used.
///         Only owner can call this function
///         input pararms: the reward token amount of withdrawing
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

pub fn execute_withdraw_reward(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> Result<Response, ContractError> {
    check_owner(&deps, &info)?;

    let cfg = CONFIG.load(deps.storage)?;

    let tot = util::get_token_amount(
        deps.querier,
        Denom::Cw20(cfg.stake_token_address.clone()),
        env.contract.address.clone(),
    )?;

    if tot < amount {
        return Err(ContractError::NotEnoughReward {});
    }

    let msg = util::transfer_token_message(
        Denom::Cw20(cfg.stake_token_address.clone()),
        amount,
        info.sender.clone(),
    )?;

    return Ok(Response::new().add_message(msg).add_attributes(vec![
        attr("action", "withdraw_reward"),
        attr("address", info.sender.clone()),
        attr("amount", amount),
    ]));
}
///////////////////////////////////////////////////////// this func is called for withdrawing the staked token //////////////////////////////////
///
///         Only owner can call this function
///         input pararms: the withdraw amount
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn execute_withdraw_stake(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    amount: Uint128,
) -> Result<Response, ContractError> {
    check_owner(&deps, &info)?;

    let cfg = CONFIG.load(deps.storage)?;

    let tot = util::get_token_amount(
        deps.querier,
        Denom::Cw20(cfg.stake_token_address.clone()),
        env.contract.address.clone(),
    )?;

    if tot < amount {
        return Err(ContractError::NotEnoughStake {});
    }

    let msg = util::transfer_token_message(
        Denom::Cw20(cfg.stake_token_address.clone()),
        amount,
        info.sender.clone(),
    )?;

    return Ok(Response::new().add_message(msg).add_attributes(vec![
        attr("action", "withdraw_stake"),
        attr("address", info.sender.clone()),
        attr("amount", amount),
    ]));
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_binary(&query_config(deps)?),
        QueryMsg::Staker { address } => to_binary(&query_staker(deps, address)?),
    }
}
///////////////////////////////////////////////////////// this func is called for getting the state of the contract  //////////////////////////////////
///
///         
///         Using this function, we can get the contract informatios such as owner, reward token denom, stake token address,
///         reward interval, artists, burn, charity address for reward, enable state.
///          
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
pub fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let cfg = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        owner: cfg.owner,
        stake_token_address: cfg.stake_token_address.into(),
        daily_return: cfg.daily_return,
        total_staked: cfg.total_staked
    })
}

///////////////////////////////////////////////////////// this func is called for getting the informations of stakers  //////////////////////////////////
///
///         
///         Using this function, we can get anybody's all staking informations.
///         input params: contract address or wallet address
///     
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

fn map_staker(item: StdResult<(Addr, StakerInfo)>) -> StdResult<StakerInfo> {
    item.map(|(_id, record)| record)
}

fn query_staker(deps: Deps, address: Addr) -> StdResult<StakerResponse> {
    let staker_info = STAKERS
                .load(deps.storage, address.clone())
                .unwrap_or(StakerInfo {
                    address: address.clone(),
                    amount: Uint128::zero(),
                    reward: Uint128::zero(),
                    last_time: 0
                });
    let mut total = Uint128::zero();
    
    Ok(StakerResponse {
        amount: staker_info.amount,
        reward: staker_info.reward
    })
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    let version = get_contract_version(deps.storage)?;
    if version.contract != CONTRACT_NAME {
        return Err(ContractError::CannotMigrate {
            previous_contract: version.contract,
        });
    }
    Ok(Response::default())
}
