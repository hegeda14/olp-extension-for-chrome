var xdebug = (function() {
	var statuses = [];
	// Set a cookie
	function setCookie(name, value, days)
	{
		var exp = new Date();
		exp.setTime(exp.getTime() + (days * 24 * 60 * 60 * 1000));
		document.cookie = name + "=" + value + "; expires=" + exp.toGMTString() + "; path=/";
	}

	// Get the content in a cookie
	function getCookie(name)
	{
		// Search for the start of the goven cookie
		var prefix = name + "=",
			cookieStartIndex = document.cookie.indexOf(prefix),
			cookieEndIndex;

		// If the cookie is not found return null
		if (cookieStartIndex == -1)
		{
			return null;
		}

		// Look for the end of the cookie
		cookieEndIndex = document.cookie.indexOf(";", cookieStartIndex + prefix.length);
		if (cookieEndIndex == -1)
		{
			cookieEndIndex = document.cookie.length;
		}

		// Extract the cookie content
		return unescape(document.cookie.substring(cookieStartIndex + prefix.length, cookieEndIndex));
	}

	// Remove a cookie
	function deleteCookie(name)
	{
		setCookie(name, null, -1);
	}

	// Public methods
	var exposed = {
		// Handles messages from other extension parts
		messageListener : function(request, sender, sendResponse)
		{
			var newStatus,
				idekey = "XDEBUG_ECLIPSE",
				traceTrigger = idekey,
				profileTrigger = idekey;

			// Use the IDE key from the request, if any is given
			if (request.idekey)
			{
				idekey = request.idekey;
			}
			if (request.traceTrigger)
			{
				traceTrigger = request.traceTrigger;
			}
			if (request.profileTrigger)
			{
				profileTrigger = request.profileTrigger;
			}

			// Execute the requested command
			if (request.cmd == "getStatus")
			{
				newStatus = exposed.getStatus(idekey, traceTrigger, profileTrigger);
			}
			else if (request.cmd == "toggleStatus")
			{
				newStatus = exposed.toggleStatus(idekey, traceTrigger, profileTrigger);
			}
			else if (request.cmd == "setStatus")
			{
				newStatus = exposed.setStatus(request.status, idekey, traceTrigger, profileTrigger);
			}

			// Respond with the current status
			sendResponse(statuses);
		},

		// Get current state
		getStatus : function(idekey, traceTrigger, profileTrigger)
		{
			var status = 0;

			if (getCookie("XDEBUG_SESSION") == idekey)
			{
				status = 1;
				if(!statuses.includes(1)) statuses.push(1);
			}
			if (getCookie("XDEBUG_PROFILE") == profileTrigger)
			{
				status = 2;
				if(!statuses.includes(2)) statuses.push(2);
			}
			if (getCookie("XDEBUG_TRACE") == traceTrigger)
			{
				status = 3;
				if(!statuses.includes(3)) statuses.push(3);
			}
			if (getCookie("OLP_DISABLE_AUTO_LOGOUT") == 'true')
			{
				status = 4;
				if(!statuses.includes(4)) statuses.push(4);
			}
			if (getCookie("OLP_DISABLE_FRONTEND_PERMISSION_CHECK") == 'true')
			{
				status = 5;
				if(!statuses.includes(5)) statuses.push(5);
			}

			return status;
		},

		getStatuses(idekey, traceTrigger, profileTrigger) {
			exposed.getStatus(idekey, traceTrigger, profileTrigger);
			return statuses;
		},

		// Toggle to the next state
		toggleStatus : function(idekey, traceTrigger, profileTrigger)
		{
			var nextStatus = (exposed.getStatus(idekey, traceTrigger, profileTrigger) + 1) % 4;
			return exposed.setStatus(nextStatus, idekey, traceTrigger, profileTrigger);
		},

		// Set the state
		setStatus : function(status, idekey, traceTrigger, profileTrigger)
		{
			switch(status) {
				case 1: {
					if (!statuses.includes(1)) {
						setCookie("XDEBUG_SESSION", idekey, 365);
						statuses.push(1);
					} else {
						deleteCookie("XDEBUG_SESSION");
						statuses = statuses.filter(status => status != 1);
					}} break;
				case 2: {
					if (!statuses.includes(2)) {
						setCookie("XDEBUG_PROFILE", profileTrigger, 365);
						statuses.push(2);
					} else {
						deleteCookie("XDEBUG_PROFILE");
						statuses = statuses.filter(status => status != 2);
					}} break;
				case 3: {
					if (!statuses.includes(3)) {
						setCookie("XDEBUG_TRACE", traceTrigger, 365);
						statuses.push(3);
					} else {
						deleteCookie("XDEBUG_TRACE");
						statuses = statuses.filter(status => status != 3);
					}} break;
				case 4: {
					if (!statuses.includes(4)) {
						setCookie("OLP_DISABLE_AUTO_LOGOUT", 'true', 365);
						statuses.push(4);
					} else {
						deleteCookie("OLP_DISABLE_AUTO_LOGOUT");
						statuses = statuses.filter(status => status != 4);
					}} break;
				case 5: {
					if (!statuses.includes(5)) {
						setCookie("OLP_DISABLE_FRONTEND_PERMISSION_CHECK", 'true', 365);
						statuses.push(5);
					} else {
						deleteCookie("OLP_DISABLE_FRONTEND_PERMISSION_CHECK");
						statuses = statuses.filter(status => status != 5);
					}} break;
			}

			// Return the new status
			return statuses;
		}
	};

	return exposed;
})();

// Attach the message listener
chrome.runtime.onMessage.addListener(xdebug.messageListener);
