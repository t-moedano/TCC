#!/bin/sh

set -e


echo "===== MEDCHAIN CLI 0.1 AUTHENTICATE: ====="
echo "===== AUTHENTICATE ===="

node authenticateOperator.js

PS3='===== MEDCHAIN CLI 0.1 CHOOSE YOUR OPTION '
options=("Open Medical Record" "Register Patient" "Create Anemese" "Create Exams" "Update Exams" "Update Hipotesis" "Update Diagnosis" "Create Treatment" "Create Referral" "Read Referral" "Read Medical Record Token" "Read Medical Record CRM" "Read Medical Record Token Disabled" "Read Exams" "Read Anemese" "Create Appointment" "Confirm Appointment" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Open Medical Record")
            echo "===== OPEN MEDICAL RECORD ====="
            node openMedicalRecord.js
            ;;
        "Register Patient")
            echo "==== REGISTERING NEW PERSONAL INFORMATION ====="
            node insertBasicPatient.js
            ;;
        "Create Anemese")
            echo "==== REGISTERING AMENESE INFORMATION ====="
            node createAnemese.js
            ;;
        "Create Exams")
            echo "==== REGISTERING EXAMS INFORMATION ====="
            node createExams.js
            ;;
        "Update Exams")
            echo "==== UPDATE EXAMS INFORMATION ====="
            node updateExams.js
            ;;
        "Update Hipotesis")
            echo "==== REGISTERING HIPOTESIS INFORMATION ====="
            node updateDefHip.js
            ;;
        "Update Diagnosis")
           echo "==== REGISTERING DIAGNOSIS INFORMATION ====="
           node updateDiag.js
           ;;
        "Create Treatment")
           echo "==== REGISTERING TREATMENT INFORMATION ====="
           node createProced.js
           ;;
        "Create Referral")
           echo "==== REGISTERING REFERRAL INFORMATION ====="
           node createReferral.js
           ;;
        "Read Referral")
          echo "===== READ REFERRAL ===="
          node queryReferral.js
          ;;
        "Read Medical Record Token")
          echo "===== READ MEDICAL RECORD TOKEN REQUEST ===="
          node queryMedicalRecordToken.js
          ;;
        "Read Medical Record CRM")
          echo "===== READ MEDICAL RECORD CRM REQUEST ===="
          node queryMedicalRecordCRM.js
          ;;
        "Read Medical Record Token Disabled")
          echo "===== READ MEDICAL RECORD TOKEN DISABLED REQUEST ===="
          node queryMedicalRecordDisableToken.js
          ;;
        "Read Exams")
          echo "===== READ EXAMS  RECORD ===="
          node queryExams.js
          ;;
       "Read Anemese")
          echo "===== READ ANEMESE RECORD ===="
          node queryAnemese.js
          ;;
       "Create Appointment")
          echo "======= CREATE APPOINTMENT ===="
          node createAppointment.js
          ;;
       "Confirm Appointment")
         echo "======= CONFIRM APPOINTMENT ===="
         node queryAppointment.js
         ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
