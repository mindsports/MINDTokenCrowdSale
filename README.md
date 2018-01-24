# MIND Token CrowdSale
In this document, we describe the token sale specification and implementation,
and give an overview over the smart contracts structure.

## Informal Specification

* CrowdSale Supply: 20,000,000 MIND
* Pricing: 1 ETH = 10000 MIND
* HardCap: 2000 ETH
* SoftCap: 200 ETH
* Bonus: 20% first 24 hours and decrease 5% every day
* Start Date: Feb 5 3pm UTC
* End Date:  Feb 14 3pm UTC

## Detailed description

### Overview of the CrowdSale Flow
Let T = Feb 5 3pm UTC
1. On T - 12 we deploy `MINDTokenCrowdSale.sol`
2. On T the sale starts. At this point users can participate.
3. On T + 10 days or when token sale is over. We will burn all unsold tokens.


### Per module description
The system has 2 modules : the token crowdsale (MINDTokenCrowdSale.sol) and the token (MINDToken.sol)

#### The token crowdsale (MINDTokenCrowdSale.sol)
Implemented in `MINDTokenCrowdSale.sol`.

It inherits from `StandardCrowdsale.sol` by Open Zeppelin with small changes providing the basic check for the token sale
It inherits from `CappedCrowdsale.sol` by Open Zeppelin providing the hard cap
It uses `SafeMath.sol` by Open Zeppelin

#### The token (MINDToken.sol)
Implemented in `MINDToken.sol`.
It inherits from `StandardToken.sol` by Open Zeppelin (ERC20 standard token)
It inherits from `Ownable.sol` by Open Zeppelin
It uses `SafeMath.sol` by Open Zeppelin

The token is fully compatible with ERC20 standard, with a draining function additions:
1. A draining function (for ERC20 tokens), in case of emergency

### Test

1. Install the truffle
```
$ npm install -g truffle
```

2. Install the ethereum-testrpc
```
$ npm install -g ethereum-testrpc
```

3. Launch the testrpc
```
$ bash ./launchTestrpc.sh
```

4. Deploy the contract
```
$ truffle migrate
```

5. Test the contract
```
$ truffle test *test_file_path*
```

### Deploy Contract

```
$ node deployContract.js
```