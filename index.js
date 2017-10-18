var util = require('util');
var Transform = require('stream').Transform;

util.inherits(RemoveBlockPlugin, Transform);

function RemoveBlockPlugin(options){
  Transform.call(this, options);
}

// QUICK SOLUTION:
// Stringify the file contents,
// remove the matched blocks line-by-line,
// set the file's contents as a new Buffer
// from the returned string.
RemoveBlockPlugin.prototype._transform = function(file, encoding, done) {
  if (!file.contents) {
    this.push(file)
    return done()
  }

  const original = file.contents.toString()
  const removed = removeBlock(
    original,
    this.blockName
  )

  if (original != removed) {
    file.contents = new Buffer(removed)
  }

  this.push(file);
  return done();
};

// Consider `BEGIN: [NAME]` the opening "brace"
// and `END: [NAME]` a closing "brace" and remove
// all the lines within these start and end braces
// including the lines containing the brace.
function removeBlock(string, blockName) {
  blockName = blockName || 'TEST'
  
  var beginPattern = new RegExp('BEGIN:\\s?' + blockName)
  var endPattern = new RegExp('END:\\s?' + blockName)

  var depth = 0

  function isInBlock(line) {
    var isBegin = beginPattern.test(line)
    var isEnd = endPattern.test(line)

    if (isBegin) {
      depth += 1
    } else if (isEnd) {
      depth -= 1
    }

    return depth <= 0 && !isEnd
  }

  return string.split('\n')
    .filter(isInBlock)
    .join('\n')
}

// Factory for creating new object mode block remover streams.
function makeGulpPlugin(blockName) {
  return new RemoveBlockPlugin({
    objectMode: true,
    blockName,
  });
}

module.exports = makeGulpPlugin;
