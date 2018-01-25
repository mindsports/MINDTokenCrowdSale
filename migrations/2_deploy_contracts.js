var MINDTokenPreSale = artifacts.require("./MINDTokenPreSale.sol");
var MINDTokenCrowdSale = artifacts.require("./MINDTokenCrowdSale.sol");

// Copy & Paste this
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }


var tokenSaleContract;

module.exports = function(deployer) {
    var publicSaleStartTime = new Date("Thu, 25 Jan 2018 07:00:00 GMT").getUnixTime();
    var publicSaleEndTime = new Date("Fri, 2 Feb 2018 07:00:00 GMT").getUnixTime();

	console.log( "#################################################################################");
	console.log( "publicSaleStartTime : "+publicSaleStartTime);
	console.log( "publicSaleStartTime : "+new Date(publicSaleStartTime*1000));
	console.log( "publicSaleEndTime : "+publicSaleEndTime);
	console.log( "publicSaleEndTime : "+new Date(publicSaleEndTime*1000));
	console.log( "#################################################################################");
	
    return MINDTokenPreSale.new(publicSaleStartTime, publicSaleEndTime, {gas: 4000000000}).then(function(result){
        tokenSaleContract = result;
        console.log("MINDTokenPreSale: "+tokenSaleContract.address);
        tokenSaleContract.token.call().then(function(tokenAddr, err){
        
	        var publicSaleStartTime = new Date("Mon, 05 Feb 2018 15:00:00 GMT").getUnixTime();
		    var publicSaleEndTime = new Date("Wed, 14 Feb 2018 15:00:00 GMT").getUnixTime();

			console.log( "#################################################################################");
			console.log( "MINDToken Addr: " + tokenAddr );
			console.log( "publicSaleStartTime : "+publicSaleStartTime);
			console.log( "publicSaleStartTime : "+new Date(publicSaleStartTime*1000));
			console.log( "publicSaleEndTime : "+publicSaleEndTime);
			console.log( "publicSaleEndTime : "+new Date(publicSaleEndTime*1000));
			console.log( "#################################################################################");
			
		    return MINDTokenCrowdSale.new(
		    		publicSaleStartTime, publicSaleEndTime, tokenAddr, 
		    		{gas: 4000000000}).then(function(result){
				        tokenSaleContract = result;
				        console.log("MINDTokenCrowdSale: "+ result.address);
				        result.token.call().then(function (res,err){
				        	console.log("MINDToken: "+ res);
				        });
		    		}).catch(
		    			function(err){
		    				console.log(err);
		    			}
			    	);
        });
    });
};
