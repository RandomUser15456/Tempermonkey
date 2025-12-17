// ==UserScript==
// @name         Sounds Packer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  none
// @author       Zpayer
// @match        https://www.myinstants.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=myinstants.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        none
// ==/UserScript==


function getFunctionParams(func) {
    const pattern = /'([^']+)'/g;
    const matches = [...func.matchAll(pattern)];
    return matches.map(match => match[1]);
}
function getName(link) {
    const parts = link.split("/");
    return parts[parts.length - 1];
}
function getMP3s() {
    return [...document.querySelectorAll(".small-button")].map(e => {
        const params = getFunctionParams(e.getAttribute("onclick"))
        return {
            url: window.location.origin + params[0],
            name: getName(params[0])
        }
    });
}



function downloadFile(file) {
    return new Promise(async (resolve, reject) => {
        let res = await fetch(file.url);
        if (!res.ok) return resolve(null);
        let buffer = await res.arrayBuffer()
        resolve({
            name: file.name,
            buffer,
        });
    });
}


async function packFilesAndDownload() {
    const files = getMP3s();
    const fetchPromises = files.map(downloadFile);
    const results = await Promise.all(fetchPromises);
    const successfulFiles = results.filter(result => result !== null);

    if (successfulFiles.length === 0) return false;


    const zip = new JSZip();
    successfulFiles.forEach(file => zip.file(file.name, file.buffer));

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "myinstants.zip");

    return true;
}

window.SoundExport = {
    getMP3s,
    getFunctionParams,
    packFilesAndDownload,
}


//   UI


function createElement(parent, tagName, attributes = {}, children) {
    let e = document.createElement(tagName);
    if (attributes?.first_child) parent.prepend(e);
    if (parent) parent.appendChild(e);

    if (typeof attributes?.key === "string") e.key = attributes.key;

    Object.entries(attributes).forEach(([k, v]) => {
        if (k.slice(0, 5) === "event") {
            e.addEventListener(k.split("_")[1], (...args) => v(e, ...args))
        } else
            if (k.slice(0, 5) === "prop") {
                e[k.split("_")[1]] = v;
            } else switch (k) {
                case "class":
                    e.className = v;
                    break;
                case "html":
                    e.innerHTML = v;
                    break;
                case "text":
                    e.textContent = v;
                    break;
                case "style":
                    if (typeof v == "object") {
                        Object.entries(v).forEach(([k_, v_]) => e.style[k_] = v_);
                    } else if (typeof v == "string") e.style = v;
                    break;
                case "first_child": case "key":
                    break;
                default:
                    e.setAttribute(k, v);
            }
    });
    if (children) {
        if (typeof children === "object") {
            if (children instanceof Array) children.forEach(l => {
                if (l?.key) e[l.key] = l;
                e.appendChild(l);
            });
            else {
                if (children?.key) e[children.key] = children;
                e.appendChild(children);
            }
        } else {
            console.error("couldn't get element children");
        }
    }
    return e;
}




(async () => {

    const $ = (e) => document.querySelector(e);

    const content = $("#content");
    content.style.display = "flex";
    content.style.flexDirection = "column";

    let mp3s = getMP3s();
    let button = createElement(content, "button", {
        first_child: true,
        text: `Download All (${mp3s.length})`,
        style: {
            order: '-1',
            background: '#375a7f',
            width: 'fit-content',
            outline: 'none',
            border: 'none',
            borderRadius: '5px',
            marginBottom: '10px',
            fontFamily: 'sans-serif',
            fontSize: '.875rem',
            padding: '10px 20px 10px 20px',
            transition: ".5s ease"
        },
        event_mouseover:function (e) {
          e.style.background = "#2f4d6c";
        },
        event_mouseout:function (e) {
          e.style.background = "#375a7f";
        },
        event_click:packFilesAndDownload,
    });

    setInterval(l=>{
       let mp3s = getMP3s();
       button.textContent = `Download All (${mp3s.length})`;
    },1e3);

    let int = setInterval(l=>{
       let ad = $('#top-ad');
       if (ad) {
          ad.remove();
          clearInterval(int);
          int = null;
       }
    },10)



})();











