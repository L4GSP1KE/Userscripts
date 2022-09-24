// ==UserScript==
// @name        PTP Get Description
// @namespace   Violentmonkey Scripts
// @match       https://passthepopcorn.me/torrents.php?id=*
// @grant       none
// @version     1.0
// @author      L4G
// @description Adds GD Button that links to the description BBCode
// ==/UserScript==


document.querySelectorAll(".basic-movie-list__torrent__action").forEach(
  function(element) {
    if (element.baseURI.startsWith("https://passthepopcorn.me/torrents.php?id=")){
      element.innerHTML = element.innerHTML.replace(']', `| <a href="torrents.php?action=get_description&id=${element.children[2].href.match(/torrentid=(\d+)/)[1]}" title="Get Description" target="_blank">GD</a> \n\t\t\t\t\t\t\t\t\t\t\t]`)
    }
  }
)
