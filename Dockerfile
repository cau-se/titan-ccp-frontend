FROM nginx:alpine

COPY dist /var/www/titan-ccp
COPY nginx.conf /etc/nginx/nginx.conf

COPY entrypoint.sh /entrypoint.sh

ENV SENSOR_MANAGEMENT_BASE_URL http://titan-ccp-sensor-management:80
ENV HISTORY_BASE_URL http://titan-ccp-history:80
ENV STATS_BASE_URL http://titan-ccp-stats:80
ENV ANOMALIES_BASE_URL http://titan-ccp-anomlies:80

ENTRYPOINT ["/entrypoint.sh"]

CMD cp /etc/nginx/nginx.conf /etc/nginx/nginx.tmpl.conf \
    && envsubst '$SENSOR_MANAGEMENT_BASE_URL $HISTORY_BASE_URL $STATS_BASE_URL $ANOMALIES_BASE_URL' < /etc/nginx/nginx.tmpl.conf > /etc/nginx/nginx.conf \
    && nginx -g "daemon off;"