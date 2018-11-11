/*
# 
#
# Thauany Moedano
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class 
{
  /*
  * Init default 
  */
  async Init(stub) 
  {
    console.info('=========== Chaincode started ===========');
    return shim.success();
  }

  /*
  * Call the methods for the smart contract.
  */
  async Invoke(stub) 
  {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) 
    {
      console.error('Function::' + ret.fcn + ' not found');
      throw new Error('Unkonw' + ret.fcn + ' invoke');
    }
    try 
    {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) 
    {
      console.log(err);
      return shim.error(err);
    }
  }

  /**
  * Initialize the ledger with the access rules
  * TO DO: implement situations
  * Y: write/read
  * N: zero access
  * X: see own data
  * R: read
  */
  async initLedger(stub, args) 
  {
    console.info('=============  ===========');

    var ruleDoctor =
    {
      docType: 'rule',
      basicPatient: 'Y',
      medicalRecord: 'Y',
      anemese: 'Y',
      exams: 'Y',
      proced: 'Y',
      referral: 'Y',
      appointment: 'R',
      token: 'N'
    };

    await stub.putState('ruleDoctor', Buffer.from(JSON.stringify(ruleDoctor)));
    console.info('Rule for Doctor added');

    var ruleAttendant =
    {
      docType: 'rule',
      basicPatient: 'Y',
      medicalRecord: 'O',
      anemese: 'N',
      exams: 'N',
      proced: 'N',
      referral: 'R',
      appointment: 'Y',
      token: 'N'
    };

    await stub.putState('ruleAttendant', Buffer.from(JSON.stringify(ruleAttendant)));
    console.info('Rule for attendant added');

    var rulePatient =
    {
      docType: 'rule',
      basicPatient: 'X',
      medicalRecord: 'X',
      anemese: 'Y',
      exams: 'X',
      proced: 'X',
      referral: 'X',
      appointment: 'X',
      token: 'X'
    }

    await stub.putState('rulePatient', Buffer.from(JSON.stringify(rulePatient)));
    console.info('Rule for patient added');
    
    var ruleNurse =
    {
      docType: 'rule',
      basicPatient: 'R',
      medicalRecord: 'R',
      anemese: 'Y',
      exams: 'R',
      proced: 'R',
      referral: 'R',
      appointment: 'R',
      token: 'N'
    }

    await stub.putState('ruleNurse', Buffer.from(JSON.stringify(ruleNurse)));
    console.info('Rule for nurse added');
  }

  /*
  * Basic data of the patient at the ledger
  */
  async insertBasicPatientData(stub, args) 
  {
    var basicPatient = 
    {
      docType: 'basicPatient',
      name: args[0],
      address: args[1],
      zipCode: args[2],
      tel: args[3],
      healthCard: args[4],
      id: args[5]
    };
    await stub.putState(args[5], Buffer.from(JSON.stringify(basicPatient)));
  }

  /*
  * Create operator data
  */
  async insertOperatorData(stub, args) 
  {

    console.log('Registering user on the ledger');

    var operatorData = 
    {
      docType: 'operatorData',
      username: args[0],
      secret: args[1],
      name: args[2],
      lastName: args[3],
      id: args[4],
      rule: args[5]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(operatorData)));
    console.log('Inserted');
  }


  async authenticateOperator(stub, args) 
  {

    let username = args[0];

    let operatorData = await stub.getState(username);
    
    if (!operatorData || operatorData.toString().length <= 0) 
    {
      throw new Error(operatorData + ' does not exist: ');
    }
    
    let operator = JSON.parse(operatorData);
    if(operator.secret != args[1])
    {
      throw new Error('Wrong password');
    }
    
    if(operator.rule != args[2])
    {
      throw new Error ("Rule does not match with the operator");
    }

    return operatorData.toString();
  }

  async recordAdminSecret(stub, args) 
  {
     console.log('Registering user on the ledger');

    var operatorData = 
    {
      docType: 'adminSecret',
      username: args[0],
      secret: args[1]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(operatorData)));
    console.log('Inserted');
  }
  
 async authenticateAdmin(stub, args) 
 {

     let adminBytes = await stub.getState(args[0]);
     if(adminBytes == null)
     {
       throw new Error("Admin does not exist");
     }
     let admin = JSON.parse(adminBytes);
     if(admin.secret != args[1])
     {
       throw new Error ("Wrong secret");
     }
  }


  /*args[0]: id 
    args[1]: full name 
    args[2]: docType
  */
  async openMedicalRecord(stub, args) 
  {
    
    var rule = args[2];
    let ruleBytes = await stub.getState(rule); 
    if (!ruleBytes || ruleBytes.toString().length <= 0) 
    {
      throw new Error(rule + ' does not exist');
    }
    let role = JSON.parse(ruleBytes);
    if(role.medicalRecord != 'O' && role.medicalRecord != 'Y')
    {
      throw new Error('Not authorized: ' + role.medicalRecord);
    }
    var medicalRecord = 
    {
      docType: 'medicalRecord',
      name: args[0],
      id: args[1],
      anemese: '',
      exams: '',
      diagHip: '',
      defHip: '',
      proced: '',
      referral: '',
      crm: args[4],
      docName: args[5]
    };

   await stub.putState(args[3], Buffer.from(JSON.stringify(medicalRecord)));

    var tokenInfo =
    {
      docType: 'tokenInfo',
      name: args[0], 
      id: args[1],
      tokenDisable: args[7]
    };

    await stub.putState('tokenInf'+args[1], Buffer.from(JSON.stringify(tokenInfo)));

    var token =
    {
      docType: 'token',
      tokenDoc: 'medicalRecord',
      id: args[1],
      key: args[3]
    };

    var keyTOKEN = args[6];
    await stub.putState(keyTOKEN, Buffer.from(JSON.stringify(token)));
    console.log('Inserted');
  }
  
  /*args[0]: id 
    args[1]: full name 
    args[2]: docType
    args[3]: qp 
    args[4]: hda 
    args[5]: hmp
    args[6]: hf
    args[7]: fuma 
    args[8]: bebe
    args[9]: pressao 
    args[10]: batimentos cardiacos
    args[12]: key
  */
  async createAnemese(stub, args) 
  {
    var docType = args[10];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.anemese != 'Y')
    {
      throw new Error('Not authorized');
    }
    /*
    * QP: queixa principal 
    * HDA: Histórico doença atual 
    * HMP: Antecedentes 
    * HF: Historico familiar 
    * Pressao
    * Batimento cardiaco
    */
    var anemese = 
    {
      docType: 'anemese',
      id: args[0],
      fullName: args[1],
      qp: args[2],
      hda: args[3],
      hmp: args[4],
      hf: args[5],
      smoke: args[6],
      drink: args[7],
      pression: args[8],
      heartbeat: args[9],
      key: args[12]
    };

    var key = args[12];
    await stub.putState(key, Buffer.from(JSON.stringify(anemese)));
    console.log('Inserted');
    
    let medicalRecordBytes = await stub.getState(args[11]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.anemese = anemese;

    await stub.putState(args[11], Buffer.from(JSON.stringify(medicalRecord)));
  }

  /*
  */
  async createExams(stub, args) 
  {
    var docType = args[5];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.exams != 'Y')
    {
      throw new Error('Not authorized');
    }
    /*
    * descrição do exame
    */
    var exams = 
    {
      docType: 'exams',
      id: args[0],
      fullName: args[1],
      desc: args[2],
      key: args[3],
      results: ''
    };

    var key = args[3];
    await stub.putState(key, Buffer.from(JSON.stringify(exams)));
    console.log('Inserted');
    
    let medicalRecordBytes = await stub.getState(args[4]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.exams = exams;

    await stub.putState(args[4], Buffer.from(JSON.stringify(medicalRecord)));
  }
  
  
   /*
  */
  async createProced(stub, args) 
  {
    var docType = args[5];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.proced != 'Y')
    {
      throw new Error('Not authorized');
    }
    /*
    * descrição do exame
    */
    var proced = 
    {
      docType: 'proced',
      id: args[0],
      fullName: args[1],
      desc: args[2],
    };

    var key = args[3];
    await stub.putState(key, Buffer.from(JSON.stringify(proced)));
    console.log('Inserted');
    
    let medicalRecordBytes = await stub.getState(args[4]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.proced = proced;

    await stub.putState(args[4], Buffer.from(JSON.stringify(medicalRecord)));
  }

  
  async createAppointment(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.appointment != 'Y')
    {
      throw new Error('Not authorized');
    }
    /*
    * descrição do exame
    */
    var appointment = 
    {
      docType: 'appointment',
      id: args[1],
      fullName: args[2],
      hour: args[3],
      day: args[4],
      doctorName: args[5],
      address: args[6],
      hospital: args[7],
    };

    var key = args[8];
    await stub.putState(key, Buffer.from(JSON.stringify(appointment)));
    console.log('Inserted');
    
    var token = 
    {
      docType: 'token',
      tokenDoc: 'appointment',
      id: args[1],
      key: args[8]
    };

    var keyTOKEN = args[9];
    await stub.putState(keyTOKEN, Buffer.from(JSON.stringify(token)));
    console.log('Inserted');
  }


  async getToken(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.token != 'X')
    {
      throw new Error('Not authorized');
    }

    var queryString = '{\"selector\"' + ':{\"docType\"' + ':\"token\",' + '\"id\"' + ':\"' + args[1] + '\"}' + '}';
    let iterator = await stub.getQueryResult(queryString);

    let allResults = [];
    while (true) 
    {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) 
      {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try 
        {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }
  
  
  /*
   *  diagHip: '',
      defHip: '',
  */
  async confirmAppointment(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.appointment != 'Y')
    {
      throw new Error('Not authorized');
    }

    
    let tokenBytes = await stub.getState(args[1]);
   
    if(tokenBytes == null || tokenBytes.toString().length <= 0 || !tokenBytes)
    {
      throw new Error('token not verified');
    }
    let token = JSON.parse(tokenBytes);

    let appKey = token.key;
    let appBytes = await stub.getState(appKey);
    let app = JSON.parse(appBytes);
    if(appBytes == null || appBytes.toString().length <= 0 || !appBytes)
    {
      throw new Error('Appointment not found');
    }    
    
    return appBytes;
  }
  
  
   /*
   *  diagHip: '',
      defHip: '',
  */
  async updateExamResult(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.exams != 'R' && role.exams != 'Y')
    {
      throw new Error('Not authorized');
    }

    
    let examBytes = await stub.getState(args[2]);
    let exam = JSON.parse(examBytes);
    exam.results = args[1];

    await stub.putState(args[2], Buffer.from(JSON.stringify(exam)));
   
    let medicalRecordBytes = await stub.getState(args[3]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.exams = exam;

    await stub.putState(args[3], Buffer.from(JSON.stringify(medicalRecord)));
  }
  
   /*
   *  diagHip: '',
      defHip: '',
  */
  async updateDiag(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.medicalRecord != 'Y')
    {
      throw new Error('Not authorized');
    }

    
    let medicalRecordBytes = await stub.getState(args[1]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.diagHip = args[2];

    await stub.putState(args[1], Buffer.from(JSON.stringify(medicalRecord)));
  }
  
  
  /*
   *  diagHip: '',
      defHip: '',
  */
  async readExams(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.exams != 'R' && role.exams != 'Y')
    {
      throw new Error('Not authorized');
    }

    let medicalRecordBytes = await stub.getState(args[1]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    var key = medicalRecord.exams.key;

    let examsAsBytes = await stub.getState(key);
 
    if (!examsAsBytes || examsAsBytes.toString().length <= 0) {
      throw new Error(examsAsBytes + ' does not exist: ');
    }
    console.log(examsAsBytes.toString());
    return examsAsBytes;
  }
  
  
  async readAnemese(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.anemese != 'R' && role.anemese != 'Y')
    {
      throw new Error('Not authorized');
    }

    let medicalRecordBytes = await stub.getState(args[1]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    var key = medicalRecord.anemese.key;

    let anemeseAsBytes = await stub.getState(key);
 
    if (!anemeseAsBytes || anemeseAsBytes.toString().length <= 0) {
      throw new Error(anemeseAsBytes + ' does not exist: ');
    }
    console.log(anemeseAsBytes.toString());
    return anemeseAsBytes;
  }
  
  
  
   /*
   *  diagHip: '',
      defHip: '',
  */
  async updateDefHip(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.medicalRecord != 'Y')
    {
      throw new Error('Not authorized');
    }

    
    let medicalRecordBytes = await stub.getState(args[1]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.defHip = args[2];

    await stub.putState(args[1], Buffer.from(JSON.stringify(medicalRecord)));
  }
  
  
  /*
   *  diagHip: '',
      defHip: '',
  */
  async updateToken(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.token != 'X')
    {
      throw new Error('Not authorized');
    }

    
    let tokenBytes = await stub.getState('tokenInf'+args[1]);
    let token = JSON.parse(tokenBytes);
    token.tokenDisable = args[2];

    await stub.putState('tokenInf'+args[1], Buffer.from(JSON.stringify(token)));
  }
  
  
  async createReferral(stub, args) 
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.referral != 'Y')
    {
      throw new Error('Not authorized');
    }
    /*
    * Obs: Notas 
    * Spec: Qual a especialidade
    */
    var referral = 
    {
      docType: 'referral',
      id: args[1],
      fullName: args[2],
      obs: args[3],
      spec: args[4]
    };
    var utc = new Date().toJSON().slice(0,10).replace(/-/g,'');
    var key = args[6];
    await stub.putState(key, Buffer.from(JSON.stringify(referral)));
    console.log('Inserted');
    
    let medicalRecordBytes = await stub.getState(args[5]);
    let medicalRecord = JSON.parse(medicalRecordBytes);
    medicalRecord.referral = referral;

    await stub.putState(args[5], Buffer.from(JSON.stringify(medicalRecord)));
  }

  /*
  * Query the referral by ID
  */
  async queryReferralById(stub, args)
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.referral != 'Y' && role.referral != 'R')
    {
      throw new Error('Not authorized');
    }

    var queryString = '{\"selector\"' + ':{\"docType\"' + ':\"referral\",' + '\"id\"' + ':\"' + args[1] + '\"}' + '}';
    let iterator = await stub.getQueryResult(queryString);

    let allResults = [];
    while (true) 
    {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) 
      {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try 
        {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }
  
  
  /*
  * Query the medical record by ID
  */
  async queryMedicalRecordByCRM(stub, args)
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.medicalRecord != 'Y' && role.medicalRecord != 'R')
    {
      throw new Error('Not authorized');
    }

    var queryString = '{\"selector\"' + ':{\"docType\"' + ':\"medicalRecord\",' + '\"crm\"' + ':\"' + args[1] + '\",' + '\"id\"' + ':\"' 
                        + args[2] + '\"}' + '}';
    let iterator = await stub.getQueryResult(queryString);

    let allResults = [];
    while (true) 
    {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) 
      {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try 
        {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }
  
  async queryMedicalRecordTokenDisable(stub, args)
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.medicalRecord != 'Y' && role.medicalRecord != 'R')
    {
      throw new Error('Not authorized');
    }

    let tokenInfBytes = await stub.getState('tokenInf'+args[1]);
    let tokenInf = JSON.parse(tokenInfBytes);
    if(tokenInf.tokenDisable != 'D')
    {
      throw new Error('Token is enabled');
    }

   var queryString = '{\"selector\"' + ':{\"docType\"' + ':\"medicalRecord\",' + '\"id\"' + ':\"' + args[1] + '\"}' + '}';
    let iterator = await stub.getQueryResult(queryString);

    let allResults = [];
    while (true) 
    {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) 
      {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try 
        {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }
  
  
  /*
  * Query the medical record by ID
  */
  async queryMedicalRecordByToken(stub, args)
  {
    var docType = args[0];
    let roleAsBytes = await stub.getState(docType); 
    if (!roleAsBytes || roleAsBytes.toString().length <= 0) 
    {
      throw new Error(docType + ' does not exist');
    }
    let role = JSON.parse(roleAsBytes);
    if(role.medicalRecord != 'Y')
    {
      throw new Error('Not authorized');
    }

    
    let tokenBytes = await stub.getState(args[1]);
   
    if(tokenBytes == null || tokenBytes.toString().length <= 0 || !tokenBytes)
    {
      throw new Error('token not verified');
    }
    let token = JSON.parse(tokenBytes);

    let appKey = token.key;
    let appBytes = await stub.getState(appKey);
    let app = JSON.parse(appBytes);
    if(appBytes == null || appBytes.toString().length <= 0 || !appBytes)
    {
      throw new Error('Appointment not found');
    }    
    
    return appBytes;
  }
};

shim.start(new Chaincode());
