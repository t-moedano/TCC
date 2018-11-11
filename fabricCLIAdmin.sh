#!/bin/sh

set -e


echo "===== MEDCHAIN CLI 0.1 --- ADMIN ====="
echo "===== AUTHENTICATE ====="

node authenticateAdmin.js

PS3='===== MEDCHAIN CLI 0.1 CHOOSE YOUR OPTION '
options=("Register User" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Register User")
            echo "===== START REGISTER USER ====="
            node registerUser.js
            echo "===== CERTIFICATE GENERATED. REGISTER THE USER ON THE LEDGER. FILL THE NEXT INFORMATION ====="
            node insertOperatorData.js
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
