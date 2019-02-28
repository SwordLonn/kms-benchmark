/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

var path = require('path');
var url = require('url');
var express = require('express');
var ws = require('ws');
var kurento = require('kurento-client');
var fs = require('fs');
var https = require('https');
var url = require('url');
var ExtendOptions = require('rloud-utils').sdphelper.ExtendOptions;
var config = JSON.parse(fs.readFileSync('config.json'));

var Helper = require('./clienthelper');

var helper = new Helper();

var app = express();
var first = helper.get(config.first_ms).createPipeline();
var second_ms = helper.get(config.second_ms);

/*
 * Definition of global variables.
 */

var idCounter = 0;
var noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Server startup
 */
var options = {
  key: fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
};

var asUrl = url.parse(config.as_uri);
var port = asUrl.port;
var apps = app;
if (asUrl.protocol == 'https:') {
  apps = https.createServer(options, app);
}
var server = apps.listen(port, function() {
  console.log('ms-benchmark started');
  console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wss = new ws.Server({
  server: server,
  path: '/live'
});

function nextUniqueId() {
  idCounter++;
  return idCounter.toString();
}

/*
 * Management of WebSocket messages
 */
wss.on('connection', function(ws) {
  var sessionId = nextUniqueId();
  console.log('Connection received with sessionId ' + sessionId);

  ws.on('error', function(error) {
    console.log('Connection ' + sessionId + ' error');
    stop(sessionId);
  });

  ws.on('close', function() {
    console.log('Connection ' + sessionId + ' closed');
    stop(sessionId);
  });

  ws.on('message', function(_message) {
    var message = JSON.parse(_message);
    console.log('Connection ' + sessionId + ' received message ', message);

    switch (message.id) {
      case 'presenter':
        startPresenter(sessionId, ws, message.sdpOffer, function(
          error,
          sdpAnswer
        ) {
          if (error) {
            console.log(error);
            return ws.send(
              JSON.stringify({
                id: 'presenterResponse',
                response: 'rejected',
                message: error
              })
            );
          }
          ws.send(
            JSON.stringify({
              id: 'presenterResponse',
              response: 'accepted',
              sdpAnswer: sdpAnswer
            })
          );
        });
        break;

      case 'viewer':
        startViewer(sessionId, ws, message.sdpOffer, function(
          error,
          sdpAnswer
        ) {
          if (error) {
            console.log(error);
            return ws.send(
              JSON.stringify({
                id: 'viewerResponse',
                response: 'rejected',
                message: error
              })
            );
          }

          ws.send(
            JSON.stringify({
              id: 'viewerResponse',
              response: 'accepted',
              sdpAnswer: sdpAnswer
            })
          );
        });
        break;

      case 'stop':
        stop(sessionId);
        break;

      case 'onIceCandidate':
        onIceCandidate(sessionId, message.candidate);
        break;

      default:
        ws.send(
          JSON.stringify({
            id: 'error',
            message: 'Invalid message ' + message
          })
        );
        break;
    }
  });
});

let presenter = {};
let viewers = {};
let endpoints = {};
let total = 0;

function gotIceCandidate(label, candidate) {
  console.log(candidate);
  var s = sessions[label];
  var candidate = kurento.register.complexTypes.IceCandidate(candidate);
  s.send(
    JSON.stringify({
      id: 'iceCandidate',
      candidate: candidate
    })
  );
}

function startPresenter(sessionId, ws, sdpOffer, callback) {
  let webrtc = first.createWebRtc();
  let pass = first.getSource();
  webrtc.connect(pass);

  webrtc.processSdpOffer(sdpOffer).then(answer => {
    callback(null, answer);
  });
  presenter.webrtc = webrtc;
  endpoints[sessionId] = presenter;
}

function startViewer(sessionId, ws, sdpOffer, callback) {
  if (!presenter.webrtc) {
    callback(noPresenterMessage);
    return;
  }
  let second = second_ms.createPipeline();
  let webrtc = second.createWebRtc();
  second.getSource().connect(webrtc);
  webrtc.processSdpOffer(sdpOffer).then(answer => {
    callback(null, answer);
  });
  viewers[sessionId] = viewers[sessionId] || {};
  viewers[sessionId].second = second;
  viewers[sessionId].webrtc = webrtc;

  endpoints = viewers[sessionId];

  let params = ExtendOptions({}, sdpOffer);
  first.link(second, params).then(plumbers => {
    first.getSource().connect(plumbers[0]);
    plumbers[1].connect(second.getSource());
  });

  total += 1;
  for (let i = 0; i < config.streams_per_viewer; ++i) {
    setTimeout(() => {
      total += 1;
      console.log('connecting ' + total + ' links ');
      first.link(second, params).then(plumbers => {
        first.getSource().connect(plumbers[0]);
      });
    }, i * 500);
  }
}

function stop(sessionId) {}

function onIceCandidate(sessionId, _candidate) {
  //   let candidate = kurento.register.complexTypes.IceCandidate(_candidate);
  //   let point = endpoints[sessionId];
  //   if (point && point.webrtc) {
  //     point.webrtc.adddIceCandidate(candidate);
  //   }
}

app.use(express.static(path.join(__dirname, 'static')));
