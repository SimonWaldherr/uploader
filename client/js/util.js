/*jslint browser: true, unparam: true, indent: 2, bitwise: true */
/*globals window, navigator, document, FormData, File, HTMLInputElement, XMLHttpRequest, Blob*/

var qq = function (element) {
  "use strict";
  return {
    hide: function () {
      element.style.display = 'none';
      return this;
    },
    /** Returns the function which detaches attached event */
    attach: function (type, fn) {
      if (element.addEventListener) {
        element.addEventListener(type, fn, false);
      } else if (element.attachEvent) {
        element.attachEvent('on' + type, fn);
      }
      return function () {
        qq(element).detach(type, fn);
      };
    },
    detach: function (type, fn) {
      if (element.removeEventListener) {
        element.removeEventListener(type, fn, false);
      } else if (element.attachEvent) {
        element.detachEvent('on' + type, fn);
      }
      return this;
    },
    contains: function (descendant) {
      // compareposition returns false in this case
      if (element === descendant) {
        return true;
      }
      if (element.contains) {
        return element.contains(descendant);
      }
      return !!(descendant.compareDocumentPosition(element) & 8);
    },
    /**
     * Insert this element before elementB.
     */
    insertBefore: function (elementB) {
      elementB.parentNode.insertBefore(element, elementB);
      return this;
    },
    remove: function () {
      element.parentNode.removeChild(element);
      return this;
    },
    /**
     * Sets styles for an element.
     * Fixes opacity in IE6-8.
     */
    css: function (styles) {
      if (styles.opacity !== null) {
        if (typeof element.style.opacity !== 'string' && (element.filters) !== undefined) {
          styles.filter = 'alpha(opacity=' + Math.round(100 * styles.opacity) + ')';
        }
      }
      qq.extend(element.style, styles);
      return this;
    },
    hasClass: function (name) {
      var re = new RegExp('(^| )' + name + '( |$)');
      return re.test(element.className);
    },
    addClass: function (name) {
      if (!qq(element).hasClass(name)) {
        element.className += ' ' + name;
      }
      return this;
    },
    removeClass: function (name) {
      var re = new RegExp('(^| )' + name + '( |$)');
      element.className = element.className.replace(re, ' ').replace(/^\s+|\s+$/g, "");
      return this;
    },
    getByClass: function (className) {
      var candidates,
        result = [];
      if (element.querySelectorAll) {
        return element.querySelectorAll('.' + className);
      }
      candidates = element.getElementsByTagName("*");
      qq.each(candidates, function (idx, val) {
        if (qq(val).hasClass(className)) {
          result.push(val);
        }
      });
      return result;
    },
    children: function () {
      var children = [],
        child = element.firstChild;
      while (child) {
        if (child.nodeType === 1) {
          children.push(child);
        }
        child = child.nextSibling;
      }
      return children;
    },
    setText: function (text) {
      element.innerText = text;
      element.textContent = text;
      return this;
    },
    clearText: function () {
      return qq(element).setText("");
    }
  };
};
qq.log = function (message, level) {
  "use strict";
  if (window.console) {
    if (!level || level === 'info') {
      window.console.log(message);
    } else {
      if (window.console[level]) {
        window.console[level](message);
      } else {
        window.console.log('<' + level + '> ' + message);
      }
    }
  }
};
qq.isObject = function (variable) {
  "use strict";
  return ((variable !== null) && variable && (typeof variable === "object") && (variable.constructor === Object));
};
qq.isFunction = function (variable) {
  "use strict";
  return (typeof variable === "function");
};
qq.trimStr = function (string) {
  "use strict";
  if (String.prototype.trim) {
    return string.trim();
  }
  return string.replace(/^\s+|\s+$/g, '');
};
qq.isFileOrInput = function (maybeFileOrInput) {
  "use strict";
  if (qq.isBlob(maybeFileOrInput) && window.File && maybeFileOrInput instanceof File) {
    return true;
  }
  if (window.HTMLInputElement) {
    if (maybeFileOrInput instanceof HTMLInputElement) {
      if (maybeFileOrInput.type && maybeFileOrInput.type.toLowerCase() === 'file') {
        return true;
      }
    }
  } else if (maybeFileOrInput.tagName) {
    if (maybeFileOrInput.tagName.toLowerCase() === 'input') {
      if (maybeFileOrInput.type && maybeFileOrInput.type.toLowerCase() === 'file') {
        return true;
      }
    }
  }
  return false;
};
qq.isBlob = function (maybeBlob) {
  "use strict";
  return window.Blob && maybeBlob instanceof Blob;
};
qq.isXhrUploadSupported = function () {
  "use strict";
  var input = document.createElement('input');
  input.type = 'file';
  return (input.multiple !== undefined && File !== undefined && FormData !== undefined && (new XMLHttpRequest()).upload !== undefined);
};
qq.isFolderDropSupported = function (dataTransfer) {
  "use strict";
  return (dataTransfer.items && dataTransfer.items[0].webkitGetAsEntry);
};
qq.isFileChunkingSupported = function () {
  "use strict";
  return !qq.android() && qq.isXhrUploadSupported() && (File.prototype.slice || File.prototype.webkitSlice || File.prototype.mozSlice);
};
qq.extend = function (first, second, extendNested) {
  "use strict";
  qq.each(second, function (prop, val) {
    if (extendNested && qq.isObject(val)) {
      if (first[prop] === undefined) {
        first[prop] = {};
      }
      qq.extend(first[prop], val, true);
    } else {
      first[prop] = val;
    }
  });
};
/**
 * Searches for a given element in the array, returns -1 if it is not present.
 * @param {Number} [from] The index at which to begin the search
 */
