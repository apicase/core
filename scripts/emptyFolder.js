import fs from 'fs-extra';

// to delete existing built bundle with windows environment
/* global Promise */
function emptyDist() {
  return new Promise((resolve, reject) => {
    fs.emptyDir('../../dist', (err) => {
      if (err) {
        console.error(err);
        reject();
      } else {
        console.log('emptying dist directory job is done');
        resolve();
      }
    });
  });
}

emptyDist();
