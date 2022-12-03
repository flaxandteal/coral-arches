ARG ARCHES_BASE=arches_coral_base
FROM $ARCHES_BASE

RUN useradd arches
RUN chgrp arches ../entrypoint.sh && chmod g+rx ../entrypoint.sh
ARG ARCHES_PROJECT
ENV ARCHES_PROJECT $ARCHES_PROJECT
COPY entrypoint.sh ${WEB_ROOT}/
COPY ${ARCHES_PROJECT} ${WEB_ROOT}/${ARCHES_PROJECT}/
RUN . ../ENV/bin/activate \
    && pip install -r ${WEB_ROOT}/${ARCHES_PROJECT}/requirements.txt --no-binary :all:

COPY settings_docker.py ${WEB_ROOT}/arches/arches/

WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}
RUN mkdir -p /static_root && chown -R arches /static_root
RUN yarn install
RUN cp ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/media/node_modules/js-cookie/src/js.cookie.js ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/media/build/js/js-cookie.js
WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}
ENTRYPOINT ../entrypoint.sh
CMD run_arches
USER 1000
