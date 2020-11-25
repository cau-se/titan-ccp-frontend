#!/bin/sh

# Replace env vars in JavaScript files
echo "Replacing env vars in JS"
for file in /var/www/titan-ccp/js/*.js;
do
  echo "Processing $file";

  # Use the existing JS file as template
  if [ ! -f $file.tmpl.js ]; then
    cp $file $file.tmpl.js
  fi

  envsubst '$DEMO $SHOW_COMPLETE_HISTORY' < $file.tmpl.js > $file
done

exec "$@"