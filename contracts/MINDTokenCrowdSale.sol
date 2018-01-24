pragma solidity ^0.4.15;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./base/token/StandardToken.sol";
import "./MINDToken.sol";

/**
 * @title MINDTokenCrowdSale
 * @dev 
 * We add new features to a base crowdsale using multiple inheritance.
 * We are using the following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 *
 * The code is based on the contracts of Open Zeppelin and we add our contracts : MINDTokenCrowdSale and the MIND Token
 *
 */
contract MINDTokenCrowdSale is Ownable, CappedCrowdsale {

    // hard cap of the token pre-sale in ether
    uint private constant HARD_CAP_IN_WEI = 2000 ether;
    
    // Token sale rate from ETH to MIND
    uint private constant RATE_ETH_MIND = 10000;

    // wallet use also to gather the ether of the token sale
    address private constant MIND_CROWDSALE_WALLET = 0x942b56E5A6e92B39643dCB5F232EF583680F0B01;

    event CrowdSaleTokenSoldout();

    function MINDTokenCrowdSale(uint256 _startTime, uint256 _endTime, address _tokenAddr)
      CappedCrowdsale(HARD_CAP_IN_WEI)
      StandardCrowdsale(_startTime, _endTime, RATE_ETH_MIND, MIND_CROWDSALE_WALLET)
    {
        token = MINDToken(_tokenAddr);
    }

    /**
     * @dev Create the MIND token (override createTokenContract of StandardCrowdsale)
     * @return the StandardToken created
     */
    function createTokenContract () 
      internal 
      returns(StandardToken) 
    {
        return MINDToken(0x0); // No token is created
    }

    /**
      * @dev Get the bonus based on the buy time (override getBonus of StandardCrowdsale)
      * @return the number of bonus token
    */
    function getBonus(uint256 _tokens) constant returns (uint256 bonus) {
        require(_tokens != 0);
        if (startTime <= now && now < startTime + 1 days) {
            // 20% bonus
            return _tokens.div(5);
        } else if (startTime + 1 days <= now && now < startTime + 2 days ) {
            // 15% bonus
            return _tokens.mul(3).div(20);
        } else if (startTime + 2 days <= now && now < startTime + 3 days ) {
            // 10% bonus
            return _tokens.div(10);
        } else if (startTime + 3 days <= now && now < startTime + 4 days ) {
            // 5% bonus
            return _tokens.div(20);
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
        token.transfer(MIND_CROWDSALE_WALLET, token.balanceOf(this));
    }


    /**
      * @dev Action after buying tokens: check if all sold out and enable transfer immediately
      */
    function postBuyTokens ()
        internal
    {
        if ( token.balanceOf(this) == 0 ) 
        {
            CrowdSaleTokenSoldout();
        }
    }
}
