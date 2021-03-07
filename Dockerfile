FROM node:14.15.5

# Install entrypoint script
COPY ./docker-conf/entrypoint.sh /
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
