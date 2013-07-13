/*jslint browser: true, unparam: true, indent: 2 */
/*globals qq, File, XMLHttpRequest, FormData, Blob */

qq.UploadHandlerXhr = function (o, uploadCompleteCallback, logCallback) {
  "use strict";
  var options = o,
    uploadComplete = uploadCompleteCallback,
    log = logCallback,
    fileState = [],
    cookieItemDelimiter = "|",
    chunkFiles = options.chunking.enabled && qq.isFileChunkingSupported(),
    resumeEnabled = options.resume.enabled && chunkFiles && qq.areCookiesEnabled(),
    multipart = options.forceMultipart || options.paramsInBody,
    resumeId,
    addChunkingSpecificParams,
    addResumeSpecificParams,
    getChunk,
    getTotalChunks,
    getChunkData,
    createXhr,
    setParamsAndGetEntityToSend,
    setHeaders,
    isErrorResponse,
    parseResponse,
    getChunkDataCookieName,
    deletePersistedChunkData,
    handleResetResponse,
    getLastRequestOverhead,
    handleCompletedItem,
    handleSuccessfullyCompletedChunk,
    handleResetResponseOnResumeAttempt,
    handleNonResetErrorResponse,
    onComplete,
    persistChunkData,
    getReadyStateChangeHandler,
    calcAllRequestsSizeForChunkedUpload,
    getChunkDataForCallback,
    uploadNextChunk,
    getPersistedChunkData,
    getResumeId,
    handleFileChunkingUpload,
    handleStandardFileUpload,
    api;

  addChunkingSpecificParams = function (id, params, chunkData) {
    var size = api.getSize(id),
      name = api.getName(id);
    params[options.chunking.paramNames.partIndex] = chunkData.part;
    params[options.chunking.paramNames.partByteOffset] = chunkData.start;
    params[options.chunking.paramNames.chunkSize] = chunkData.size;
    params[options.chunking.paramNames.totalParts] = chunkData.count;
    params[options.totalFileSizeParamName] = size;
    /**
     * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
     * or an empty string.  So, we will need to include the actual file name as a param in this case.
     */
    if (multipart) {
      params[options.chunking.paramNames.filename] = name;
    }
  };

  addResumeSpecificParams = function (params) {
    params[options.resume.paramNames.resuming] = true;
  };

  getChunk = function (fileOrBlob, startByte, endByte) {
    if (fileOrBlob.slice) {
      return fileOrBlob.slice(startByte, endByte);
    }
    if (fileOrBlob.mozSlice) {
      return fileOrBlob.mozSlice(startByte, endByte);
    }
    if (fileOrBlob.webkitSlice) {
      return fileOrBlob.webkitSlice(startByte, endByte);
    }
  };

  getTotalChunks = function (id) {
    var fileSize = api.getSize(id),
      chunkSize = options.chunking.partSize;
    return Math.ceil(fileSize / chunkSize);
  };

  getChunkData = function (id, chunkIndex) {
    var chunkSize = options.chunking.partSize,
      fileSize = api.getSize(id),
      fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
      startBytes = chunkSize * chunkIndex,
      endBytes = startBytes + chunkSize >= fileSize ? fileSize : startBytes + chunkSize,
      totalChunks = getTotalChunks(id);
    return {
      part: chunkIndex,
      start: startBytes,
      end: endBytes,
      count: totalChunks,
      blob: getChunk(fileOrBlob, startBytes, endBytes),
      size: endBytes - startBytes
    };
  };

  createXhr = function (id) {
    var xhr = new XMLHttpRequest();
    fileState[id].xhr = xhr;
    return xhr;
  };

  setParamsAndGetEntityToSend = function (params, xhr, fileOrBlob, id) {
    var formData = new FormData(),
      method = options.demoMode ? "GET" : "POST",
      endpoint = options.endpointStore.getEndpoint(id),
      url = endpoint,
      name = api.getName(id),
      size = api.getSize(id),
      blobData = fileState[id].blobData;
    params[options.uuidParamName] = fileState[id].uuid;
    if (multipart) {
      params[options.totalFileSizeParamName] = size;
      if (blobData) {
        /**
         * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
         * or an empty string.  So, we will need to include the actual file name as a param in this case.
         */
        params[options.blobs.paramNames.name] = blobData.name;
      }
    }
    //build query string
    if (!options.paramsInBody) {
      if (!multipart) {
        params[options.inputName] = name;
      }
      url = qq.obj2url(params, endpoint);
    }
    xhr.open(method, url, true);
    if (options.cors.expected && options.cors.sendCredentials) {
      xhr.withCredentials = true;
    }
    if (multipart) {
      if (options.paramsInBody) {
        qq.obj2FormData(params, formData);
      }
      formData.append(options.inputName, fileOrBlob);
      return formData;
    }
    return fileOrBlob;
  };

  setHeaders = function (id, xhr) {
    var extraHeaders = options.customHeaders,
      fileOrBlob = fileState[id].file || fileState[id].blobData.blob;
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Cache-Control", "no-cache");
    if (!multipart) {
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      //NOTE: return mime type in xhr works on chrome 16.0.9 firefox 11.0a2
      xhr.setRequestHeader("X-Mime-Type", fileOrBlob.type);
    }
    qq.each(extraHeaders, function (name, val) {
      xhr.setRequestHeader(name, val);
    });
  };

  isErrorResponse = function (xhr, response) {
    return xhr.status !== 200 || !response.success || response.reset;
  };

  parseResponse = function (xhr) {
    var response;
    try {
      response = qq.parseJson(xhr.responseText);
    } catch (error) {
      log('Error when attempting to parse xhr response text (' + error + ')', 'error');
      response = {};
    }
    return response;
  };

  getChunkDataCookieName = function (id) {
    var filename = api.getName(id),
      fileSize = api.getSize(id),
      maxChunkSize = options.chunking.partSize,
      cookieName;
    cookieName = "qqfilechunk" + cookieItemDelimiter + encodeURIComponent(filename) + cookieItemDelimiter + fileSize + cookieItemDelimiter + maxChunkSize;
    if (resumeId !== undefined) {
      cookieName += cookieItemDelimiter + resumeId;
    }
    return cookieName;
  };

  deletePersistedChunkData = function (id) {
    if (fileState[id].file) {
      var cookieName = getChunkDataCookieName(id);
      qq.deleteCookie(cookieName);
    }
  };

  handleResetResponse = function (id) {
    log('Server has ordered chunking effort to be restarted on next attempt for item ID ' + id, 'error');
    if (resumeEnabled) {
      deletePersistedChunkData(id);
      fileState[id].attemptingResume = false;
    }
    fileState[id].remainingChunkIdxs = [];
    delete fileState[id].loaded;
    delete fileState[id].estTotalRequestsSize;
    delete fileState[id].initialRequestOverhead;
  };

  getLastRequestOverhead = function (id) {
    if (multipart) {
      return fileState[id].lastRequestOverhead;
    }
    return 0;
  };

  handleCompletedItem = function (id, response, xhr) {
    var name = api.getName(id),
      size = api.getSize(id);
    fileState[id].attemptingResume = false;
    options.onProgress(id, name, size, size);
    options.onComplete(id, name, response, xhr);
    delete fileState[id].xhr;
    uploadComplete(id);
  };

  handleSuccessfullyCompletedChunk = function (id, response, xhr) {
    var chunkIdx = fileState[id].remainingChunkIdxs.shift(),
      chunkData = getChunkData(id, chunkIdx);
    fileState[id].attemptingResume = false;
    fileState[id].loaded += chunkData.size + getLastRequestOverhead(id);
    if (fileState[id].remainingChunkIdxs.length > 0) {
      uploadNextChunk(id);
    } else {
      if (resumeEnabled) {
        deletePersistedChunkData(id);
      }
      handleCompletedItem(id, response, xhr);
    }
  };

  handleResetResponseOnResumeAttempt = function (id) {
    fileState[id].attemptingResume = false;
    log("Server has declared that it cannot handle resume for item ID " + id + " - starting from the first chunk", 'error');
    handleResetResponse(id);
    api.upload(id, true);
  };

  handleNonResetErrorResponse = function (id, response, xhr) {
    var name = api.getName(id);
    if (options.onAutoRetry(id, name, response, xhr)) {
      return;
    }
    handleCompletedItem(id, response, xhr);
  };

  onComplete = function (id, xhr) {
    var response;
    // the request was aborted/cancelled
    if (!fileState[id]) {
      return;
    }
    log("xhr - server response received for " + id);
    log("responseText = " + xhr.responseText);
    response = parseResponse(xhr);
    if (isErrorResponse(xhr, response)) {
      if (response.reset) {
        handleResetResponse(id);
      }
      if (fileState[id].attemptingResume && response.reset) {
        handleResetResponseOnResumeAttempt(id);
      } else {
        handleNonResetErrorResponse(id, response, xhr);
      }
    } else if (chunkFiles) {
      handleSuccessfullyCompletedChunk(id, response, xhr);
    } else {
      handleCompletedItem(id, response, xhr);
    }
  };

  persistChunkData = function (id, chunkData) {
    var fileUuid = api.getUuid(id),
      lastByteSent = fileState[id].loaded,
      initialRequestOverhead = fileState[id].initialRequestOverhead,
      estTotalRequestsSize = fileState[id].estTotalRequestsSize,
      cookieName = getChunkDataCookieName(id),
      cookieValue = fileUuid +
        cookieItemDelimiter + chunkData.part +
        cookieItemDelimiter + lastByteSent +
        cookieItemDelimiter + initialRequestOverhead +
        cookieItemDelimiter + estTotalRequestsSize,
      cookieExpDays = options.resume.cookiesExpireIn;
    qq.setCookie(cookieName, cookieValue, cookieExpDays);
  };

  getReadyStateChangeHandler = function (id, xhr) {
    return function () {
      if (xhr.readyState === 4) {
        onComplete(id, xhr);
      }
    };
  };

  calcAllRequestsSizeForChunkedUpload = function (id, chunkIdx, requestSize) {
    var chunkData = getChunkData(id, chunkIdx),
      blobSize = chunkData.size,
      overhead = requestSize - blobSize,
      size = api.getSize(id),
      chunkCount = chunkData.count,
      initialRequestOverhead = fileState[id].initialRequestOverhead,
      overheadDiff = overhead - initialRequestOverhead;
    fileState[id].lastRequestOverhead = overhead;
    if (chunkIdx === 0) {
      fileState[id].lastChunkIdxProgress = 0;
      fileState[id].initialRequestOverhead = overhead;
      fileState[id].estTotalRequestsSize = size + (chunkCount * overhead);
    } else if (fileState[id].lastChunkIdxProgress !== chunkIdx) {
      fileState[id].lastChunkIdxProgress = chunkIdx;
      fileState[id].estTotalRequestsSize += overheadDiff;
    }
    return fileState[id].estTotalRequestsSize;
  };

  getChunkDataForCallback = function (chunkData) {
    return {
      partIndex: chunkData.part,
      startByte: chunkData.start + 1,
      endByte: chunkData.end,
      totalParts: chunkData.count
    };
  };

  uploadNextChunk = function (id) {
    var chunkIdx = fileState[id].remainingChunkIdxs[0],
      chunkData = getChunkData(id, chunkIdx),
      xhr = createXhr(id),
      size = api.getSize(id),
      name = api.getName(id),
      toSend,
      params;
    if (fileState[id].loaded === undefined) {
      fileState[id].loaded = 0;
    }
    if (resumeEnabled && fileState[id].file) {
      persistChunkData(id, chunkData);
    }
    xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        var totalLoaded = e.loaded + fileState[id].loaded,
          estTotalRequestsSize = calcAllRequestsSizeForChunkedUpload(id, chunkIdx, e.total);
        options.onProgress(id, name, totalLoaded, estTotalRequestsSize);
      }
    };
    options.onUploadChunk(id, name, getChunkDataForCallback(chunkData));
    params = options.paramsStore.getParams(id);
    addChunkingSpecificParams(id, params, chunkData);
    if (fileState[id].attemptingResume) {
      addResumeSpecificParams(params);
    }
    toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
    setHeaders(id, xhr);
    log('Sending chunked upload request for item ' + id + ": bytes " + (chunkData.start + 1) + "-" + chunkData.end + " of " + size);
    xhr.send(toSend);
  };

  getPersistedChunkData = function (id) {
    var chunkCookieValue = qq.getCookie(getChunkDataCookieName(id)),
      filename = api.getName(id),
      sections,
      uuid,
      partIndex,
      lastByteSent,
      initialRequestOverhead,
      estTotalRequestsSize;

    if (chunkCookieValue) {
      sections = chunkCookieValue.split(cookieItemDelimiter);
      if (sections.length === 5) {
        uuid = sections[0];
        partIndex = parseInt(sections[1], 10);
        lastByteSent = parseInt(sections[2], 10);
        initialRequestOverhead = parseInt(sections[3], 10);
        estTotalRequestsSize = parseInt(sections[4], 10);
        return {
          uuid: uuid,
          part: partIndex,
          lastByteSent: lastByteSent,
          initialRequestOverhead: initialRequestOverhead,
          estTotalRequestsSize: estTotalRequestsSize
        };
      }
      log('Ignoring previously stored resume/chunk cookie for ' + filename + " - old cookie format", "warn");
    }
  };

  getResumeId = function () {
    if (options.resume.id !== null && options.resume.id !== undefined && !qq.isFunction(options.resume.id) && !qq.isObject(options.resume.id)) {
      return options.resume.id;
    }
  };

  handleFileChunkingUpload = function (id, retry) {
    var name = api.getName(id),
      firstChunkIndex = 0,
      persistedChunkInfoForResume,
      firstChunkDataForResume,
      currentChunkIndex;

    if (!fileState[id].remainingChunkIdxs || fileState[id].remainingChunkIdxs.length === 0) {
      fileState[id].remainingChunkIdxs = [];
      if (resumeEnabled && !retry && fileState[id].file) {
        persistedChunkInfoForResume = getPersistedChunkData(id);
        if (persistedChunkInfoForResume) {
          firstChunkDataForResume = getChunkData(id, persistedChunkInfoForResume.part);
          if (options.onResume(id, name, getChunkDataForCallback(firstChunkDataForResume)) !== false) {
            firstChunkIndex = persistedChunkInfoForResume.part;
            fileState[id].uuid = persistedChunkInfoForResume.uuid;
            fileState[id].loaded = persistedChunkInfoForResume.lastByteSent;
            fileState[id].estTotalRequestsSize = persistedChunkInfoForResume.estTotalRequestsSize;
            fileState[id].initialRequestOverhead = persistedChunkInfoForResume.initialRequestOverhead;
            fileState[id].attemptingResume = true;
            log('Resuming ' + name + " at partition index " + firstChunkIndex);
          }
        }
      }
      for (currentChunkIndex = getTotalChunks(id) - 1; currentChunkIndex >= firstChunkIndex; currentChunkIndex -= 1) {
        fileState[id].remainingChunkIdxs.unshift(currentChunkIndex);
      }
    }
    uploadNextChunk(id);
  };

  handleStandardFileUpload = function (id) {
    var fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
      name = api.getName(id),
      xhr,
      params,
      toSend;

    fileState[id].loaded = 0;
    xhr = createXhr(id);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        fileState[id].loaded = e.loaded;
        options.onProgress(id, name, e.loaded, e.total);
      }
    };
    xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);
    params = options.paramsStore.getParams(id);
    toSend = setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id);
    setHeaders(id, xhr);
    log('Sending upload request for ' + id);
    xhr.send(toSend);
  };

  api = {
    /**
     * Adds File or Blob to the queue
     * Returns id to use with upload, cancel
     **/
    add: function (fileOrBlobData) {
      var id;
      if (fileOrBlobData instanceof File) {
        id = fileState.push({
          file: fileOrBlobData
        }) - 1;
      } else if (fileOrBlobData.blob instanceof Blob) {
        id = fileState.push({
          blobData: fileOrBlobData
        }) - 1;
      } else {
        throw new Error('Passed obj in not a File or BlobData (in qq.UploadHandlerXhr)');
      }
      fileState[id].uuid = qq.getUniqueId();
      return id;
    },
    getName: function (id) {
      var file = fileState[id].file,
        blobData = fileState[id].blobData;
      if (file) {
        // fix missing name in Safari 4
        //NOTE: fixed missing name firefox 11.0a2 file.fileName is actually undefined
        return (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
      }
      return blobData.name;
    },
    getSize: function (id) {
      /*jshint eqnull: true*/
      var fileOrBlob = fileState[id].file || fileState[id].blobData.blob;
      if (qq.isFileOrInput(fileOrBlob)) {
        return fileOrBlob.fileSize !== null ? fileOrBlob.fileSize : fileOrBlob.size;
      }
      return fileOrBlob.size;
    },
    getFile: function (id) {
      if (fileState[id]) {
        return fileState[id].file || fileState[id].blobData.blob;
      }
    },
    /**
     * Returns uploaded bytes for file identified by id
     */
    getLoaded: function (id) {
      return fileState[id].loaded || 0;
    },
    isValid: function (id) {
      return fileState[id] !== undefined;
    },
    reset: function () {
      fileState = [];
    },
    getUuid: function (id) {
      return fileState[id].uuid;
    },
    /**
     * Sends the file identified by id to the server
     */
    upload: function (id, retry) {
      var name = this.getName(id);
      options.onUpload(id, name);
      if (chunkFiles) {
        handleFileChunkingUpload(id, retry);
      } else {
        handleStandardFileUpload(id);
      }
    },
    cancel: function (id) {
      var xhr = fileState[id].xhr;
      options.onCancel(id, this.getName(id));
      if (xhr) {
        xhr.onreadystatechange = null;
        xhr.abort();
      }
      if (resumeEnabled) {
        deletePersistedChunkData(id);
      }
      delete fileState[id];
    },
    getResumableFilesData: function () {
      var matchingCookieNames = [],
        resumableFilesData = [],
        cookiesNameParts,
        cookieValueParts;

      if (chunkFiles && resumeEnabled) {
        if (resumeId === undefined) {
          matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
            cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + options.chunking.partSize + "="));
        } else {
          matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
            cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + options.chunking.partSize + "\\" +
            cookieItemDelimiter + resumeId + "="));
        }
        qq.each(matchingCookieNames, function (idx, cookieName) {
          cookiesNameParts = cookieName.split(cookieItemDelimiter);
          cookieValueParts = qq.getCookie(cookieName).split(cookieItemDelimiter);
          resumableFilesData.push({
            name: decodeURIComponent(cookiesNameParts[1]),
            size: cookiesNameParts[2],
            uuid: cookieValueParts[0],
            partIdx: cookieValueParts[1]
          });
        });
        return resumableFilesData;
      }
      return [];
    }
  };
  resumeId = getResumeId();
  return api;
};