qq.indexOf = function (arr, elt, from) {
  "use strict";
  var len = arr.length, i;
  if (arr.indexOf) {
    return arr.indexOf(elt, from);
  }
  from = from || 0;
  if (from < 0) {
    from += len;
  }
  for (i = 0; from < len; from += 1) {
    if (arr.hasOwnProperty(from) && arr[from] === elt) {
      return from;
    }
    i += 1;
    if (i > len) {
      return -1;
    }
  }
  return -1;
};
//this is a version 4 UUID
qq.getUniqueId = function () {
  "use strict";
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    /*jslint eqeq: true, bitwise: true*/
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
//
// Browsers and platforms detection
qq.ie = function () {
  "use strict";
  return navigator.userAgent.indexOf('MSIE') !== -1;
};
qq.ie10 = function () {
  "use strict";
  return navigator.userAgent.indexOf('MSIE 10') !== -1;
};
qq.safari = function () {
  "use strict";
  return navigator.vendor !== undefined && navigator.vendor.indexOf("Apple") !== -1;
};
qq.chrome = function () {
  "use strict";
  return navigator.vendor !== undefined && navigator.vendor.indexOf('Google') !== -1;
};
qq.firefox = function () {
  "use strict";
  return (navigator.userAgent.indexOf('Mozilla') !== -1 && navigator.vendor !== undefined && navigator.vendor === '');
};
qq.windows = function () {
  "use strict";
  return navigator.platform === "Win32";
};
qq.android = function () {
  "use strict";
  return navigator.userAgent.toLowerCase().indexOf('android') !== -1;
};
//
// Events
qq.preventDefault = function (e) {
  "use strict";
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
};
/**
 * Creates and returns element from html string
 * Uses innerHTML to create an element
 */
qq.toElement = (function () {
  "use strict";
  var div = document.createElement('div');
  return function (html) {
    div.innerHTML = html;
    var element = div.firstChild;
    div.removeChild(element);
    return element;
  };
}());
//key and value are passed to callback for each item in the object or array
qq.each = function (obj, callback) {
  "use strict";
  var key, retVal;
  if (obj) {
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        retVal = callback(key, obj[key]);
        if (retVal === false) {
          break;
        }
      }
    }
  }
};
/**
 * obj2url() takes a json-object as argument and generates
 * a querystring.
 *
 * how to use:
 *
 *    `qq.obj2url({a:'b',c:'d'},'http://any.url/upload?otherParam=value');`
 *
 * will result in:
 *
 *    `http://any.url/upload?otherParam=value&a=b&c=d`
 *
 * @param  Object JSON-Object
 * @param  String current querystring-part
 * @return String encoded querystring
 */
