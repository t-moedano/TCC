'use strict';
/*
* Thauany Moedano
*
* SPDX-License-Identifier: Apache-2.0
*/

var FabricClient = require('fabric-client');
var FabricCAClient = require('fabric-ca-client');

var path = require('path');
var util = require('util');
var os = require('os');

var fabricClient = new FabricClient();
var fabricCaClient = null;
var adminUser = null;
var memberUser = null;
var storePath = path.join(__dirname, 'hfc-key-store');
console.log(' Store path:'+storePath);
var admin = 'admin';

/*
  User information
  TO DO: hardcoded, it should be passed by CLI
*/
var peerAffiliation = 'org1.department1';
var peerRole = 'client';
var mspId = 'Org1MSP';

var readlineSync = require('readline-sync');

var name = readlineSync.question('Type the username: ');

  FabricClient.newDefaultKeyValueStore({ path: storePath })
        .then((state_store) => 
        {
          fabricClient.setStateStore(state_store);
          var cryptoSuite = FabricClient.newCryptoSuite();
          // use the same location for the state store (where the users' certificate are kept)
          // and the crypto store (where the users' keys are kept)
          var cryptoStore = FabricClient.newCryptoKeyStore({path: storePath});
          cryptoSuite.setCryptoKeyStore(cryptoStore);
          fabricClient.setCryptoSuite(cryptoSuite);
          var tlsOptions = 
          {
           trustedRoots: [],
           verify: false
          };
          fabricCaClient = new FabricCAClient('http://localhost:7054', null , '', cryptoSuite);

          return fabricClient.getUserContext(admin, true);
        })
        .then((userFromStore) => 
        {
          if (userFromStore && userFromStore.isEnrolled()) 
          {
              adminUser = userFromStore;
          } 
          else
          {
            throw new Error('No admin user located! Cannot create the user. Exiting...' );
          }

          return fabricCaClient.register({enrollmentID: name, affiliation: peerAffiliation, role: peerRole}, adminUser);
        })
        .then((secret) => 
        {
          console.log(name + ' successfully registered! ');

          return fabricCaClient.enroll({enrollmentID: name, enrollmentSecret: secret});
        })
        .then((enrollment) => 
        {
          return fabricClient.createUser({
            username: name,
            mspid: mspId,
            cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
          });
        })
        .then((user) => 
        {
           memberUser = user;
           return fabricClient.setUserContext(memberUser);
        })
        .then(()=>
        {
           console.log(name + ' registered on the ledger successfully! ');
        }).catch((err) => 
        {
          console.error('Failed to register: ' + err);
        if(err.toString().indexOf('Authorization') > -1) 
        {
          console.error('Authorization failures may be occur due old instance of CA.\n' + 'Try again deleting the content in: '+storePath);
        }
      });
