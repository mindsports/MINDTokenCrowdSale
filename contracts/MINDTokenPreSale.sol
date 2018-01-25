pragma solidity ^0.4.15;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./base/token/StandardToken.sol";
import "./MINDToken.sol";

/**
 * @title MINDTokenPreSale
 * @dev 
 * We add new features to a base crowdsale using multiple inheritance.
 * We are using the following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 *
 * The code is based on the contracts of Open Zeppelin and we add our contracts : MINDTokenPreSale and the MIND Token
 *
 */
contract MINDTokenPreSale is Ownable, CappedCrowdsale {
    // hard cap of the token pre-sale in ether
    uint private constant HARD_CAP_IN_WEI = 10000 ether;

    // Total of MIND Token supply
    uint public constant TOTAL_MIND_TOKEN_SUPPLY = 50000000;

    // Token sale rate from ETH to MIND
    uint private constant RATE_ETH_MIND = 1000;

    // Token initialy distributed for the team (15%)
    address public constant TEAM_VESTING_WALLET = 0x08975687bc850a7c9af8b41803dd83e6123d6a6a;
    uint public constant TEAM_VESTING_AMOUNT = 7500000e18;

    // Token initialy distributed for the full token sale (20%)
    address public constant FULL_TOKEN_WALLET = 0x02ace26b98caa5d5e1cb163c5c99c0ba56879c10;
    uint public constant FULL_TOKEN_AMOUNT = 20000000e18;

    // Token initialy distributed for the early foundation (15%)
    // wallet use also to gather the ether of the token sale
    address private constant MIND_FOUNDATION_WALLET = 0x67141256f4af8da3e12a094a5d553f9f8aee88ab;
    uint public constant MIND_FOUNDATION_AMOUNT = 7500000e18;

    // PERIOD WHEN TOKEN IS NOT TRANSFERABLE AFTER THE SALE
    uint public constant PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC = 3 days;

    event PreSaleTokenSoldout();

    function MINDTokenPreSale(uint256 _startTime, uint256 _endTime)
      CappedCrowdsale(HARD_CAP_IN_WEI)
      StandardCrowdsale(_startTime, _endTime, RATE_ETH_MIND, MIND_FOUNDATION_WALLET)
    {
        
        token.transfer(TEAM_VESTING_WALLET, TEAM_VESTING_AMOUNT);

        token.transfer(FULL_TOKEN_WALLET, FULL_TOKEN_AMOUNT);

        token.transfer(MIND_FOUNDATION_WALLET, MIND_FOUNDATION_AMOUNT);
        
    }

    /**
     * @dev Create the MIND token (override createTokenContract of StandardCrowdsale)
     * @return the StandardToken created
     */
    function createTokenContract () 
      internal 
      returns(StandardToken) 
    {
        return new MINDToken(TOTAL_MIND_TOKEN_SUPPLY, endTime.add(PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC), MIND_FOUNDATION_WALLET, FULL_TOKEN_WALLET);
    }

    /**
      * @dev Get the bonus based on the buy time (override getBonus of StandardCrowdsale)
      * @return the number of bonus token
    */
    function getBonus(uint256 _tokens) constant returns (uint256 bonus) {
        require(_tokens != 0);
        if (startTime <= now && now < startTime + 1 days) {
            return _tokens.div(2);
        } else if (startTime + 1 days <= now && now < startTime + 2 days ) {
            return _tokens.div(4);
        } else if (startTime + 2 days <= now && now < startTime + 3 days ) {
            return _tokens.div(10);
        }

        return 0;
    }

    /**
     * @dev Transfer the unsold tokens to the MIND Foundation multisign wallet 
     * @dev Only for owner
     * @return the StandardToken created
     */
    function drainRemainingToken () 
      public
      onlyOwner
    {
        require(hasEnded());
        token.transfer(MIND_FOUNDATION_WALLET, token.balanceOf(this));
    }


    /**
      * @dev Action after buying tokens: check if all sold out and enable transfer immediately
      */
    function postBuyTokens ()
        internal
    {
        if ( weiRaised >= HARD_CAP_IN_WEI ) 
        {
            MINDToken mindToken = MINDToken (token);
            mindToken.enableTransferEarlier();
            PreSaleTokenSoldout();
        }
    }
}
  
