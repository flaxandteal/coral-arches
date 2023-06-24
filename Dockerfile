ARG ARCHES_BASE=flaxandteal/arches_coral_base
FROM $ARCHES_BASE

RUN useradd arches
RUN chgrp arches ../entrypoint.sh && chmod g+rx ../entrypoint.sh
ARG ARCHES_PROJECT
ENV ARCHES_PROJECT $ARCHES_PROJECT
COPY entrypoint.sh ${WEB_ROOT}/
COPY ${ARCHES_PROJECT} ${WEB_ROOT}/${ARCHES_PROJECT}/
# Install packages required to build the python libs, then remove them
RUN set -ex \
    && BUILD_DEPS=" \
        libxslt-dev \
        git openssh-client \
        " \
    && apt-get update -y \
    && (ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts) \ # TODO: fix ckeditor yarn dep
    && apt-get install -y --no-install-recommends $BUILD_DEPS
RUN . ../ENV/bin/activate \
    && pip install --upgrade pip \
    && pip install starlette-graphene3 \
    && pip install python-docx \
    && pip install starlette-context
RUN . ../ENV/bin/activate \
    && pip install cachetools websockets \
    && pip install -r ${WEB_ROOT}/${ARCHES_PROJECT}/requirements.txt --no-binary :all:

COPY settings_docker.py ${WEB_ROOT}/arches/arches/
RUN echo "{}" > ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/webpack/webpack-stats.json

WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}
RUN mkdir -p /static_root && chown -R arches /static_root
RUN yarn install
WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}
ENTRYPOINT ../entrypoint.sh
CMD run_arches
USER 1000
