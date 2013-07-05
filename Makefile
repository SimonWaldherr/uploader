#
# BUILD FILE-UPLOADER
#

build:
	cat ./client/js/header.js ./client/js/util.js ./client/js/button.js ./client/js/ajax.requester.js ./client/js/deletefile.ajax.requester.js ./client/js/handler.base.js ./client/js/window.receive.message.js ./client/js/handler.form.js ./client/js/handler.xhr.js ./client/js/uploader.basic.js ./client/js/dnd.js ./client/js/uploader.js > ./client/uploader.js
	sudo sh ./client/compressjs.sh ./client/uploader.js