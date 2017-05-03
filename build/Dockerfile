# This docker implements the Cme device web application layer.  This
# is merely a docker VOLUME container.  It allows a new /www folder
# to be mounted and used for the Cme application layer.

# Start with bare-bones Alpine
FROM hypriot/rpi-alpine-scratch

LABEL maintainer "James Brunner <james.brunner@smithsmicrowave.com>"

ARG version
ADD 1500-007-v$version-SWARE-CME_WEB.tgz /www
VOLUME /www

# just a volume container - don't run anything
CMD ["/bin/true"]