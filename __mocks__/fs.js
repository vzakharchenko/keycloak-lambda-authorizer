
const fs = jest.genMockFromModule('fs');
fs.promises = {};
fs.promises.readFile = async (fullPath) => {
  const filename = fullPath.replace(/^.*[\\\/]/, ''); // eslint-disable-line no-useless-escape
  if (filename === 'storage.json') {
    return JSON.stringify({
      'oldId':{
        exp:0
      }
    });
  }
  throw new Error('file does not exists');
};
fs.promises.writeFile = async () =>{};
module.exports = fs;
