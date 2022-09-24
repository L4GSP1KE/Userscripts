// ==UserScript==
// @name        SlowPics Rehost
// @namespace   Violentmonkey Scripts
// @match       https://slow.pics/c/*
// @grant       GM.xmlHttpRequest
// @connect     ptpimg.me
// @version     1.0
// @author      L4G
// @description Get All Images from slow.pics, rehost to ptpimg and then output comparison bbcode
// ==/UserScript==

var PTPIMG_API_KEY = ""

// ADD THE BUTTON
var convertButton = document.createElement("BUTTON")
convertButton.textContent = "Convert Comparison"
convertButton.setAttribute('class', 'btn btn-success mr-2')
convertButton.setAttribute('type', 'button')
let nav_item = document.querySelectorAll(".nav-item")
nav_item[nav_item.length - 2].append(convertButton)
convertButton.addEventListener("click", getButtonFunction)

// GET THE LIST OF COMPARISION SETS
var comps = []
document.querySelectorAll("[id^=dropdown-comparison-]").forEach(comp =>{
  comps.push(comp.href)
})
if (comps.length == 0) {
  comps = [window.location.href]
}
// console.log(comps)

// GET THE LIST OF SOURCES
var sources = []
let source_children = [...document.getElementById('preload-images').children]
source_children.forEach(img => {
  sources.push(img.alt)
})
// console.log(sources)

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
    r.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let parser = new DOMParser()
        let compHTML = parser.parseFromString(r.responseText, 'text/html')
        compHTML.innerHTML = r.responseText.toString()
        let compImages = [...compHTML.getElementById('preload-images').children]
        if (PTPIMG_API_KEY == "") {
          compImages.forEach(img => {
            images.push(img.src)
          })
        } else {
          compImages.forEach(async(img) => {
            let rehosted = await ptpimgUpload(img.src);
            images.push(rehosted)
          })
        }
        // console.log(images)

      }
    };
    r.open("GET", comp, true)
    r.send()
  })
  while (images.length !== (comps.length * sources.length)) {
    await delay(1000)
  }
  console.log(`Images: ${images}`)
  convertButton.textContent = "Show Comparison"
}

async function ptpimgUpload(imgUrl){
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
  let resp = await xhrQuery(url, "", "post", {}, formdata).then((r) => JSON.parse(r.response));
  return `https://ptpimg.me/${resp[0].code}.${resp[0].ext}`

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
  alert(`[comparison=${sources.join(', ')}]\n${images.join('\n')}\n[/comparison]`)
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
