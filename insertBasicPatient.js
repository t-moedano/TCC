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

var username = process.env.USERNAME
console.log('Type patient information');
var name = readlineSync.question('Full name: ');
var address = readlineSync.question('Address: ');
var zipcode = readlineSync.question('Zipcode: ');
var tel = readlineSync.question('Contact tel: ');
var healthcard = readlineSync.question('Health Card: ');
var id = readlineSync.question('Id: ');

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
      throw new Error(username + 'não registered.');
    }


    transactionId = fabricClient.newTransactionID();
    console.log("Transaction id: ", transactionId._transaction_id);

    var request = 
    {
      chaincodeId: 'fabcar',
      fcn: 'insertBasicPatientData',
      args: [name, address, zipcode, tel, healthcard, id],
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
      console.log('Proposal sent');
    } else 
    {
      console.error('Proposal failed');
    }
    if (isProposalGood) 
    {
      console.log(util.format('Proposal sent. Response: Status - %s, message - "%s"',
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
          reject(new Error('Event Hub Error ::'+err));
        });
      });
      promises.push(txPromise);
      return Promise.all(promises);
    } 
    else 
    {
      console.error('Failed to persist. Exiting...');
      throw new Error('Failed to persist. Exiting...');
    }
  }).then((results) => 
  {
    console.log('Completed');
    if (results && results[0] && results[0].status === 'SUCCESS') 
    {
      console.log('Transaction sent to the orderer.');
    } 
    else 
    {
      console.error('Fail to send transaction: ' + results[0].status);
    }

    if(results && results[1] && results[1].eventStatus === 'VALID') 
    {
      console.log('Successfully committed the change to the ledger by the peer');
    } 
    else 
    {
      console.log('Transaction failed. Error: ::'+results[1].eventStatus);
    }
  }).catch((err) => 
  {
    console.error('Fail to invoke transaction :: ' + err);
  });
