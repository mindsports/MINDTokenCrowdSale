pragma solidity ^0.4.15;

import './base/token/StandardToken.sol';
import './base/ownership/Ownable.sol';

/**
 * @title The MINDToken contract
 * @dev The MINDToken Token contract
 * @dev inherite from StandardToken and Ownable by Zeppelin
 */
contract MINDToken is StandardToken, Ownable {
    string  public  constant name = "MIND Token";
    string  public  constant symbol = "MIND";
    uint8    public  constant decimals = 18;

    uint    public  transferableStartTime;

    address public  tokenSaleContract;
    address public  fullTokenWallet;

    function gettransferableStartTime() constant returns (uint){return now - transferableStartTime;}

    modifier onlyWhenTransferEnabled() 
    {
        if ( now < transferableStartTime ) {
            require(msg.sender == tokenSaleContract || msg.sender == fullTokenWallet || msg.sender == owner);
        }
        _;
    }

    modifier validDestination(address to) 
    {
        require(to != address(this));
        _;
    }

    modifier onlySaleContract()
    {
        require(msg.sender == tokenSaleContract);
        _;
    }

    function MINDToken(
        uint tokenTotalAmount, 
        uint _transferableStartTime, 
        address _admin, 
        address _fullTokenWallet) 
    {
        
        // Mint all tokens. Then disable minting forever.
        totalSupply = tokenTotalAmount * (10 ** uint256(decimals));

        balances[msg.sender] = totalSupply;
        Transfer(address(0x0), msg.sender, totalSupply);

        transferableStartTime = _transferableStartTime;
        tokenSaleContract = msg.sender;
        fullTokenWallet = _fullTokenWallet;

        transferOwnership(_admin); // admin could drain tokens and eth that were sent here by mistake

    }

    /**
     * @dev override transfer token for a specified address to add onlyWhenTransferEnabled and validDestination
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transfer(address _to, uint _value)
        public
        validDestination(_to)
        onlyWhenTransferEnabled
        returns (bool) 
    {
        return super.transfer(_to, _value);
    }

    /**
     * @dev override transferFrom token for a specified address to add onlyWhenTransferEnabled and validDestination
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transferFrom(address _from, address _to, uint _value)
        public
        validDestination(_to)
        onlyWhenTransferEnabled
        returns (bool) 
    {
        return super.transferFrom(_from, _to, _value);
    }

    event Burn(address indexed _burner, uint _value);

    /**
     * @dev burn tokens
     * @param _value The amount to be burned.
     * @return always true (necessary in case of override)
     */
    function burn(uint _value) 
        public
        onlyWhenTransferEnabled
        onlyOwner
        returns (bool)
    {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(msg.sender, _value);
        Transfer(msg.sender, address(0x0), _value);
        return true;
    }

    /**
     * @dev burn tokens in the behalf of someone
     * @param _from The address of the owner of the token.
     * @param _value The amount to be burned.
     * @return always true (necessary in case of override)
     */
    function burnFrom(address _from, uint256 _value) 
        public
        onlyWhenTransferEnabled
        onlyOwner
        returns(bool) 
    {
        assert(transferFrom(_from, msg.sender, _value));
        return burn(_value);
    }

    /** 
    * enable transfer earlier (only presale contract can enable the sale earlier)
    */
    function enableTransferEarlier ()
        public
        onlySaleContract
    {
        transferableStartTime = now + 3 days;
    }


    /**
     * @dev transfer to owner any tokens send by mistake on this contracts
     * @param token The address of the token to transfer.
     * @param amount The amount to be transfered.
     */
    function emergencyERC20Drain(ERC20 token, uint amount )
        public
        onlyOwner 
    {
        token.transfer(owner, amount);
    }

}
