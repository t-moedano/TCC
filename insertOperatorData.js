'use strict';
/*
* Copyright IBM Corp All Rights Reserved
* SPDX-License-Identifier: Apache-2.0
* Thauany Moedano
*/

var FabricClient = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');


var fabricClient = new FabricClient();


var channel = fabricClient.newChannel('mychannel');
var peer = fabricClient.newPeer('grpc://localhost:7051');
channel.addPeer(peer);
var order = fabricClient.newOrderer('grpc://localhost:7050')
channel.addOrderer(order);


var memberUser = null;
var storePath = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+storePath);
var transactionId = null;

var readlineSync = require('readline-sync');

var username  = readlineSync.question('Type the username again: ');
var secret = readlineSync.question('Type the secret: ');
var name = readlineSync.question('Type your first name: ');
var lastName = readlineSync.question('Type your last name: ');
var id = readlineSync.question('Type your id: ');
var rule = readlineSync.question('Type the rule code: ');



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
      memberUser = userFromStore;
    } 
    else 
    {
      throw new Error(username + 'not registered on the ledger. Run RegisterUser.js');
    }


    transactionId = fabricClient.newTransactionID();
    console.log("transaction id: ", transactionId._transaction_id);

    
    var request = 
    {
      chaincodeId: 'fabcar',
      fcn: 'insertOperatorData',
      args: [username, secret, name, lastName, id, rule],
      chainId: 'mychannel',
      txId: transactionId
    };

    return channel.sendTransactionProposal(request);
  }).then((results) => 
  {
    var proposalResponses = results[0];
    var proposal = results[1];
    let isProposalGood = false;
    if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) 
    {
      isProposalGood = true;
      console.log('Proposal successfully sent');
    } else {
      console.error('Proposal failed');
    }
    if (isProposalGood) 
    {
      console.log(util.format('Proposal sent! Response:  Status - %s, message - "%s"',
                  proposalResponses[0].response.status, proposalResponses[0].response.message));

      var request = 
      {
        proposalResponses: proposalResponses,
        proposal: proposal
      };

      var transactionIdString = transactionId.getTransactionID(); //Get the transaction ID string to be used by the event processing
      var promises = [];

      var sendPromise = channel.sendTransaction(request);
      promises.push(sendPromise);

      var eventHub = channel.newChannelEventHub(peer);
      let txPromise = new Promise((resolve, reject) => 
      {
        let handle = setTimeout(() => 
        {
          eventHub.disconnect();
          resolve({eventStatus : 'TIMEOUT'});
        }, 3000);
        eventHub.connect();
        eventHub.registerTxEvent(transactionIdString, (tx, code) => 
        {
          clearTimeout(handle);
          eventHub.unregisterTxEvent(transactionIdString);
          eventHub.disconnect();

          var returnStatus = {eventStatus : code, transactionId : transactionIdString};
          if (code !== 'VALID') 
          {
            console.error('The transaction was invalid, code = ' + code);
            resolve(returnStatus); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
          } 
          else 
          {
            console.log('The transaction has been committed on peer ' + eventHub.getName());
            resolve(returnStatus);
          }
        }, 
        (err) => 
        {
          reject(new Error('Event hub error ::'+err));
        });
      });
      promises.push(txPromise);
      return Promise.all(promises);
    } 
    else 
    {
      console.error('Failed on persistence. Exiting...');
      throw new Error('Failed on persistence. Exiting...');
    }
  }).then((results) => 
  {
    if (results && results[0] && results[0].status === 'SUCCESS') 
    {
      console.log('Transaction sent to orderer.');
    } 
    else 
    {
      console.error('Failed to sent transaction to the orderer: ' + results[0].status);
    }

    if(results && results[1] && results[1].eventStatus === 'VALID') 
    {
      console.log('Successfully committed the change to the ledger by the peer');
    } 
    else 
    {
      console.log('Fail on commit. Error: ::'+results[1].eventStatus);
    }
  }).catch((err) => 
  {
    console.error('Falha ao invocar a transação :: ' + err);
  });
