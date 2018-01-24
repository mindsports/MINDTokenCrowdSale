pragma solidity ^0.4.15;

import './base/token/StandardToken.sol';
import './base/math/SafeMath.sol';

/**
 * @title StandardCrowdsale 
 * @dev StandardCrowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract StandardCrowdsale {
    using SafeMath for uint256;

    // The token being sold
    StandardToken public token; 

    // start and end timestamps where investments are allowed (both inclusive)
    uint256 public startTime;
    uint256 public endTime;

    // address where funds are collected
    address public wallet;

    // how many token units a buyer gets per wei
    uint256 public rate;

    // amount of raised money in wei
    uint256 public weiRaised;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, uint256 value, uint256 amount);

    function StandardCrowdsale(
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _rate, 
        address _wallet) 
    {
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_rate > 0);
        require(_wallet != 0x0);

        startTime = _startTime;
        endTime = _endTime;
        rate = _rate;
        wallet = _wallet;
        
        token = createTokenContract(); 
    }

    // creates the token to be sold.
    // override this method to have crowdsale of a specific mintable token.
    function createTokenContract() 
        internal 
        returns(StandardToken) 
    {
        return new StandardToken();
    }

    // fallback function can be used to buy tokens
    function () 
       payable 
    {
        buyTokens();
    }

    // low level token purchase function
    function buyTokens() 
       public 
       payable 
    {
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);
        tokens += getBonus(tokens);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        require(token.transfer(msg.sender, tokens)); 
        TokenPurchase(msg.sender, weiAmount, tokens);

        forwardFunds();

        postBuyTokens();
    }

    // Action after buying tokens
    function postBuyTokens ()
        internal
    {
    }

    // send ether to the fund collection wallet
    // override to create custom fund forwarding mechanisms
    function forwardFunds() 
       internal 
    {
        wallet.transfer(msg.value);
    }

    // @return true if the transaction can buy tokens
    function validPurchase() 
        internal 
        returns(bool) 
    {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        return withinPeriod && nonZeroPurchase;
    }

    // @return true if crowdsale event has ended
    function hasEnded() 
        public 
        constant 
        returns(bool) 
    {
        return now > endTime;
    }

    modifier onlyBeforeSale() {
        require(now < startTime);
        _;
    }

    modifier only24HBeforeSale() {
        require(now < startTime.sub(1 days));
        _;
    }

    function getBonus(uint256 _tokens) constant returns (uint256 bonus) {
        return 0;
    }
}
