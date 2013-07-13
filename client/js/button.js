/*jslint browser: true, unparam: true, indent: 2 */
/*globals qq */

qq.UploadButton = function (o) {
  "use strict";
  this.options = {
    element: null,
    // if set to true adds multiple attribute to file input
    multiple: false,
    acceptFiles: null,
    // name attribute of file input
    name: 'file',
    onChange: function (input) { return null; },
    hoverClass: 'qq-upload-button-hover',
    focusClass: 'qq-upload-button-focus'
  };
  qq.extend(this.options, o);
  this.disposeSupport = new qq.DisposeSupport();
  this.element = this.options.element;
  // make button suitable container for input
  qq(this.element).css({
    position: 'relative',
    overflow: 'hidden',
    // Make sure browse button is in the right side
    // in Internet Explorer
    direction: 'ltr'
  });
  this.input = this.createInput();
};
qq.UploadButton.prototype = {
  /* returns file input element */
  getInput: function () {
    "use strict";
    return this.input;
  },
  /* cleans/recreates the file input */
  reset: function () {
    "use strict";
    if (this.input.parentNode) {
      qq(this.input).remove();
    }
    qq(this.element).removeClass(this.options.focusClass);
    this.input = this.createInput();
  },
  createInput: function () {
    "use strict";
    var input = document.createElement("input"),
      self;
    if (this.options.multiple) {
      input.setAttribute("multiple", "multiple");
    }
    if (this.options.acceptFiles) {
      input.setAttribute("accept", this.options.acceptFiles);
    }
    input.setAttribute("type", "file");
    input.setAttribute("name", this.options.name);
    qq(input).css({
      position: 'absolute',
      // in Opera only 'browse' button
      // is clickable and it is located at
      // the right side of the input
      right: 0,
      top: 0,
      fontFamily: 'Arial',
      // 4 persons reported this, the max values that worked for them were 243, 236, 236, 118
      fontSize: '118px',
      margin: 0,
      padding: 0,
      cursor: 'pointer',
      opacity: 0
    });
    this.element.appendChild(input);
    self = this;
    this.disposeSupport.attach(input, 'change', function () {
      self.options.onChange(input);
    });
    this.disposeSupport.attach(input, 'mouseover', function () {
      qq(self.element).addClass(self.options.hoverClass);
    });
    this.disposeSupport.attach(input, 'mouseout', function () {
      qq(self.element).removeClass(self.options.hoverClass);
    });
    this.disposeSupport.attach(input, 'focus', function () {
      qq(self.element).addClass(self.options.focusClass);
    });
    this.disposeSupport.attach(input, 'blur', function () {
      qq(self.element).removeClass(self.options.focusClass);
    });
    // IE and Opera, unfortunately have 2 tab stops on file input
    // which is unacceptable in our case, disable keyboard access
    if (window.attachEvent) {
      // it is IE or Opera
      input.setAttribute('tabIndex', "-1");
    }
    return input;
  }
};

