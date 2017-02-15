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
var minimist = require('minimist');
var ws = require('ws');
var kurento = require('kurento-client');
var fs = require('fs');
var https = require('https');
var config = JSON.parse(fs.readFileSync('config.json'));

var KmsManager = require('./tree/kmsmanager.js')
var TreeManager = require('./tree/treemanager.js')

var app = express();

var kmsManager = new KmsManager(config.first_kms, config.second_kms);
var treeManager = new TreeManager(kmsManager);
var tree = treeManager.createTree('main', 'benchmark', config.streams_per_viewer);
/*
 * Definition of global variables.
 */
var idCounter = 0;
var candidatesQueue = {};
var kurentoClient = null;
var presenter = null;
var viewers = [];
var noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Server startup
 */
var options = {
    key: fs.readFileSync("keys/server.key"),
    cert: fs.readFileSync("keys/server.crt")
};

var asUrl = url.parse(config.as_uri);
var port = asUrl.port;
var apps = app;
if(asUrl.protocol == 'https:'){
  apps = https.createServer(options, app);
}
var server = apps.listen(port, function() {
    console.log("kms-benchmark started");
    console.log("Open " + url.format(asUrl) + " with a WebRTC capable browser");
});

var wss = new ws.Server({
    server : server,
    path : '/live'
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
			startPresenter(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
				if (error) {
                    console.log(error);
					return ws.send(JSON.stringify({
						id : 'presenterResponse',
						response : 'rejected',
						message : error
					}));
				}
				ws.send(JSON.stringify({
					id : 'presenterResponse',
					response : 'accepted',
					sdpAnswer : sdpAnswer
				}));
			});
			break;

        case 'viewer':
			startViewer(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
				if (error) {
                    console.log(error);
					return ws.send(JSON.stringify({
						id : 'viewerResponse',
						response : 'rejected',
						message : error
					}));
				}

				ws.send(JSON.stringify({
					id : 'viewerResponse',
					response : 'accepted',
					sdpAnswer : sdpAnswer
				}));
			});
			break;

        case 'stop':
            stop(sessionId);
            break;

        case 'onIceCandidate':
            onIceCandidate(sessionId, message.candidate);
            break;

        default:
            ws.send(JSON.stringify({
                id : 'error',
                message : 'Invalid message ' + message
            }));
            break;
        }
    });
});

var sessions = {};
var endpoints = {};
var caches = {};
var source = null;

function gotIceCandidate(label, candidate){
    console.log(candidate);
    var s = sessions[label];
    var candidate = kurento.register.complexTypes.IceCandidate(candidate);
    s.send(JSON.stringify({
            id : 'iceCandidate',
            candidate : candidate
        }));
}


function startPresenter(sessionId, ws, sdpOffer, callback){
    tree.setTreeSource(gotIceCandidate, sdpOffer).then(function(res){
            console.log(res.answer);
            console.log(res.id);
            sessions[res.id] = ws;
            endpoints[sessionId] = res.id;
            var candidates = caches[sessionId];
            if(candidates){
                for(var i in candidates){
                    tree.addIceCandidate(res.id, candidates[i]);
                }
                delete caches[sessionId];
            }
            source = sessionId;
            callback(null, res.answer);
        }).catch(function(error){
            callback(error);
        });
}

function startViewer(sessionId, ws, sdpOffer, callback){
    tree.addTreeSink(gotIceCandidate, sdpOffer).then(function(res){
            console.log(res.answer);
            console.log(res.id);
            sessions[res.id] = ws;
            endpoints[sessionId] = res.id;
            var candidates = caches[sessionId];
            if(candidates){
                for(var i in candidates){
                    tree.addIceCandidate(res.id, candidates[i]);
                }
                delete caches[sessionId];
            }
            callback(null, res.answer);
        }).catch(function(error){
            callback(error);
        });
}

function stop(sessionId)
{
        if(source == sessionId){
            tree.removeTreeSource();
        }else{
            var id = endpoints[sessionId];
            if(id)
                tree.removeTreeSink(id);
        }
        var id = endpoints[sessionId];
        if(id){
            delete endpoints[sessionId];
            delete caches[sessionId];
            delete sessions[id];
        }
}

function onIceCandidate(sessionId, _candidate){
    var pointid = endpoints[sessionId];
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);
    if(pointid){
        tree.addIceCandidate(endpoints[sessionId], candidate);
    }else{
        if(!caches[sessionId])
            caches[sessionId] = new Array();
        caches[sessionId].push(candidate);
    }
}

app.use(express.static(path.join(__dirname, 'static')));


