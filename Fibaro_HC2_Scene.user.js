// ==UserScript==
// @name        Fibaro HC2 Scene
// @namespace   http://www.domotique-fibaro.fr
// @description Agrandie la fenêtre d'édition et de debug des scènes
// @author      Lazer
// @include     http://*/fibaro/*/scenes/edit.html*
// @include     https://*/fibaro/*/scenes/edit.html*
// @version     1.0
// @grant       none
// ==/UserScript==


/***
 *** References
 ***
 *** Using jQuery with a user script :
 ***  http://stackoverflow.com/questions/2246901/how-can-i-use-jquery-in-greasemonkey-scripts-in-google-chrome
 ***  http://web.archive.org/web/20130804120117/http://erikvold.com/blog/index.cfm/2010/6/14/using-jquery-with-a-user-script
 ***
 *** Utility function that detects and handles AJAXed content :
 ***  https://gist.github.com/BrockA/2625891
 ***  http://stackoverflow.com/questions/12897446/greasemonkey-wait-for-page-to-load-before-executing-code-techniques
 ***  http://stackoverflow.com/questions/8281441/fire-greasemonkey-script-on-ajax-request/8283815#8283815
 ***
 ***/


/***
 *** Main function
 ***/
function main() {
	// Note : jQ replaces $ to avoid conflicts

	/***
	 *** Function called by waitForKeyElements() after the user has opened the debug window
	 ***/
	var actionFunction = function(jNode) {

		//*** Modify area size
		jQ('div.DeviceEditParametrs').css({'width':'739px', 'padding':'30px 5px'});
		jQ('div.DeviceEditParametrs div.LuaSceneArea').css({'width':'710px'});
		jQ('div#sceneLog').css({'height':'400px', 'width':'705px'});

	}; // var actionFunction = function(jNode)


	/*** waitForKeyElements():  A utility function, for Greasemonkey scripts, that detects and handles AJAXed content.
	 *** Usage example:
	 ***   waitForKeyElements (
	 ***     "div.comments"
	 ***     , commentCallbackFunction
	 ***   );
	 ***   //--- Page-specific function to do what we want when the node is found.
	 ***   function commentCallbackFunction (jNode) {
	 ***     jNode.text ("This comment changed by waitForKeyElements().");
	 ***   }
	 *** IMPORTANT: This function requires your script to have loaded jQuery.
	 ***/
	var waitForKeyElements = function(
		selectorTxt,    // Required: The jQuery selector string that specifies the desired element(s).
		actionFunction, // Required: The code to run when elements are found. It is passed a jNode to the matched element.
		bWaitOnce,      // Optional: If false, will continue to scan for new elements even after the first match is found.
		iframeSelector  // Optional: If set, identifies the iframe to search.
	) {
		var targetNodes, btargetsFound;

		if (typeof iframeSelector == "undefined")
			targetNodes = jQ(selectorTxt);
		else
			targetNodes = jQ(iframeSelector).contents().find(selectorTxt);

		if (targetNodes  &&  targetNodes.length > 0) {
			btargetsFound = true;
			//--- Found target node(s).  Go through each and act if they are new.
			targetNodes.each ( function () {
				var jThis        = jQ(this);
				var alreadyFound = jThis.data ('alreadyFound')  ||  false;

				if (!alreadyFound) {
				//--- Call the payload function.
					var cancelFound = actionFunction (jThis);
					if (cancelFound)
						btargetsFound = false;
					else
						jThis.data ('alreadyFound', true);
				}
			});
		}
		else {
			btargetsFound = false;
		}

		//--- Get the timer-control variable for this selector.
		var controlObj  = waitForKeyElements.controlObj  ||  {};
		var controlKey  = selectorTxt.replace (/[^\\w]/g, "_");
		var timeControl = controlObj [controlKey];

		//--- Now set or clear the timer as appropriate.
		if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
			//--- The only condition where we need to clear the timer.
			clearInterval (timeControl);
			delete controlObj [controlKey]
		}
		else {
			//--- Set a timer, if needed.
			if ( ! timeControl) {
				timeControl = setInterval ( function () {
						waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
					},
					300
				);
				controlObj [controlKey] = timeControl;
			}
		}
		waitForKeyElements.controlObj   = controlObj;
	}

	//*** Wait for user to open debug window
  waitForKeyElements ("#sceneLog", actionFunction, false);
}

/***
 *** Function that loads jQuery and calls a callback function when jQuery has finished loading
 ***/
function addJQuery(callback) {
	var script = document.createElement("script");
	script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
	script.addEventListener('load', function() {
		var script = document.createElement("script");
		script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
		document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

//*** Load jQuery and execute the main function
addJQuery(main);
