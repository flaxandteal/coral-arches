ARG ARCHES_BASE=flaxandteal/arches_coral_base
FROM $ARCHES_BASE

RUN useradd arches
RUN chgrp arches ../entrypoint.sh && chmod g+rx ../entrypoint.sh
ARG ARCHES_PROJECT
ENV ARCHES_PROJECT $ARCHES_PROJECT
COPY entrypoint.sh ${WEB_ROOT}/
COPY ${ARCHES_PROJECT} ${WEB_ROOT}/${ARCHES_PROJECT}/
RUN . ../ENV/bin/activate \
    && pip install cachetools websockets \
    && pip install -r ${WEB_ROOT}/${ARCHES_PROJECT}/requirements.txt

COPY settings_docker.py ${WEB_ROOT}/arches/arches/
RUN echo "{}" > ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/webpack/webpack-stats.json

WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}
RUN mkdir -p /static_root && chown -R arches /static_root

RUN (cd $WEB_ROOT/$ARCHES_PROJECT/$ARCHES_PROJECT && NODE_OPTIONS=--max_old_space_size=8192 NODE_PATH=./media/node_modules yarn add -D babel-loader html-loader clean-webpack-plugin webpack-cli mini-css-extract-plugin stylelint-webpack-plugin eslint-webpack-plugin css-loader postcss-loader sass-loader raw-loader ttf-loader file-loader url-loader webpack-dev-server)
RUN (cd $WEB_ROOT/$ARCHES_PROJECT/$ARCHES_PROJECT && NODE_OPTIONS=--max_old_space_size=8192 NODE_PATH=./media/node_modules yarn install -D)

RUN chgrp -R arches ../../ENV && chmod -R g=rwx ../../ENV

WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}
ENTRYPOINT ../entrypoint.sh
CMD run_arches
USER 1000
