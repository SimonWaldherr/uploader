/**
 * Class that creates upload widget with drag-and-drop and file list
 * @inherits qq.FineUploaderBasic
 */

/*jslint browser: true, unparam: true, indent: 2 */
/*globals qq, alert, confirm */

qq.FineUploader = function (o) {
  "use strict";
  // call parent constructor
  qq.FineUploaderBasic.apply(this, arguments);
  // additional options
  qq.extend(this.options, {
    element: null,
    listElement: null,
    dragAndDrop: {
      extraDropzones: [],
      hideDropzones: true,
      disableDefaultDropzone: false
    },
    text: {
      uploadButton: 'Upload a file',
      cancelButton: 'Cancel',
      retryButton: 'Retry',
      deleteButton: 'Delete',
      failUpload: 'Upload failed',
      dragZone: 'Drop files here to upload',
      dropProcessing: 'Processing dropped files...',
      formatProgress: "{percent}% of {total_size}",
      waitingForResponse: "Processing..."
    },
    template: '<div class="qq-uploader">' + ((!this.options.dragAndDrop || !this.options.dragAndDrop.disableDefaultDropzone) ? '<div class="qq-upload-drop-area"><span>{dragZoneText}</span></div>' : '') + (!this.options.button ? '<div class="qq-upload-button"><div>{uploadButtonText}</div></div>' : '') + '<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' + (!this.options.listElement ? '<ul class="qq-upload-list"></ul>' : '') + '</div>',
    // template for one item in file list
    fileTemplate: '<li>' + '<div class="qq-progress-bar"></div>' + '<span class="qq-upload-spinner"></span>' + '<span class="qq-upload-finished"></span>' + '<span class="qq-upload-file"></span>' + '<span class="qq-upload-size"></span>' + '<a class="qq-upload-cancel" href="#">{cancelButtonText}</a>' + '<a class="qq-upload-retry" href="#">{retryButtonText}</a>' + '<a class="qq-upload-delete" href="#">{deleteButtonText}</a>' + '<span class="qq-upload-status-text">{statusText}</span>' + '</li>',
    classes: {
      button: 'qq-upload-button',
      drop: 'qq-upload-drop-area',
      dropActive: 'qq-upload-drop-area-active',
      dropDisabled: 'qq-upload-drop-area-disabled',
      list: 'qq-upload-list',
      progressBar: 'qq-progress-bar',
      file: 'qq-upload-file',
      spinner: 'qq-upload-spinner',
      finished: 'qq-upload-finished',
      retrying: 'qq-upload-retrying',
      retryable: 'qq-upload-retryable',
      size: 'qq-upload-size',
      cancel: 'qq-upload-cancel',
      deleteButton: 'qq-upload-delete',
      retry: 'qq-upload-retry',
      statusText: 'qq-upload-status-text',
      success: 'qq-upload-success',
      fail: 'qq-upload-fail',
      successIcon: null,
      failIcon: null,
      dropProcessing: 'qq-drop-processing',
      dropProcessingSpinner: 'qq-drop-processing-spinner'
    },
    failedUploadTextDisplay: {
      mode: 'default', //default, custom, or none
      maxChars: 50,
      responseProperty: 'error',
      enableTooltip: true
    },
    messages: {
      tooManyFilesError: "You may only drop one file"
    },
    retry: {
      showAutoRetryNote: true,
      autoRetryNote: "Retrying {retryNum}/{maxAuto}...",
      showButton: false
    },
    deleteFile: {
      forceConfirm: false,
      confirmMessage: "Are you sure you want to delete {filename}?",
      deletingStatusText: "Deleting...",
      deletingFailedText: "Delete failed"
    },
    display: {
      fileSizeOnSubmit: false
    },
    showMessage: function (message) {
      setTimeout(function () {
        alert(message);
      }, 0);
    },
    showConfirm: function (message, okCallback, cancelCallback) {
      setTimeout(function () {
        var result = confirm(message);
        if (result) {
          okCallback();
        } else if (cancelCallback) {
          cancelCallback();
        }
      }, 0);
    }
  }, true);
  // overwrite options with user supplied
  qq.extend(this.options, o, true);
  this.wrapCallbacks();
  // overwrite the upload button text if any
  // same for the Cancel button and Fail message text
  this.options.template = this.options.template.replace(/\{dragZoneText\}/g, this.options.text.dragZone);
  this.options.template = this.options.template.replace(/\{uploadButtonText\}/g, this.options.text.uploadButton);
  this.options.template = this.options.template.replace(/\{dropProcessingText\}/g, this.options.text.dropProcessing);
  this.options.fileTemplate = this.options.fileTemplate.replace(/\{cancelButtonText\}/g, this.options.text.cancelButton);
  this.options.fileTemplate = this.options.fileTemplate.replace(/\{retryButtonText\}/g, this.options.text.retryButton);
  this.options.fileTemplate = this.options.fileTemplate.replace(/\{deleteButtonText\}/g, this.options.text.deleteButton);
  this.options.fileTemplate = this.options.fileTemplate.replace(/\{statusText\}/g, "");
  this.element = this.options.element;
  this.element.innerHTML = this.options.template;
  this.listElement = this.options.listElement || this.find(this.element, 'list');
  this.classes = this.options.classes;
  if (!this.button) {
    this.button = this.createUploadButton(this.find(this.element, 'button'));
  }
  this.bindCancelAndRetryEvents();
  this.dnd = this.setupDragAndDrop();
};
// inherit from Basic Uploader
qq.extend(qq.FineUploader.prototype, qq.FineUploaderBasic.prototype);
qq.extend(qq.FineUploader.prototype, {
  clearStoredFiles: function () {
    "use strict";
    qq.FineUploaderBasic.prototype.clearStoredFiles.apply(this, arguments);
    this.listElement.innerHTML = "";
  },
  addExtraDropzone: function (element) {
    "use strict";
    this.dnd.setupExtraDropzone(element);
  },
  removeExtraDropzone: function (element) {
    "use strict";
    return this.dnd.removeExtraDropzone(element);
  },
  getItemByFileId: function (id) {
    "use strict";
    var item = this.listElement.firstChild;
    // there can't be txt nodes in dynamically created list
    // and we can  use nextSibling
    while (item) {
      if (item.qqFileId === id) {
        return item;
      }
      item = item.nextSibling;
    }
  },
  reset: function () {
    "use strict";
    qq.FineUploaderBasic.prototype.reset.apply(this, arguments);
    this.element.innerHTML = this.options.template;
    this.listElement = this.options.listElement || this.find(this.element, 'list');
    if (!this.options.button) {
      this.button = this.createUploadButton(this.find(this.element, 'button'));
    }
    this.bindCancelAndRetryEvents();
    this.dnd.dispose();
    this.dnd = this.setupDragAndDrop();
  },
  removeFileItem: function (fileId) {
    "use strict";
    var item = this.getItemByFileId(fileId);
    qq(item).remove();
  },
  setupDragAndDrop: function () {
    "use strict";
    var self = this,
      dropProcessingEl = this.find(this.element, 'dropProcessing'),
      dnd,
      preventSelectFiles,
      defaultDropAreaEl;

    preventSelectFiles = function (event) {
      event.preventDefault();
    };
    if (!this.options.dragAndDrop.disableDefaultDropzone) {
      defaultDropAreaEl = this.find(this.options.element, 'drop');
    }
    dnd = new qq.DragAndDrop({
      dropArea: defaultDropAreaEl,
      extraDropzones: this.options.dragAndDrop.extraDropzones,
      hideDropzones: this.options.dragAndDrop.hideDropzones,
      multiple: this.options.multiple,
      classes: {
        dropActive: this.options.classes.dropActive
      },
      callbacks: {
        dropProcessing: function (isProcessing, files) {
          var input = self.button.getInput();
          if (isProcessing) {
            qq(dropProcessingEl).css({
              display: 'block'
            });
            qq(input).attach('click', preventSelectFiles);
          } else {
            qq(dropProcessingEl).hide();
            qq(input).detach('click', preventSelectFiles);
          }
          if (files) {
            self.addFiles(files);
          }
        },
        error: function (code, filename) {
          self.error(code, filename);
        },
        log: function (message, level) {
          self.log(message, level);
        }
      }
    });
    dnd.setup();
    return dnd;
  },
  leaving_document_out: function (e) {
    "use strict";
    return ((qq.chrome() || (qq.safari() && qq.windows())) && e.clientX === 0 && e.clientY === 0) || (qq.firefox() && !e.relatedTarget);
  },
  storeForLater: function (id) {
    "use strict";
    qq.FineUploaderBasic.prototype.storeForLater.apply(this, arguments);
    var item = this.getItemByFileId(id);
    qq(this.find(item, 'spinner')).hide();
  },
  /**
   * Gets one of the elements listed in this.options.classes
   **/
  find: function (parent, type) {
    "use strict";
    var element = qq(parent).getByClass(this.options.classes[type])[0];
    if (!element) {
      throw new Error('element not found ' + type);
    }
    return element;
  },
  onSubmit: function (id, name) {
    "use strict";
    qq.FineUploaderBasic.prototype.onSubmit.apply(this, arguments);
    this.addToList(id, name);
  },
  // Update the progress bar & percentage as the file is uploaded
  onProgress: function (id, name, loaded, total) {
    "use strict";
    qq.FineUploaderBasic.prototype.onProgress.apply(this, arguments);
    var item, progressBar, percent, cancelLink;
    item = this.getItemByFileId(id);
    progressBar = this.find(item, 'progressBar');
    percent = Math.round(loaded / total * 100);
    if (loaded === total) {
      cancelLink = this.find(item, 'cancel');
      qq(cancelLink).hide();
      qq(progressBar).hide();
      qq(this.find(item, 'statusText')).setText(this.options.text.waitingForResponse);
      // If last byte was sent, display total file size
      this.displayFileSize(id);
    } else {
      // If still uploading, display percentage - total size is actually the total request(s) size
      this.displayFileSize(id, loaded, total);
      qq(progressBar).css({
        display: 'block'
      });
    }
    // Update progress bar element
    qq(progressBar).css({
      width: percent + '%'
    });
  },
  onComplete: function (id, name, result, xhr) {
    "use strict";
    qq.FineUploaderBasic.prototype.onComplete.apply(this, arguments);
    var item = this.getItemByFileId(id);
    qq(this.find(item, 'statusText')).clearText();
    qq(item).removeClass(this.classes.retrying);
    qq(this.find(item, 'progressBar')).hide();
    if (!this.options.disableCancelForFormUploads || qq.isXhrUploadSupported()) {
      qq(this.find(item, 'cancel')).hide();
    }
    qq(this.find(item, 'spinner')).hide();
    if (result.success) {
      if (this.isDeletePossible()) {
        this.showDeleteLink(id);
      }
      qq(item).addClass(this.classes.success);
      if (this.classes.successIcon) {
        this.find(item, 'finished').style.display = "inline-block";
        qq(item).addClass(this.classes.successIcon);
      }
    } else {
      qq(item).addClass(this.classes.fail);
      if (this.classes.failIcon) {
        this.find(item, 'finished').style.display = "inline-block";
        qq(item).addClass(this.classes.failIcon);
      }
      if (this.options.retry.showButton && !this.preventRetries[id]) {
        qq(item).addClass(this.classes.retryable);
      }
      this.controlFailureTextDisplay(item, result);
    }
  },
  onUpload: function (id, name) {
    "use strict";
    qq.FineUploaderBasic.prototype.onUpload.apply(this, arguments);
    this.showSpinner(id);
  },
  onCancel: function (id, name) {
    "use strict";
    qq.FineUploaderBasic.prototype.onCancel.apply(this, arguments);
    this.removeFileItem(id);
  },
  onBeforeAutoRetry: function (id) {
    "use strict";
    var item, progressBar, failTextEl, retryNumForDisplay, maxAuto, retryNote;
    qq.FineUploaderBasic.prototype.onBeforeAutoRetry.apply(this, arguments);
    item = this.getItemByFileId(id);
    progressBar = this.find(item, 'progressBar');
    this.showCancelLink(item);
    progressBar.style.width = 0;
    qq(progressBar).hide();
    if (this.options.retry.showAutoRetryNote) {
      failTextEl = this.find(item, 'statusText');
      retryNumForDisplay = this.autoRetries[id] + 1;
      maxAuto = this.options.retry.maxAutoAttempts;
      retryNote = this.options.retry.autoRetryNote.replace(/\{retryNum\}/g, retryNumForDisplay);
      retryNote = retryNote.replace(/\{maxAuto\}/g, maxAuto);
      qq(failTextEl).setText(retryNote);
      if (retryNumForDisplay === 1) {
        qq(item).addClass(this.classes.retrying);
      }
    }
  },
  //return false if we should not attempt the requested retry
  onBeforeManualRetry: function (id) {
    "use strict";
    if (qq.FineUploaderBasic.prototype.onBeforeManualRetry.apply(this, arguments)) {
      var item = this.getItemByFileId(id);
      this.find(item, 'progressBar').style.width = 0;
      qq(item).removeClass(this.classes.fail);
      qq(this.find(item, 'statusText')).clearText();
      this.showSpinner(id);
      this.showCancelLink(item);
      return true;
    }
    return false;
  },
  onSubmitDelete: function (id) {
    "use strict";
    if (this.isDeletePossible()) {
      if (this.options.callbacks.onSubmitDelete(id) !== false) {
        if (this.options.deleteFile.forceConfirm) {
          this.showDeleteConfirm(id);
        } else {
          this.sendDeleteRequest(id);
        }
      }
    } else {
      this.log("Delete request ignored for file ID " + id + ", delete feature is disabled.", "warn");
      return false;
    }
  },
  onDeleteComplete: function (id, xhr, isError) {
    "use strict";
    qq.FineUploaderBasic.prototype.onDeleteComplete.apply(this, arguments);
    var item = this.getItemByFileId(id),
      spinnerEl = this.find(item, 'spinner'),
      statusTextEl = this.find(item, 'statusText');
    qq(spinnerEl).hide();
    if (isError) {
      qq(statusTextEl).setText(this.options.deleteFile.deletingFailedText);
      this.showDeleteLink(id);
    } else {
      this.removeFileItem(id);
    }
  },
  sendDeleteRequest: function (id) {
    "use strict";
    var item = this.getItemByFileId(id),
      deleteLink = this.find(item, 'deleteButton'),
      statusTextEl = this.find(item, 'statusText');
    qq(deleteLink).hide();
    this.showSpinner(id);
    qq(statusTextEl).setText(this.options.deleteFile.deletingStatusText);
    this.deleteHandler.sendDelete(id, this.getUuid(id));
  },
  showDeleteConfirm: function (id) {
    "use strict";
    var fileName = this.handler.getName(id),
      confirmMessage = this.options.deleteFile.confirmMessage.replace(/\{filename\}/g, fileName),
      //uuid = this.getUuid(id),
      self = this;
    this.options.showConfirm(confirmMessage, function () {
      self.sendDeleteRequest(id);
    });
  },
  addToList: function (id, name) {
    "use strict";
    var item = qq.toElement(this.options.fileTemplate),
      cancelLink,
      fileElement;

    if (this.options.disableCancelForFormUploads && !qq.isXhrUploadSupported()) {
      cancelLink = this.find(item, 'cancel');
      qq(cancelLink).remove();
    }
    item.qqFileId = id;
    fileElement = this.find(item, 'file');
    qq(fileElement).setText(this.options.formatFileName(name));
    qq(this.find(item, 'size')).hide();
    if (!this.options.multiple) {
      this.handler.cancelAll();
      this.clearList();
    }
    this.listElement.appendChild(item);
    if (this.options.display.fileSizeOnSubmit && qq.isXhrUploadSupported()) {
      this.displayFileSize(id);
    }
  },
  clearList: function () {
    "use strict";
    this.listElement.innerHTML = '';
    this.clearStoredFiles();
  },
  displayFileSize: function (id, loadedSize, totalSize) {
    "use strict";
    var item = this.getItemByFileId(id),
      size = this.getSize(id),
      sizeForDisplay = this.formatSize(size),
      sizeEl = this.find(item, 'size');
    if (loadedSize !== undefined && totalSize !== undefined) {
      sizeForDisplay = this.formatProgress(loadedSize, totalSize);
    }
    qq(sizeEl).css({
      display: 'inline'
    });
    qq(sizeEl).setText(sizeForDisplay);
  },
  /**
   * delegate click event for cancel & retry links
   **/
  bindCancelAndRetryEvents: function () {
    "use strict";
    var self = this,
      list = this.listElement;

    this.disposeSupport.attach(list, 'click', function (e) {
      var target,
        item;

      e = e || window.event;
      target = e.target || e.srcElement;
      if (qq(target).hasClass(self.classes.cancel) || qq(target).hasClass(self.classes.retry) || qq(target).hasClass(self.classes.deleteButton)) {
        qq.preventDefault(e);
        item = target.parentNode;
        while (item.qqFileId === undefined) {
          item = target = target.parentNode;
        }
        if (qq(target).hasClass(self.classes.deleteButton)) {
          self.deleteFile(item.qqFileId);
        } else if (qq(target).hasClass(self.classes.cancel)) {
          self.cancel(item.qqFileId);
        } else {
          qq(item).removeClass(self.classes.retryable);
          self.retry(item.qqFileId);
        }
      }
    });
  },
  formatProgress: function (uploadedSize, totalSize) {
    "use strict";
    var message = this.options.text.formatProgress;

    function r(name, replacement) {
      message = message.replace(name, replacement);
    }
    r('{percent}', Math.round(uploadedSize / totalSize * 100));
    r('{total_size}', this.formatSize(totalSize));
    return message;
  },
  controlFailureTextDisplay: function (item, response) {
    "use strict";
    var mode, maxChars, responseProperty, failureReason, shortFailureReason;
    mode = this.options.failedUploadTextDisplay.mode;
    maxChars = this.options.failedUploadTextDisplay.maxChars;
    responseProperty = this.options.failedUploadTextDisplay.responseProperty;
    if (mode === 'custom') {
      failureReason = response[responseProperty];
      if (failureReason) {
        if (failureReason.length > maxChars) {
          shortFailureReason = failureReason.substring(0, maxChars) + '...';
        }
      } else {
        failureReason = this.options.text.failUpload;
        this.log("'" + responseProperty + "' is not a valid property on the server response.", 'warn');
      }
      qq(this.find(item, 'statusText')).setText(shortFailureReason || failureReason);
      if (this.options.failedUploadTextDisplay.enableTooltip) {
        this.showTooltip(item, failureReason);
      }
    } else if (mode === 'default') {
      qq(this.find(item, 'statusText')).setText(this.options.text.failUpload);
    } else if (mode !== 'none') {
      this.log("failedUploadTextDisplay.mode value of '" + mode + "' is not valid", 'warn');
    }
  },
  showTooltip: function (item, text) {
    "use strict";
    item.title = text;
  },
  showSpinner: function (id) {
    "use strict";
    var item = this.getItemByFileId(id),
      spinnerEl = this.find(item, 'spinner');
    spinnerEl.style.display = "inline-block";
  },
  showCancelLink: function (item) {
    "use strict";
    if (!this.options.disableCancelForFormUploads || qq.isXhrUploadSupported()) {
      var cancelLink = this.find(item, 'cancel');
      qq(cancelLink).css({
        display: 'inline'
      });
    }
  },
  showDeleteLink: function (id) {
    "use strict";
    var item = this.getItemByFileId(id),
      deleteLink = this.find(item, 'deleteButton');
    qq(deleteLink).css({
      display: 'inline'
    });
  },
  error: function (code, name) {
    "use strict";
    var message = qq.FineUploaderBasic.prototype.error.apply(this, arguments);
    this.options.showMessage(message);
  }
});

