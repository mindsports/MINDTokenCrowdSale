//return;
var MINDTokenPreSale = artifacts.require("./MINDTokenPreSale.sol");
var MINDTokenCrowdSale = artifacts.require("./MINDTokenCrowdSale.sol");
var MINDToken = artifacts.require("./MINDToken.sol");
var BigNumber = require('bignumber.js');

var expectThrow = async function(promise) {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(
      invalidOpcode || invalidJump || outOfGas || revert,
      "Expected throw, got '" + error + "' instead",
    );
    return;
  }
  assert.fail('Expected throw not received');
};


contract('Buy token sale', function(accounts) {
	// account setting ----------------------------------------------------------------------
	var admin = accounts[0];
	var foundationWallet = accounts[1];
	var fullTokenWallet = accounts[2];
	var vestingWallet = accounts[3];

	var randomGuy1 = accounts[4];
	var randomGuy2 = accounts[5];
	var randomGuy3 = accounts[6];
	var randomGuy4 = accounts[7];
	var randomGuy5 = accounts[8];
	var randomGuy6 = accounts[9];

	// tool const ----------------------------------------------------------------------------
	const day = 60 * 60 * 24 * 1000;
	const dayInSecond = 60 * 60 * 24;
	const second = 1000;
	const gasPriceMax = 50000000000;

	// crowdsale setting ---------------------------------------------------------------------
	const name = "MIND Token";
	const symbol = "MIND";
	const decimals = 18;
	const amountTokenSupply = 50000000;
	const rateETHMIND = 10000;
	// translate with decimal for solitidy
	const amountTokenSupplySolidity = (new BigNumber(10).pow(decimals)).mul(amountTokenSupply);
	const capCrowdsaleInETH = 10000;
	// setting in wei for solidity
	const capCrowdsaleInWei = web3.toWei(capCrowdsaleInETH, "ether");

	// Token initialy distributed for crowdsale.
	const CROWDSALE_AMOUNT = 15000000;

	// Token initialy distributed for the team (15%)
	const TEAM_VESTING_WALLET = vestingWallet;
	const TEAM_VESTING_AMOUNT = 7500000;

	// Token initialy distributed for the full token (20%)
	const FULL_TOKEN_WALLET = fullTokenWallet;
	const FULL_TOKEN_AMOUNT = 20000000;

	// Token initialy distributed for the early foundation (15%)
	// wallet use also to gather the ether of the token sale
	const MIND_FOUNDATION_WALLET = foundationWallet;
	const MIND_FOUNDATION_AMOUNT = 7500000;

    // variable to host contracts ------------------------------------------------------------
    var mindTokenPreSale;
	var mindTokenCrowdSale;
	var mindToken;

	beforeEach(async () => {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeSolidity = currentTimeStamp + 2*dayInSecond;
		const endTimeSolidity 	= startTimeSolidity + 31*dayInSecond;

		// create de presale
		mindTokenPreSale = await MINDTokenPreSale.new(startTimeSolidity, endTimeSolidity,{gas: 100000000});

		// retrieve the Token itself
		mindToken = await MINDToken.at(await mindTokenPreSale.token.call());

		const crowdSaleStartTime = endTimeSolidity + 5*dayInSecond;
		const crowdSaleEndTime = crowdSaleStartTime + 9*dayInSecond;
		// create de crowdsale
		mindTokenCrowdSale = await MINDTokenCrowdSale.new(crowdSaleStartTime, crowdSaleEndTime, await mindTokenPreSale.token.call() );
		r = await mindToken.transfer (await mindTokenCrowdSale.address, 20000000e18, {from: fullTokenWallet});
		assert ( ( new BigNumber(0) ).equals(await mindToken.balanceOf(fullTokenWallet)), "Non zero token");
		assert ( ( new BigNumber(10).pow(18).mul(20000000) ).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "Non zero token");
	});

	it("buy token ", async function() {
		addsDayOnEVM(38);
		var walletBalanceEthBefore = await web3.eth.getBalance(foundationWallet);
		var weiSpend = web3.toWei(2, "ether");

		// First Day
		// buy token within cap should work	
		var r = await mindTokenCrowdSale.sendTransaction({from:randomGuy1, value:weiSpend, gasPrice:gasPriceMax});
		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy1, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND+4000e18), "amount is wrong");

		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(24000).equals(await mindToken.balanceOf(randomGuy1)), "randomGuy1 balance");
		assert((new BigNumber(10).pow(18)).mul(20000000-24000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 1");

		// buy token within cap should work	
		r = await mindTokenCrowdSale.sendTransaction({from:randomGuy1, value:weiSpend, gasPrice:gasPriceMax});

		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy1, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND+4000e18), "amount is wrong");
		
		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(48000).equals(await mindToken.balanceOf(randomGuy1)), "randomGuy1 balance");
		assert((new BigNumber(10).pow(18)).mul(20000000-48000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 2");

		// Second Day
		// buy token after pre sale open by one day
		addsDayOnEVM(1);
		r = await mindTokenCrowdSale.sendTransaction({from:randomGuy3,value:weiSpend, gasPrice: gasPriceMax});

		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy3, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND+3000e18), "amount is wrong");

		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(23000).equals(await mindToken.balanceOf(randomGuy3)), "randomGuy3 balance");
		assert((new BigNumber(10).pow(18)).mul(19952000-23000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).add(weiSpend).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 3");

		// Third day
		addsDayOnEVM(1);
		r = await mindTokenCrowdSale.sendTransaction({from:randomGuy4,value:weiSpend, gasPrice: gasPriceMax});

		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy4, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND+2000e18), "amount is wrong");

		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(22000).equals(await mindToken.balanceOf(randomGuy4)), "randomGuy4 balance");
		assert((new BigNumber(10).pow(18)).mul(19929000-22000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 4");

		// Forth day
		addsDayOnEVM(1);
		r = await mindTokenCrowdSale.sendTransaction({from:randomGuy5,value:weiSpend, gasPrice: gasPriceMax});

		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy5, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND+1000e18), "amount is wrong");

		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(21000).equals(await mindToken.balanceOf(randomGuy5)), "randomGuy5 balance");
		assert((new BigNumber(10).pow(18)).mul(19907000-21000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 5");

		// Fifth day
		addsDayOnEVM(1);
		r = await mindTokenCrowdSale.sendTransaction({from:randomGuy6,value:weiSpend, gasPrice: gasPriceMax});

		assert.equal(r.logs[0].event, 'TokenPurchase', "event is wrong");
		assert.equal(r.logs[0].args.purchaser, randomGuy6, "purchaser is wrong");
		assert(r.logs[0].args.value.equals(weiSpend), "value is wrong");
		assert(r.logs[0].args.amount.equals(weiSpend*rateETHMIND), "amount is wrong");

		// check token arrived on buyer
		assert((new BigNumber(10).pow(18)).mul(20000).equals(await mindToken.balanceOf(randomGuy6)), "randomGuy6 balance");
		assert((new BigNumber(10).pow(18)).mul(19886000-20000).equals(await mindToken.balanceOf(mindTokenCrowdSale.address)), "mindTokenCrowdSale.address balance");
		// check money arrived :
		assert((new BigNumber(walletBalanceEthBefore)).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).add(weiSpend).equals(await web3.eth.getBalance(foundationWallet)), "foundationWallet eth balance 6");
	});

	it("buy token impossible", async function() {
		addsDayOnEVM(39);
		var weiSpend = web3.toWei(2, "ether");

		// Buy 0 token	opcode
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:0, gasPrice:gasPriceMax}));

		// gas price more than 50Gwei	opcode
		//await expectThrow(mindTokenPreSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax+1}));
	});

	it("buy before sale start => opcode", async function() {
		var weiSpend = web3.toWei(2, "ether");

		addsDayOnEVM(36);
		// buy before sale start 2days before => opcode
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax}));
		
		addsDayOnEVM(1);
		// buy before sale start 1day before => opcode
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax}));
	});

	it("buy after sale end => opcode", async function() {
		// pass the last day
		addsDayOnEVM(47);
		var weiSpend = web3.toWei(2, "ether");

		// buy after sale end => opcode
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax}));
	});

	it("buy overpass total Hard cap => opcode", async function() {
		
		// pass all bonus day
		addsDayOnEVM(42);
		
		var weiSpend1 = web3.toWei(1, "ether");
		var weiSpend2000ether = web3.toWei(2000, "ether");
		
		await mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:weiSpend2000ether, gasPrice:gasPriceMax});

		assert((new BigNumber(10).pow(18)).mul(20000000).equals(await mindToken.balanceOf(randomGuy1)), "randomGuy1 balance");
		// buy overpass total Hard cap => opcode
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy2,value:weiSpend1, gasPrice:gasPriceMax}));
	});

	it("buy too less", async function() {
		
		// pass all bonus day
		addsDayOnEVM(42);
		
		var weiSpend = web3.toWei(0.09, "ether");
		
		await expectThrow(mindTokenCrowdSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax}));

		var weiSpendleast = web3.toWei(0.1, "ether");
		
		await mindTokenCrowdSale.sendTransaction({from:randomGuy1, value:weiSpendleast, gasPrice:gasPriceMax});

		assert((new BigNumber(10).pow(18)).mul(1000).equals(await mindToken.balanceOf(randomGuy1)), "randomGuy1 balance");
	});


	var addsDayOnEVM = async function(days) {
		var daysInsecond = 60 * 60 * 24 * days 
		var currentBlockTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [daysInsecond], id: 0});
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
	}


});


