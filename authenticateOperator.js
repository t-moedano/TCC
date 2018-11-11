'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
* Thauany Moedano
*/
/*
 * 
 */

var FabricClient = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

var fabricClient = new FabricClient();

var channel = fabricClient.newChannel('mychannel');
var peer = fabricClient.newPeer('grpc://localhost:7051');
channel.addPeer(peer);

var memberUser = null;
var storePath = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+storePath);
var transactionId = null;
var readlineSync = require('readline-sync');
var username = process.env.USERNAME;
var rule = process.env.RULE;
var secret = readlineSync.question('Type password: ');

console.log("username: " + username);
console.log("rule " + rule);

FabricClient.newDefaultKeyValueStore({ path: storePath })
  .then((stateStore) => 
  {
    fabricClient.setStateStore(stateStore);
    var cryptoSuite = FabricClient.newCryptoSuite();
    var cryptoStore = FabricClient.newCryptoKeyStore({path: storePath});
    cryptoSuite.setCryptoKeyStore(cryptoStore);
    fabricClient.setCryptoSuite(cryptoSuite);

    return fabricClient.getUserContext(username, true);
  }).then((userFromStore) => 
  {
    if (userFromStore && userFromStore.isEnrolled()) 
    {
      console.log(username + 'loaded');
    } 
    else 
    {
      throw new Error(username + 'not found');
    }

    const request = 
    {
      chaincodeId: 'fabcar',
      fcn: 'authenticateOperator',
      args: [username, secret, rule]
    };

    return channel.queryByChaincode(request);
  }).then((query_responses) => 
  {
    console.log("Results:");
    if (query_responses && query_responses.length == 1) 
    {
      if (query_responses[0] instanceof Error) 
      {
        console.error("Error = ", query_responses[0]);
      }
      else 
      {
        console.log("LOGGED Response: ", query_responses[0].toString());
      }
    } 
    else 
    {
      console.log(username + "not found");
    }
  })
  .catch((err) => 
  {
    console.error('Failed to query successfully :: ' + err);
  });
