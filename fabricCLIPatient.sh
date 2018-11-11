#!/bin/sh

set -e


echo "===== MEDCHAIN CLI 0.1 --- ADMIN ====="
echo "===== AUTHENTICATE ====="

node authenticateOperator.js

PS3='===== MEDCHAIN CLI 0.1 CHOOSE YOUR OPTION '
options=("Get Token" "Update Token" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Get Token")
            echo "===== GET TOKEN ====="
            node queryToken.js
            ;;
        "Update Token")
            echo "===== UPDATE TOKEN ====="
            node updateToken.js
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done
