window.onload = function() {
  var errorHandler,
    uploader,
    uploader2,
    uploader3,
    uploader4,
    uploader5,
    buttons,
    i;

  errorHandler = function(event, id, fileName, reason) {
      qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
  };

  uploader = new qq.FineUploader({
      element: document.getElementById('basicUploadSuccessExample'),
      debug: true,
      request: {
          endpoint: "./../server/php/example.php"
      },
      callbacks: {
          onError: errorHandler
      },
      deleteFile: {
          enabled: true
      }
  });

  uploader2 = new qq.FineUploader({
      element: document.getElementById('manualUploadModeExample'),
      autoUpload: false,
      uploadButtonText: "Select Files",
      request: {
          endpoint: "./../server/php/example.php"
      },
      callbacks: {
          onError: errorHandler
      }
  });

  document.getElementById('triggerUpload').click(function() {
      uploader2.uploadStoredFiles();
  });

  uploader3 = new qq.FineUploader({
      element: document.getElementById('basicUploadFailureExample'),
      callbacks: {
          onError: errorHandler
      },
      request: {
          endpoint: "./../server/php/example.php",
          params: {"generateError": true}
      },
      failedUploadTextDisplay: {
          mode: 'custom',
          maxChars: 5
      }
  });

  uploader4 = new qq.FineUploader({
      element: document.getElementById('uploadWithVariousOptionsExample'),
      multiple: false,
      request: {
          endpoint: "./../server/php/example.php"
      },
      validation: {
          allowedExtensions: ['jpeg', 'jpg', 'txt'],
          sizeLimit: 50000
      },
      text: {
          uploadButton: "Click Or Drop"
      },
      callbacks: {
          onError: errorHandler
      }
  });

  uploader5 = new qq.FineUploaderBasic({
      multiple: false,
      autoUpload: false,
      button: document.getElementById('fubUploadButton'),
      request: {
          endpoint: "./../server/php/example.php"
      },
      callbacks: {
          onError: errorHandler
      }
  });

  window.setTimeout(useBAFstyle, 500, 'qq-upload-button');
  window.setTimeout(useBAFstyle, 550, 'qq-upload-button');
  window.setTimeout(useBAFstyle, 600, 'qq-upload-button');
  window.setTimeout(useBAFstyle, 650, 'btn btn-primary');
  window.setTimeout(useBAFstyle, 700, 'btn btn-primary');
};

NodeList.prototype.forEach = NodeList.prototype.forEach !== undefined ? NodeList.prototype.forEach : Array.prototype.forEach;

function useBAFstyle(classn) {
  buttons = document.getElementsByClassName(classn);
  for (i = 0; i < buttons.length; i+=1) {
    buttons[i].className = 'baf bluehover';
  }
}
