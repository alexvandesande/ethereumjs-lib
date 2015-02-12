const utils = require('ethereumjs-util');
const rlp = require('rlp');

var Account = module.exports = function(data) {

  //Define Properties
  var fields = [{
      name: 'nonce',
      default: new Buffer([])
    }, {
      name: 'balance',
      default: new Buffer([])
    }, {
      name: 'stateRoot',
      length: 32,
      default: utils.SHA3_RLP
    }, {
      name: 'codeHash',
      length: 32,
      default: utils.SHA3_NULL
    }];

  utils.defineProperties(this, fields, data);
};

Account.prototype.serialize = function() {
  if (this.balance.toString('hex') === '00') {
    this.balance = null;
  }
  return rlp.encode(this.raw);
};

Account.prototype.isContract = function() {
  return (this.codeHash.toString('hex') !== utils.SHA3_NULL);
};

Account.prototype.getCode = function(state, cb) {

  if (this.codeHash.toString('hex') === utils.SHA3_NULL) {
    cb(null, new Buffer([]));
    return;
  }

  state.db.get(this.codeHash, {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  }, cb);
};

Account.prototype.storeCode = function(trie, code, cb) {
  //store code for a new contract
  var codeHash = this.codeHash = utils.sha3(code);

  if (this.codeHash.toString('hex') === utils.SHA3_NULL) {
    cb(null, new Buffer([]));
    return;
  }

  trie.db.put(codeHash, code, {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  }, function(err) {
    cb(err, codeHash);
  });
};

Account.getStorage = function(trie, key, cb) {
  var t = trie.copy();
  t.root = this.stateroot;
  t.get(key, cb);
};

Account.setStorage = function(trie, key, val, cb) {
  var t = trie.copy();
  t.root = this.stateroot;
  t.set(key, val, cb);
};
