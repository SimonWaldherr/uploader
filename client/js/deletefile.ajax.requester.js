/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*jslint browser: true, unparam: true, indent: 2 */
/*globals qq, XMLHttpRequest*/

qq.DeleteFileAjaxRequestor = function (o) {
  "use strict";
  var requestor,
    options = {
      endpointStore: {},
      maxConnections: 3,
      customHeaders: {},
      paramsStore: {},
      demoMode: false,
      cors: {
        expected: false,
        sendCredentials: false
      },
      log: function (str, level) { return null; },
      onDelete: function (id) { return null; },
      onDeleteComplete: function (id, xhr, isError) { return null; }
    };
  qq.extend(options, o);
  requestor = new qq.AjaxRequestor({
    method: 'DELETE',
    endpointStore: options.endpointStore,
    paramsStore: options.paramsStore,
    maxConnections: options.maxConnections,
    customHeaders: options.customHeaders,
    successfulResponseCodes: [200, 202, 204],
    demoMode: options.demoMode,
    log: options.log,
    onSend: options.onDelete,
    onComplete: options.onDeleteComplete
  });
  return {
    sendDelete: function (id, uuid) {
      requestor.send(id, uuid);
      options.log("Submitted delete file request for " + id);
    }
  };
};

