/*jslint browser: true, unparam: true, indent: 2 */
/*globals qq */

qq.WindowReceiveMessage = function (o) {
  "use strict";
  var options = {},
    callbackWrapperDetachers = {};
  qq.extend(options, o);
  return {
    receiveMessage: function (id, callback) {
      var onMessageCallbackWrapper = function (event) {
        callback(event.data);
      };
      if (window.postMessage) {
        callbackWrapperDetachers[id] = qq(window).attach("message", onMessageCallbackWrapper);
      }
    },
    stopReceivingMessages: function (id) {
      if (window.postMessage) {
        var detacher = callbackWrapperDetachers[id];
        if (detacher) {
          detacher();
        }
      }
    }
  };
};

