
kms-benchmark
=============

 kurento benchmark test project, with link webrtc streams between 
 kurento-media-servers per viewer, streams will be created one by
 one per second.

## Installation 

```bash
git clone https://github.com/SwordLonn/kms-benchmark
cd kms-benchmark
npm install
```

and then edit config.json, set your kurento servers

```bash
nodejs server.js
```

open config.as_uri at your browser and test it!

click presenter to presenter webrtc stream to first_kms
click viewer to create streams between first_kms and 
second_kms, and pull stream from second_kms as viewer.
