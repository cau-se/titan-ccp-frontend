#!/bin/sh

JSON_ENV_VARS=$(env | grep VUE_APP_ | awk -F = '{print "\x22"$1"\x22: \x22"$2"\x22"}' | sed ':a;N;$!ba;s/\n/, /g')
JSON_ENV_OBJ="globalThis.env = { $JSON_ENV_VARS }"
sed -i "s@// ENVIRONMENT_PLACEHOLDER@${JSON_ENV_OBJ}@" /var/www/titan-ccp/index.html

exec "$@"
