// ==UserScript==
// @name         Caps-a-Holic Rehost
// @namespace    L4G's Userscripts
// @version      0.3
// @author       L4G
// @match        https://caps-a-holic.com/c.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=caps-a-holic.com
// @grant        GM.xmlHttpRequest
// @grant        GM_setClipboard
// @description  Get comparisons from caps-a-holic and rehost if needed. Convert to comparison bbcode
// ==/UserScript==

// Script installed from https://github.com/L4GSP1KE/Userscripts

var PTPIMG_API_KEY = ""

// ADD THE BUTTON
var convertButton = document.createElement("BUTTON")
convertButton.textContent = "Convert Comparison"
convertButton.setAttribute('type', 'button')
let nav_item = document.querySelectorAll(".blue-bar")[2]
nav_item.append(convertButton)
convertButton.addEventListener("click", getButtonFunction)

// GET THE LIST OF COMPARISION SETS
var comps = []
let comp_sets = [...document.querySelectorAll("[class^=c-thumb]")[0].children]
comp_sets.forEach(comp =>{
  comps.push(`${comp.href}&go=1`)
})

if (comps.length == 0) {
  comps = [window.location.href]
}

// GET THE LIST OF SOURCES
var sources = []
let ccell = [...document.querySelectorAll('.c-cell')]
console.log(ccell[1].outerText)
let source_names = [ccell[1], ccell[2]]
source_names.forEach(source_name => {
  sources.push(source_name.outerText.split("\n", 2).join(" "))
})
console.log(sources)

// WHEN BUTTON PUSHED DETERMINE WHAT TO DO
var images = []
async function getButtonFunction(){
  if (convertButton.textContent == "Show Comparison") {
    showComparison()
  } else {
    await generateComparison()
    showComparison()
  }
}

// FOR EACH COMP SET, GET COMP IMAGES
async function generateComparison(){
  convertButton.textContent = "Generating Comparison"
  comps.forEach(async(comp) => {
    let r = new XMLHttpRequest()
    await delay(500)
    r.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let parser = new DOMParser()
        let compHTML = parser.parseFromString(r.responseText, 'text/html')
        compHTML.innerHTML = r.responseText.toString()
        // console.log(compHTML)
        let compImages = [`${compHTML.getElementById('s1').src}&ext=.png`, `${compHTML.getElementById('s2').src}&ext=.png`]
        let beforeLength = images.length
        if (PTPIMG_API_KEY == "") {
          compImages.forEach(img => {
            images.push(`${img.src}&ext=.png`)
          })
        } else {
          compImages.forEach((img, index) => {
            ptpimgUpload(img).then(rehosted => {
              images[index + beforeLength] = rehosted
            });
          })
          images.length = beforeLength + compImages.length
        }
        // console.log(images)

      }
    };
    r.open("GET", comp, true)
    r.send()
  })
  while (images.filter(Boolean).length !== (comps.length * sources.length)) {
    await delay(1000)
  }
  console.log(`Images: ${images}`)
  convertButton.textContent = "Show Comparison"
}

async function ptpimgUpload(imgUrl){
  await delay(Math.floor(Math.random() * (1000 - 500) + 500))
  let url = `https://ptpimg.me/upload.php`;
  let ptpHeaders = new Headers();
  ptpHeaders.append("Referer", "https://ptpimg.me/index.php");
  let form = new FormData();
  let imgKey = imgUrl instanceof File ? "file-upload" : "link-upload";
  if (typeof imgUrl === "string" && imgUrl.startsWith("data:")) {
    imgUrl = imgUrl.split(",", 2)[1];
  }
  let formdata = {
    api_key: PTPIMG_API_KEY,
  };
  formdata[imgKey] = imgUrl;
  let response = await xhrQuery(url, "", "post", {}, formdata).then((r) => {let resp = JSON.parse(r.response); return `https://ptpimg.me/${resp[0].code}.${resp[0].ext}`});
  return response
}

async function xhrQuery(baseUrl, path, method = "get", params = {}, data = {}) {
    let resolver;
    let rejecter;
    const p = new Promise((resolveFn, rejectFn) => {
      resolver = resolveFn;
      rejecter = rejectFn;
    });

    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const paramStr = new URLSearchParams(params).toString();
    const obj = {
      method,
      timeout: 30000,
      onloadstart: () => {},
      onload: (result) => {
        if (result.status !== 200) {
          console.log("XHR Errored Result", result);
          rejecter(new Error("XHR failed"));
          return;
        }
        resolver(result);
      },
      onerror: (result) => {
        rejecter(result);
      },
      ontimeout: (result) => {
        rejecter(result);
      },
      headers : {
        'Referer' : 'https://ptpimg.me/index.php'
      }
    };

    const final =
          method === "post"
    ? Object.assign({}, obj, {
      url: baseUrl,
      data: formData,
    })
    : Object.assign({}, obj, {
      url: baseUrl,
    });
    GM.xmlHttpRequest(final);

    return p;
}

function showComparison(){
  let comp_bbcode = `[comparison=${sources.join(', ')}]\n${images.join('\n')}\n[/comparison]`
  console.log(comp_bbcode)
  if (confirm(`Press OK to copy to clipboard \n\n${comp_bbcode}`) == true) {
    GM_setClipboard(comp_bbcode)
  }
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
