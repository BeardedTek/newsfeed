FROM ghcr.io/gohugoio/hugo:v0.147.8
USER root
COPY docs/ /project
ENTRYPOINT /bin/sh
