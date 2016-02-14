// ==UserScript==
// @name        Fibaro HC2 Debug
// @namespace   http://www.domotique-fibaro.fr
// @description Agrandie la fenêtre de debug et ajoute un bouton de copie dans le presse-papier
// @include     http://*/fibaro/*/devices/virtual_edit.html*
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
 *** Click button copy to clipboard using jQuery :
 ***  http://stackoverflow.com/questions/22581345/click-button-copy-to-clipboard-using-jquery
 ***  https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
 ***
 *** Copy/cut Browser compatibility :
 ***  Chrome 42, Firefox 41, IE 9, Opera 29, Safari N/A
 ***/


/***
 *** HC2 debug window layout
 ***

	headtitle : 32

	kitbody :
	padding : 2 x 40 => 2 x 10
	border-bottom : 1

	kitiPhone : 38
	padding : 20
	margin : 7+8

	button : 22
	margin-top : 20
	padding-top : 4

	zone texte : 300 => 500
	+padding 2x15
	+margin-top:20
	border : 2 x 1

	=> 511

	511 - 300 - 2*30 = 151

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

		//*** Modify window size
		var windowHeight = jQ(window).height();
		var windowWidth = jQ(window).width();
		var debugWindowMargin = windowHeight / 2 - 20;
		var sceneLogHeight;
		if ( jQ('div#debugWindow div.kitiPhone').length ) {
			sceneLogHeight = windowHeight - 151 - 40 - 68;
		}
		else {
			sceneLogHeight = windowHeight - 151 - 40;
		}
		var debugWindowWidth = windowWidth * 0.75;
		jQ('div#debugWindow').css({'margin-top':'-'+debugWindowMargin+'px', 'margin-left':'-'+debugWindowWidth/2+'px', 'width':debugWindowWidth+'px'});
		jQ('div#debugWindow div.kitHeadtitle').css({'width':debugWindowWidth+'px', 'background-size':debugWindowWidth+'px 32px', 'background-repeat':'no-repeat'});
		jQ('div#debugWindow div.kitBody').css({'padding':'10px','width':debugWindowWidth-20+'px'});
		jQ('div#sceneLog').css({'height':sceneLogHeight+'px', 'width':debugWindowWidth-51+'px'});

		//*** Check if Copy to Clipboard is supported and if Virtual Device Main Loop debug only
		if (document.queryCommandSupported("copy") && ! jQ('div#debugWindow div.kitiPhone').length) {

			//*** Add "Copier" button and bind click event
			jQ('<a id="Button_Copy" href="#" style="margin: 20px 0px 0px 20px;" class="Button1_0">Copier</a>').insertBefore('div#sceneLog').on("click", function() {

				/***
				 *** Function called when user click on the "Copier" button
				 ***/

				//*** Check if Copy to Clipboard is supported & enabled
				if (document.queryCommandSupported("copy")) {
					if (document.queryCommandEnabled("copy")) {
						console.log("Copy to clipboard supported & enabled");
					}
					else {
						alert("Copy to clipboard supported but not enabled");
						return false;
					}
				}
				else {
					alert("Copy to clipboard not supported");
					return false;
				}

				//*** Retrieve HC2 address and Virtual Device ID from current URL
				var currentURL = window.location.href; // http://192.168.x.y/api/virtualDevices/15/debugMessages/0
				var id = currentURL.match(/id=([0-9]+)/);
				if (id) {
					id = id[1];
				}
				else {
					alert("Erreur : impossible de récupérer l'ID depuis l'URL");
					return false;
				}
				var address = currentURL.match(/^(https?:\/\/[a-z0-9.]*)\//);
				if (address) {
					address = address[1];
				}
				else {
					alert("Erreur : impossible de récupérer l'adresse depuis l'URL");
					return false;
				}
				debugURL = address + "/api/virtualDevices/" + id + "/debugMessages/0" // http://192.168.x.y/fibaro/fr/devices/virtual_edit.html?id=15#bookmark-advanced
				console.log("VD debug messages : " + debugURL);

				//*** Create temporary hidden text element, if it doesn't already exist
				var targetId = "_hiddenCopyText_";
				var target = document.getElementById(targetId);
				if (!target) {
						var target = document.createElement("textarea");
						target.style.position = "absolute";
						target.style.left = "-9999px";
						target.style.top = jQ("#Button_Copy").offset().top+"px"; //"0";
						target.id = targetId;
						document.body.appendChild(target);
				}

				//*** Copy debug window logs to hidden textarea
				jQ('div#sceneLog > span').each(function(){
					jQ('#'+targetId).append(jQ(this).text()+"\n"); 
				});
				console.log(jQ('#'+targetId).text());

				//*** Select content
				var currentFocus = document.activeElement;
				target.focus();
				target.setSelectionRange(0, target.value.length);

				//*** Copy selection to clipboard
				var succeed;
				try {
					succeed = document.execCommand("copy");
				} catch(e) {
					succeed = false;
				}

				//*** Restore original focus
				if (currentFocus && typeof currentFocus.focus === "function") {
					currentFocus.focus();
				}

				//*** Clear temporary content
				target.textContent = "";

				//*** Display error message if copy to clipboard did not succeed
				if (!succeed) {
					alert("Erreur lors de la copie vers le presse-papier");
				}

				return false;

			}); // .on("click", function()

		} // if (document.queryCommandSupported("copy"))

		//*** Automatically click on the "Démarrer" button to show debug logs
		jQ('a#startDebug').click();

		//*** Set focus on log area
		setTimeout(
			function() {
				jQ('div#sceneLog').focus();
			},
			100
		);

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
		var controlKey  = selectorTxt.replace (/[^\w]/g, "_");
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
