let kurento = require('kurento-client');
let Kms = require('./kms/kms.js');
let LiMS = require('./lims/lims.js');
let LimsClient = require('./lims/limsclient.js');
let MsMS = require('./msms/msms.js');
let url = require('url');

class helper {
  constructor() {}
  get(uri) {
    let parse = url.parse(uri);
    if (parse.path == '/kurento') {
      //return new Kms()
      return new Kms(
        uri,
        kurento(uri, (error, client) => {
          console.log(error);
        })
      );
    } else if (parse.path == '/lims') {
      return new LiMS(uri, new LimsClient(uri));
    } else if (parse.path == '/mems' || parse.path == '/msms') {
      return new MsMS(uri);
    }
    return undefined;
  }
}

module.exports = helper;
