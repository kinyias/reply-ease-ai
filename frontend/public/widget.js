/**
 * ReplyEase AI - Embeddable Chatbot Widget Loader
 * https://replyease.ai
 */
(function () {
  "use strict";

  // Prevent duplicate execution
  if (window.__REPLYEASE_WIDGET_LOADED__) return;
  window.__REPLYEASE_WIDGET_LOADED__ = true;

  // 1. Determine script element and configuration
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf("widget.js") !== -1) {
          return scripts[i];
        }
      }
      return null;
    })();

  var domainId =
    (currentScript && currentScript.getAttribute("data-domain-id")) ||
    window.REPLYEASE_DOMAIN_ID ||
    "";

  if (!domainId) {
    console.warn("[ReplyEase AI] Missing data-domain-id on widget script tag.");
  }

  // Derive origin from script src
  var widgetBaseUrl = "http://localhost:3000";
  if (currentScript && currentScript.src) {
    try {
      var urlObj = new URL(currentScript.src);
      widgetBaseUrl = urlObj.origin;
    } catch (e) {
      // fallback
    }
  }

  // 2. Create Iframe Element
  var iframe = document.createElement("iframe");
  iframe.id = "replyease-chatbot-widget";
  iframe.title = "ReplyEase AI Chatbot";
  iframe.src =
    widgetBaseUrl +
    "/chatbot?domain_id=" +
    encodeURIComponent(domainId) +
    "&embedded=true";

  // Base closed styles
  var defaultStyles = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "80px",
    height: "80px",
    border: "none",
    borderRadius: "50%",
    zIndex: "2147483647",
    overflow: "hidden",
    background: "transparent",
    colorScheme: "none",
    transition:
      "width 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.35s ease, right 0.35s ease",
  };

  for (var prop in defaultStyles) {
    if (Object.prototype.hasOwnProperty.call(defaultStyles, prop)) {
      iframe.style[prop] = defaultStyles[prop];
    }
  }

  var isExpanded = false;

  function resizeWidget(expanded) {
    isExpanded = expanded;
    var isMobile = window.innerWidth < 640;

    if (expanded) {
      if (isMobile) {
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.bottom = "0px";
        iframe.style.right = "0px";
        iframe.style.borderRadius = "0px";
        iframe.style.boxShadow = "none";
      } else {
        iframe.style.width = "440px";
        iframe.style.height = "680px";
        iframe.style.maxWidth = "calc(100vw - 32px)";
        iframe.style.maxHeight = "calc(100vh - 40px)";
        iframe.style.bottom = "20px";
        iframe.style.right = "20px";
        iframe.style.borderRadius = "20px";
        iframe.style.boxShadow = "0 20px 48px -12px rgba(0, 0, 0, 0.35)";
      }
    } else {
      iframe.style.width = "80px";
      iframe.style.height = "80px";
      iframe.style.bottom = "20px";
      iframe.style.right = "20px";
      iframe.style.borderRadius = "50%";
      iframe.style.boxShadow = "none";
    }
  }

  // 3. Listen for postMessage from Chatbot Iframe
  window.addEventListener("message", function (event) {
    // Validate message payload
    if (!event.data || typeof event.data !== "object") return;

    if (event.data.type === "REPLYEASE_RESIZE") {
      resizeWidget(Boolean(event.data.open));
    } else if (event.data.type === "REPLYEASE_GET_CONFIG") {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "REPLYEASE_INIT",
            domainId: domainId,
          },
          "*"
        );
      }
    }
  });

  // Handle host window resize (when mobile rotates or resizes)
  window.addEventListener("resize", function () {
    if (isExpanded) {
      resizeWidget(true);
    }
  });

  // Send domain ID on load
  iframe.onload = function () {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "REPLYEASE_INIT",
            domainId: domainId,
          },
          "*"
        );
      }
    } catch (e) {
      // Cross-origin safe
    }
  };

  // 4. Inject into DOM when ready
  function injectIframe() {
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", injectIframe);
      return;
    }
    if (!document.getElementById("replyease-chatbot-widget")) {
      document.body.appendChild(iframe);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectIframe);
  } else {
    injectIframe();
  }
})();