qq.obj2url = function (obj, temp, prefixDone) {
  "use strict";
  /*jshint laxbreak: true*/
  var i, len,
    uristrings = [],
    prefix = '&',
    add = function (nextObj, i) {
      var nextTemp = temp ? (/\[\]$/.test(temp)) ? temp : temp + '[' + i + ']' : i;
      if ((nextTemp !== undefined) && (i !== undefined)) {
        uristrings.push(
          (typeof nextObj === 'object') ? qq.obj2url(nextObj, nextTemp, true) : (Object.prototype.toString.call(nextObj) === '[object Function]') ? encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj()) : encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj)
        );
      }
    };
  if (!prefixDone && temp) {
    prefix = (/\?/.test(temp)) ? (/\?$/.test(temp)) ? '' : '&' : '?';
    uristrings.push(temp);
    uristrings.push(qq.obj2url(obj));
  } else if ((Object.prototype.toString.call(obj) === '[object Array]') && (obj !== undefined)) {
    // we wont use a for-in-loop on an array (performance)
    for (i = -1, len = obj.length; i < len; i += 1) {
      add(obj[i], i);
    }
  } else if ((obj !== undefined) && (obj !== null) && (typeof obj === "object")) {
    // for anything else but a scalar, we will use for-in-loop
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        add(obj[i], i);
      }
    }
  } else {
    uristrings.push(encodeURIComponent(temp) + '=' + encodeURIComponent(obj));
  }
  if (temp) {
    return uristrings.join(prefix);
  }
  return uristrings.join(prefix).replace(/^&/, '').replace(/%20/g, '+');
};
qq.obj2FormData = function (obj, formData, arrayKeyName) {
  "use strict";
  if (!formData) {
    formData = new FormData();
  }
  qq.each(obj, function (key, val) {
    key = arrayKeyName ? arrayKeyName + '[' + key + ']' : key;
    if (qq.isObject(val)) {
      qq.obj2FormData(val, formData, key);
    } else if (qq.isFunction(val)) {
      formData.append(key, val());
    } else {
      formData.append(key, val);
    }
  });
  return formData;
};
qq.obj2Inputs = function (obj, form) {
  "use strict";
  var input;
  if (!form) {
    form = document.createElement('form');
  }
  qq.obj2FormData(obj, {
    append: function (key, val) {
      input = document.createElement('input');
      input.setAttribute('name', key);
      input.setAttribute('value', val);
      form.appendChild(input);
    }
  });
  return form;
};
qq.setCookie = function (name, value, days) {
  "use strict";
  var date = new Date(),
    expires = "";
  if (days) {
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toGMTString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
};
qq.getCookie = function (name) {
  "use strict";
  var nameEQ = name + "=",
    ca = document.cookie.split(';'),
    c,
    i;

  for (i = 0; i < ca.length; i += 1) {
    c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
};
qq.getCookieNames = function (regexp) {
  "use strict";
  var cookies = document.cookie.split(';'),
    cookieNames = [],
    equalsIdx;

  qq.each(cookies, function (idx, cookie) {
    cookie = qq.trimStr(cookie);
    equalsIdx = cookie.indexOf("=");
    if (cookie.match(regexp)) {
      cookieNames.push(cookie.substr(0, equalsIdx));
    }
  });
  return cookieNames;
};
qq.deleteCookie = function (name) {
  "use strict";
  qq.setCookie(name, "", -1);
};
qq.areCookiesEnabled = function () {
  "use strict";
  var randNum = Math.random() * 100000,
    name = "qqCookieTest:" + randNum;
  qq.setCookie(name, 1);
  if (qq.getCookie(name)) {
    qq.deleteCookie(name);
    return true;
  }
  return false;
};
/**
 * Not recommended for use outside of Fine Uploader since this falls back to an unchecked eval if JSON.parse is not
 * implemented.  For a more secure JSON.parse polyfill, use Douglas Crockford's json2.js.
 */
qq.parseJson = function (json) {
  "use strict";
  if (window.JSON && qq.isFunction(JSON.parse)) {
    return JSON.parse(json);
  }
  /*jslint evil: true */
  return eval("(" + json + ")");
};
/**
 * A generic module which supports object disposing in dispose() method.
 * */
qq.DisposeSupport = function () {
  "use strict";
  var disposers = [];
  return {
    /** Run all registered disposers */
    dispose: function () {
      var disposer;
      do {
        disposer = disposers.shift();
        if (disposer) {
          disposer();
        }
      } while (disposer);
    },
    /** Attach event handler and register de-attacher as a disposer */
    attach: function () {
      var args = arguments;
      this.addDisposer(qq(args[0]).attach.apply(this, Array.prototype.slice.call(arguments, 1)));
    },
    /** Add disposer to the collection */
    addDisposer: function (disposeFunction) {
      disposers.push(disposeFunction);
    }
  };
};

