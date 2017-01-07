#!./phantomjs

var server = require('webserver').create();
var translatePages = {};

function doWithTranslatePage(pageName, callback) {
  if (translatePages[pageName]) {
    // console.log('Using translate page: ' + pageName);
    callback(translatePages[pageName]);
  } else {
    var page = require('webpage').create();
    // console.log('Creating new translate page: ' + pageName);
    page.open('https://translate.google.com/#' + pageName, function (status) {
      if (status != 'success') throw status;
      // console.log('Translate page initialization success: ' + pageName);
      translatePages[pageName] = page;
      setTimeout(function () {
        callback(translatePages[pageName]);
      }, 800);
    });
  }
}

function resetTranslatePage(pageName, callback) {
  translatePages[pageName].open('https://translate.google.com/#' + pageName, function () {
    if (status != 'success') throw status;
    callback();
  });
}

function renderTranslatePage(pageName, callback) {
  translatePages[pageName].render('rendered-' + pageName + '.png');
  callback({ status: 'success' });
}

function translate(source_lang, target_lang, query, callback) {
  // console.log('Starting translation: ' + query + ' from ' + source_lang + ' to ' + target_lang);
  doWithTranslatePage(source_lang + '/' + target_lang, function (page) {

    page.evaluate(function(query) {
      document.getElementById('source').value = query;
      document.getElementById('gt-submit').click();
    }, query);

    // console.log('Translation request submitted: ' + query);

    function translateDone() {
      var translation = page.evaluate(function() {
        return document.getElementById('result_box').innerText;
      });

      var suggestion = page.evaluate(function() {
        if (document.getElementById('spelling-correction') &&
            document.getElementById('spelling-correction').style.display != 'none' &&
            document.getElementById('spelling-correction').children.length > 1) {

          return document.getElementById('spelling-correction').children[0].innerText;
        } else {
          return null;
        }
      });

      var translations = page.evaluate(function() {
        if (document.getElementsByClassName('gt-cd-baf') &&
            document.getElementsByClassName('gt-cd-baf')[0] &&
            document.getElementsByClassName('gt-cd-baf')[0].style.display != 'none' &&
            document.getElementsByClassName('gt-baf-table') &&
            document.getElementsByClassName('gt-baf-table')[0]) {

          var currentHead = null;

          return Array.prototype.slice.call(document.getElementsByClassName('gt-baf-table')[0].children[0].children).reduce(function (arr, element) {
            if (element.children[0].children[0].classList.contains('gt-baf-pos-head')) {
              currentHead = element.children[0].children[0].innerText;
              return arr;
            } else if (element.children[1] && element.children[2]) {
              var type = currentHead;
              var translation = element.children[1].innerText.replace(/\n/g, '');
              var meaning = element.children[2].innerText.replace(/\n/g, '');
              var frequency = parseInt(element.children[0].children[0].children[0].style.width);
              arr.push({ type: type, translation: translation, meaning: meaning, frequency: frequency });
              return arr;
            } else {
              return arr;
            }
          }, []);
        } else {
          return [];
        }
      });

      // console.log('Translation done. ' + query + ' => ' + translation);

      callback({
        translation: translation,
        suggestion: suggestion,
        translations: translations
      });
    }

    var waiting = 0;

    function proceedWhenTranslateDone() {
      // console.log('Waiting for translation...');

      var done = page.evaluate(function() {
        return document.getElementById('gt-swap') && !document.getElementById('gt-swap').classList.contains('jfk-button-disabled');
      });

      if (done) {
        setTimeout(translateDone, 50);
      } else if (waiting > 50) {
        // callback({
        //   error: 'timeout'
        // });
        setTimeout(translateDone, 50);
      } else {
        setTimeout(proceedWhenTranslateDone, 50);
      }

      waiting++;
    }

    setTimeout(proceedWhenTranslateDone, 50);
  });
}

function suspendServer() {
  console.log('Suspending server...');
  require('child_process').spawn('sh', ['suspend-server.sh'], { stdio: 'inherit' });
}

var suspendServerTimeout = null;

var service = server.listen('127.0.0.1:54234', function(request, response) {
  try {
    if (suspendServerTimeout) clearTimeout(suspendServerTimeout);
    suspendServerTimeout = setTimeout(suspendServer, 10000);

    switch (request.url) {

    case '/translate':
      // { "q": "你好", "source": "auto", "target": "en" }
      if (typeof request.post === 'object') {
        var params = JSON.parse(Object.keys(request.post)[0]);
      } else {
        var params = JSON.parse(request.post);
      }
      translate(params.source, params.target, params.q, function (results) {
        response.statusCode = 200;
        response.write(JSON.stringify(results, null, 2));
        response.close();
      });
      break;
    }

  } catch (e) {
    response.statusCode = 500;
    response.write(JSON.stringify({ status: 'error', error: { message: e.message, stack: e.stack } }, null, 2));
    response.close();
  }
});

console.log('Server listening on 127.0.0.1:54234');
