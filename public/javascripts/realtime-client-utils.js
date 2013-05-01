// Generated by CoffeeScript 1.4.0
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define(function() {
  /*
    Copyright 2013 Google Inc. All Rights Reserved.
  
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
  
    http://www.apache.org/licenses/LICENSE-2.0
  
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
  */

  "use strict";

  /*
    @fileoverview Common utility functionality for Google Drive Realtime API,
    including authorization and file loading. This functionality should serve
    mostly as a well-documented example, though is usable in its own right.
  */

  /*
    @namespace Realtime client utilities namespace.
  */

  var RTClient;
  RTClient = (function() {
    /*
        OAuth 2.0 scope for installing Drive Apps.
        @const
    */

    RTClient.prototype.INSTALL_SCOPE = "https://www.googleapis.com/auth/drive.install";

    /*
        OAuth 2.0 scope for opening and creating files.
        @const
    */


    RTClient.prototype.FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

    /*
        OAuth 2.0 scope for accessing the user's ID.
        @const
    */


    RTClient.prototype.OPENID_SCOPE = "openid";

    /*
        MIME type for newly created Realtime files.
        @const
    */


    RTClient.prototype.REALTIME_MIMETYPE = "application/vnd.google-apps.drive-sdk";

    /*
        Parses the query parameters to this page and returns them as an object.
        @function
    */


    function RTClient(window) {
      this.window = window;
      /*
            Instance of the query parameters.
      */

      this.params = this.getParams();
    }

    /*
        Parses the query parameters to this page and returns them as an object.
        @function
    */


    RTClient.prototype.getParams = function() {
      var i, paramStr, paramStrs, params, queryString;
      params = {};
      queryString = this.window.location.search;
      if (queryString) {
        paramStrs = queryString.slice(1).split("&");
        i = 0;
        while (i < paramStrs.length) {
          paramStr = paramStrs[i].split("=");
          params[paramStr[0]] = unescape(paramStr[1]);
          i++;
        }
      }
      return params;
    };

    /*
        Fetches an option from options or a default value, logging an error if
        neither is available.
        @param options {Object} containing options.
        @param key {string} option key.
        @param defaultValue {Object} default option value (optional).
    */


    RTClient.prototype.getOption = function(options, key, defaultValue) {
      var value;
      value = (typeof options[key] === 'undefined' ? defaultValue : options[key]);
      if (typeof value === 'undefined') {
        console.error(key + " should be present in the options.");
      }
      return value;
    };

    /*
        Creates a new Realtime file.
        @param title {string} title of the newly created file.
        @param callback {Function} the callback to call after creation.
    */


    RTClient.prototype.createRealtimeFile = function(title, callback) {
      var _this = this;
      return gapi.client.load("drive", "v2", function() {
        return gapi.client.drive.files.insert({
          resource: {
            mimeType: _this.REALTIME_MIMETYPE,
            title: title
          }
        }).execute(callback);
      });
    };

    /*
        Fetches the metadata for a Realtime file.
        @param fileId {string} the file to load metadata for.
        @param callback {Function} the callback to be called on completion, with signature:
    
        function onGetFileMetadata(file) {}
    
        where the file parameter is a Google Drive API file resource instance.
    */


    RTClient.prototype.getFileMetadata = function(fileId, callback) {
      return gapi.client.load("drive", "v2", function() {
        return gapi.client.drive.files.get({
          fileId: id
        }).execute(callback);
      });
    };

    /*
        Parses the state parameter passed from the Drive user interface after Open
        With operations.
        @param stateParam {Object} the state query parameter as an object or null if
        parsing failed.
    */


    RTClient.prototype.parseState = function(stateParam) {
      var stateObj;
      try {
        stateObj = JSON.parse(stateParam);
        return stateObj;
      } catch (e) {
        return null;
      }
    };

    /*
        Redirects the browser back to the current page with an appropriate file ID.
        @param fileId {string} the file ID to redirect to.
        @param userId {string} the user ID to redirect to.
    */


    RTClient.prototype.redirectTo = function(fileId, userId) {
      var params;
      params = [];
      if (fileId) {
        params.push("fileId=" + fileId);
      }
      if (userId) {
        params.push("userId=" + userId);
      }
      return this.window.location.href = (params.length === 0 ? "/" : "?" + params.join("&"));
    };

    RTClient.prototype.getRealtimeLoader = function(options) {
      var _ref;
      if ((_ref = this.realtimeLoader) == null) {
        this.realtimeLoader = new this.RealtimeLoader(this, options);
      }
      return this.realtimeLoader;
    };

    return RTClient;

  })();
  /*
    Handles authorizing, parsing query parameters, loading and creating Realtime
    documents.
    @constructor
    @param options {Object} options for loader. Four keys are required as mandatory, these are:
  
    1. "clientId", the Client ID from the APIs Console
    2. "initializeModel", the callback to call when the file is loaded.
    3. "onFileLoaded", the callback to call when the model is first created.
  
    and one key is optional:
  
    1. "defaultTitle", the title of newly created Realtime files.
  */

  RTClient.prototype.RealtimeLoader = (function() {

    function RealtimeLoader(rtclient, options) {
      this.rtclient = rtclient;
      this.options = options;
      this.onFileLoaded = this.rtclient.getOption(this.options, "onFileLoaded");
      this.initializeModel = this.rtclient.getOption(this.options, "initializeModel");
      this.registerTypes = this.rtclient.getOption(this.options, "registerTypes", function() {});
      this.autoCreate = this.rtclient.getOption(this.options, "autoCreate", false);
      this.defaultTitle = this.rtclient.getOption(this.options, "defaultTitle", "New Realtime File");
      this.authorizer = new this.rtclient.Authorizer(this.rtclient, this.options);
    }

    /*
        Starts the loader by authorizing.
        @param callback {Function} afterAuth callback called after authorization.
    */


    RealtimeLoader.prototype.start = function(afterAuth) {
      var _this = this;
      return this.authorizer.start(function() {
        if (_this.registerTypes) {
          _this.registerTypes();
        }
        if (afterAuth) {
          afterAuth();
        }
        return _this.load();
      });
    };

    /*
        Loads or creates a Realtime file depending on the fileId and state query
        parameters.
    */


    RealtimeLoader.prototype.load = function() {
      var fileId, handleErrors, state, stateObj, userId,
        _this = this;
      fileId = this.rtclient.params["fileId"];
      userId = this.authorizer.userId;
      state = this.rtclient.params["state"];
      handleErrors = function(e) {
        if (e.type === gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
          return _this.authorizer.authorize();
        } else if (e.type === gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
          alert("An Error happened: " + e.message);
          return _this.rtclient.window.location.href = "/";
        } else if (e.type === gapi.drive.realtime.ErrorType.NOT_FOUND) {
          alert("The file was not found. It does not exist or you do not have read access to the file.");
          return _this.rtclient.window.location.href = "/";
        }
      };
      if (fileId) {
        gapi.drive.realtime.load(fileId, this.onFileLoaded, this.initializeModel, handleErrors);
        return;
      } else if (state) {
        stateObj = this.rtclient.parseState(state);
        if (stateObj.action === "open") {
          fileId = stateObj.ids[0];
          userId = stateObj.userId;
          this.rtclient.redirectTo(fileId, userId);
          return;
        }
      }
      if (this.autoCreate) {
        return this.createNewFileAndRedirect();
      }
    };

    /*
        Creates a new file and redirects to the URL to load it.
    */


    RealtimeLoader.prototype.createNewFileAndRedirect = function() {
      var _this = this;
      return this.rtclient.createRealtimeFile(this.defaultTitle, function(file) {
        if (file.id) {
          return _this.rtclient.redirectTo(file.id, _this.authorizer.userId);
        } else {
          console.error("Error creating file.");
          return console.error(file);
        }
      });
    };

    return RealtimeLoader;

  })();
  /*
    Creates a new Authorizer from the options.
    @constructor
    @param options {Object} for authorizer. Two keys are required as mandatory, these are:
  
    1. "clientId", the Client ID from the APIs Console
  */

  RTClient.prototype.Authorizer = (function() {

    function Authorizer(rtclient, options) {
      this.rtclient = rtclient;
      this.options = options;
      this.authorize = __bind(this.authorize, this);

      this.clientId = this.rtclient.getOption(this.options, "clientId");
      this.userId = rtclient.params["userId"];
      this.authButton = document.getElementById(rtclient.getOption(this.options, "authButtonElementId"));
    }

    /*
        Start the authorization process.
        @param onAuthComplete {Function} to call once authorization has completed.
    */


    Authorizer.prototype.start = function(onAuthComplete) {
      var _this = this;
      return gapi.load("auth:client,drive-realtime,drive-share", function() {
        return _this.authorize(onAuthComplete);
      });
    };

    /*
        Reauthorize the client with no callback (used for authorization failure).
        @param onAuthComplete {Function} to call once authorization has completed.
    */


    Authorizer.prototype.authorize = function(onAuthComplete) {
      var authorizeWithPopup, clientId, handleAuthResult, userId,
        _this = this;
      clientId = this.clientId;
      userId = this.userId;
      handleAuthResult = function(authResult) {
        if (authResult && !authResult.error) {
          _this.authButton.disabled = true;
          return _this.fetchUserId(onAuthComplete);
        } else {
          _this.authButton.disabled = false;
          return _this.authButton.onclick = authorizeWithPopup;
        }
      };
      authorizeWithPopup = function() {
        return gapi.auth.authorize({
          client_id: clientId,
          scope: [_this.rtclient.INSTALL_SCOPE, _this.rtclient.FILE_SCOPE, _this.rtclient.OPENID_SCOPE],
          user_id: userId,
          immediate: false
        }, handleAuthResult);
      };
      return gapi.auth.authorize({
        client_id: clientId,
        scope: [this.rtclient.INSTALL_SCOPE, this.rtclient.FILE_SCOPE, this.rtclient.OPENID_SCOPE],
        user_id: userId,
        immediate: true
      }, handleAuthResult);
    };

    /*
        Fetch the user ID using the UserInfo API and save it locally.
        @param callback {Function} the callback to call after user ID has been
        fetched.
    */


    Authorizer.prototype.fetchUserId = function(callback) {
      var _this = this;
      return gapi.client.load("oauth2", "v2", function() {
        return gapi.client.oauth2.userinfo.get().execute(function(resp) {
          if (resp.id) {
            _this.userId = resp.id;
          }
          if (callback) {
            return callback();
          }
        });
      });
    };

    return Authorizer;

  })();
  return {
    RTClient: RTClient
  };
});
