// sole.log(navigator.platform);

/* Variables for the back end */
var fastHttpIp = "https://agile011.science.uva.nl:28310/injectionApi/"

function httpGetAsync(theUrl, callback) {
    let xmlHttp = new XMLHttpRequest();

    /* When ready execute this. */
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4)
            callback(xmlHttp);
    }

    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send();
}

function httpPostAsync(theUrl, data, callback) {
    if (userQuery != "") {
        let xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4)
                callback(xmlHttp);
        }
        xmlHttp.open("POST", theUrl, true); // true for asynchronous

        xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlHttp.send(JSON.stringify(data));
    }
}

function handlePostResponse(response) {    
 // console.log(response);
};

function handleGetResponse(response) {
  //console.log(response);
    // console.log(response);
};

/* Dict containing all the different modules loaded on the web page, given
 * an unique id.
 */
var moduleData = {};

/* Array containig click objects, the index determines the order in which they
 * where pressed.
 */
var clickData = [];

/* Variables needed to track complicated mouse movement.
 * mouseMoveComplicatedData will contain the different MouseMovementComplicatedInformation
 * objects, which is appended each time when hoovered over a module for at
 * least the minimum amount of time (minTimeBetweenModuleMouseMovement)
 */
var mouseMoveComplicatedData = [];
var currentMouseMoveModule = null;
var minTimeBetweenModuleMouseMovement = 1000 // time in milli seconds

/* Array containing exact mouse movement data based on intervals
 * The index is the order of the locations of the mouse.
 */
var mouseMoveExactData = [];

var scrollData = [];

/* Unique module id that needs to increase each time a new module is created. */
var moduleId = 0;

/* Value defining the rank of a module in the left column of the SERP. */
var moduleRank = 0;

/* Value defining the rank of a module in the right column of the SERP (side pannel). */
var moduleVerticalRank = 0;

/* Time of when the page got loaded. IMPORTANT used for defining user sessions*/
var startLoadPageTime = new Date();

/* Search query typed in the SERP */
var userQuery = "";

/* Struct containing general data can be expanded */
function GeneralData(moduleStructure) {
    this.ModuleStructure = moduleStructure;
    this.StartLoadPageTime = startLoadPageTime;
    this.UserQuery = userQuery;
}

/* Supported types:
 * normalResult: is a normal result
 * images: is a set of pictures previewed to the user
 * imageInner: is a picture module within an images module
 * videos: is a set of videos previewed to the user
 * videos-news: is a set of videos previewed to the user from the news class
 * video: is a video module with a videos module
 * mapSuggestions: is a google maps preview in addition to some locations nearby
 * mapPicture: is a map preview with only the adress below
 * translation: contains a translation tool and possible meanings of the word
 * dictionary: contains the meaning of the word and possible synonim meanings
 * relatedSearch: a list of possible related queries
 * relatedSugestions: a related search suggestion from related search (child)
 * information: module containing information (mostly sidepanels)
 * nextPages: module containing the next pages buttons for the SERP
 * privacy: reminder for the privacy agreement changes
 * undefined: modules wich are not defined within the previous modules
 */
function Module(type, rank, isVertical, url, visibility) {
  this.MyType = type;
  this.Rank = rank;
  this.IsVertical = isVertical; // if True it is in the second column (side panel)
  this.Url = url;
  this.ChildModules = {}; // additional modules within the module, mostly horizontal
  this.Visibility = visibility;
  this.AdditionalInf = {};
  this.StartLoadPageTime = startLoadPageTime;
};

/* Click information containing mapping information to the module from the
 * moduleData variable (if no parrentIDd variable just use the clickId
 * to access the module else first use the parrentId to get the parrentModule
 * and then the clickId in the childModules attribute to get the correct module
 * data).
 * Additional the x,y coordinate on the document will be saved.
 */
function ClickInformation(clickId, parentId, x, y) {
    this.ParentId = parentId;
    this.ClickId = clickId;
    this.ClickX = x; // exact x coordinate, relative to the screen, doesn't use scroll
    this.ClickY = y; // exact y coordinate, relative to the screen, doesn't use scroll
    this.ClickTime = new Date() - startLoadPageTime; // time passed in milliseconds since the page got loaded
    this.StartLoadPageTime = startLoadPageTime;
};

/* A user's mouse hover information over which module it has hoovered and the
 * amount of time it has spend on that module.
 */
function MouseMovementComplicatedInformation(clickId, parentId) {
    this.HooverId = clickId;
    this.ParentId = parentId;
    this.StartTime = new Date();
    this.EndTime = null; // filled in once the mouse leaves the module.
    this.StartLoadPageTime = startLoadPageTime;
};

/* Function to open and focus new tab */
function openInNewTab(url) {
    var win = window.open(url, '_blank');

    win.focus();
}

/* Setup logic for the privacy agreement module. */
function setupPrivacyModule(privacyElement) {
    privacyElement.setAttribute("data-myId", moduleId);

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("privacy", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    /* Click logic */
    addClickListenerLogic(privacyElement);

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(privacyElement);
};

/* Setup logic for the translation module. */
function setupTranslationModule(translationElement) {
    translationElement.setAttribute("data-myId", moduleId);

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("translation", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    /* Remove expand button, since it doesn't work magically. */
    translationElement.childNodes[1].firstChild.removeChild(translationElement.childNodes[1].firstChild.childNodes[1]);

    /* Change the select pointer into normal pointer, since the elements are not clickable magically. */
    let children = translationElement.childNodes[1].firstChild.firstChild.childNodes[5].firstChild.firstChild.childNodes[1].childNodes;
    children.forEach(function(item){
        if (item.hasAttribute("role")) {
            item.setAttribute("style", "cursor: auto;");
        }
    });

    /* Click logic */
    addClickListenerLogic(translationElement);

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(translationElement);
};

/* Setup logic for the translation module. */
function setupDictionaryModule(dictElement) {
    dictElement.setAttribute("data-myId", moduleId);

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("dictionary", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    /* Click logic */
    addClickListenerLogic(dictElement);

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(dictElement);
};

/* Setup logic for the normal results. */
function setupNormalResultModule(normalElement) {
    normalElement.setAttribute("data-myId", moduleId);

    let resultHeader = normalElement.getElementsByClassName("r")[0];
    let resultHeaderInner = resultHeader.firstChild;
    let url = resultHeaderInner.getAttribute("href");

    /* On click logic */
    resultHeader.setAttribute("data-myId", moduleId);

    /* Update the click history */
    addClickListenerLogic(resultHeader);

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("normalResult", moduleRank, false, url, true);
    moduleRank += 1;
    moduleId += 1;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(normalElement);
};

/* Setup map containing only an image logic. */
function setupMapImageModule(mapElement) {
    mapElement.setAttribute("data-myId", moduleId);

    let url = mapElement.firstChild.childNodes[1].firstChild.getAttribute("data-url");

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("mapPicture", moduleRank, false, url, true);
    moduleRank += 1;
    moduleId += 1;

    /* Click listener for click history logic */
    addClickListenerLogic(mapElement);

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(mapElement);
}

/* Setup map logic for map containing suggestions. */
function setupMapSuggestionsModule(mapElement) {
    mapElement.setAttribute("data-myId", moduleId);

    let newModule = new Module("mapSuggestions", moduleRank, false, null, true);
    let currentId = moduleId;
    moduleRank += 1;
    moduleId += 1;

    /* Remove the openingtimes and revieuw expand buttons, since the javascript
     * doesn't work magically.
     */
    mapElement.childNodes[1].removeChild(mapElement.childNodes[1].childNodes[1]);

    let innerRanks = 0;

    /* Add child module being the header as first element. */
    let mapHeaderImage = mapElement.childNodes[1].childNodes[0];
    let mapHeaderUrl = mapHeaderImage.firstChild.getAttribute("href");

    mapHeaderImage.setAttribute("data-parrentId", currentId);
    mapHeaderImage.setAttribute("data-myId", moduleId);

    // Insert the click history logic
    addClickListenerLogic(mapHeaderImage);

    let headerInnerModule = new Module("mapSuggestionHeader", innerRanks, false, mapHeaderUrl, true);
    newModule.ChildModules[moduleId] = headerInnerModule;
    moduleId += 1;
    innerRanks += 1;

    /* Add the multiple suggestions */
    let mapSuggestions = mapElement.childNodes[1].childNodes[2].firstChild.childNodes;

    mapSuggestions.forEach(function(item){
        item.setAttribute("data-parrentId", currentId);
        item.setAttribute("data-myId", moduleId);

        newModule.ChildModules[moduleId] = new Module("mapSuggestion", innerRanks, false, null, true);

        moduleId += 1;
        innerRanks += 1;

        addClickListenerLogic(item);
    });

    /* Create and insert the new module in the list */
    moduleData[currentId] = newModule;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(mapElement);
};

/* Setup video module logic given the header and the body of the element
 * This is done because there is no class containing both of them.
 */
function setupVideosModule(videosElement, type) {
    videosElement.setAttribute("data-myId", moduleId);

    /* Go over all the videos of parent element and create child modules. */
    let currentModuleId = moduleId;
    let newModule = new Module(type, moduleRank, false, null, true);
    let rankChild = 0;
    moduleRank += 1;
    moduleId += 1;

    let children = videosElement.firstChild.firstChild.firstChild.childNodes;

    children.forEach(function(item){
        // Only use the dom elements
        if (item.nodeType == 1) {
            item.setAttribute("data-parrentId", currentModuleId);
            item.setAttribute("data-myId", moduleId);
            /* Create the child module
             * If it has the data-vis atribute it is visible on load of the SERP.
             */
            let visibility = false;

            if (item.getAttribute("data-init-vis") == "true") {
                visibility = true;
            }

            let url = null;
            let innerVidChild = null;

            if (findFirstChildDepth(item) >= 3) {
                innerVidChild = item.firstChild.firstChild.firstChild;
                url = innerVidChild.getAttribute("href");
            }

            let childModule = new Module("video", rankChild, false, url, visibility);
            newModule.ChildModules[moduleId] = childModule;
            moduleId += 1;
            rankChild += 1;

            /* click logic of child for updating the click history */
            addClickListenerLogic(item);
        }
    });

    /* Create and insert the new module in the list */
    moduleData[currentModuleId] = newModule;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(videosElement);
};

/* Check how far we are able to enter the first childs of an DOM element */
function findFirstChildDepth(element) {
    let elementDepth = 0;
    let temp = element.firstChild;

    while (temp != null) {
        temp = temp.firstChild;
        elementDepth += 1;
    }

    return elementDepth;
}

/* Setup images module logic */
function setupImagesModule(imagesElement) {
    imagesElement.setAttribute("data-myId", moduleId);

    /* Create and insert the new module in the list */
    let currentModuleId = moduleId;
    let newModule = new Module("images", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    /* Get the children from parent images.
     * If all images on one row in the SERP go in if statement else if images
     * defined over multiple rows go in else.
     */
    let children;

    if (findFirstChildDepth(imagesElement.firstChild.childNodes[1]) > 7) {
        NodeList.prototype.forEach = Array.prototype.forEach
        children = imagesElement.firstChild.childNodes[1].firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes;
    } else {
        NodeList.prototype.forEach = Array.prototype.forEach
        children = imagesElement.firstChild.childNodes[1].firstChild.firstChild.firstChild.childNodes;
    }

    let rankChild = 0;

    /* Go over all the images of parent element and create child modules. */
    children.forEach(function(item){
        // Only use the dom elements
        if (item.nodeType == 1) {
            item.setAttribute("data-parrentId", currentModuleId);
            item.setAttribute("data-myId", moduleId);

            /* Create the child module
             * If it has the data-vis atribute it is visible on load of the SERP.
             */
            let url = null;
            let lowerChildren = item.childNodes;

            if (lowerChildren.length >= 2) {
                url = lowerChildren[1].firstChild.getAttribute("href");
            }

            let childModule = new Module("image", rankChild, false, url, item.hasAttribute("data-vis"));
            newModule.ChildModules[moduleId] = childModule;
            moduleId += 1;
            rankChild += 1;

            /* click logic of child for updating click history*/
            addClickListenerLogic(item);
        }
    });

    moduleData[currentModuleId] = newModule;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(imagesElement);
};

/* Setup logic for the related search module. */
function setupRelatedSearchModule(relatedElement) {
    relatedElement.setAttribute("data-myId", moduleId);
    let currentId = moduleId;

    /* If no related searches are given */
    if (relatedElement.firstChild.firstChild.childNodes.length < 3) {
        return;
    }

    /* Create and insert the new module in the list */
    let newModule = new Module("relatedSearch", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    innerRanks = 0;

    let children = relatedElement.firstChild.firstChild.childNodes[2].firstChild.childNodes[1].firstChild.childNodes;

    /* Add related search suggestions as children to parent. */
    children.forEach(function(item){
        let innerItem = item.firstChild;

        innerItem.setAttribute("data-parrentId", currentId);
        innerItem.setAttribute("data-myId", moduleId);

        let url = null;

        if (innerItem.hasAttribute("href")) {
            url = innerItem.getAttribute("href");
        }

        newModule.ChildModules[moduleId] = new Module("relatedSearchSuggestion", innerRanks, false, url, true);

        moduleId += 1;
        innerRanks += 1;

        addClickListenerLogic(innerItem);
    });

    moduleData[currentId] = newModule;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(relatedElement);
};

/* Setup logic for the vertical blocks. */
function setupVerticalModule(verticalElement) {
    verticalElement.setAttribute("data-myId", moduleId);

    /* Create and insert the new module in the list */
    moduleData[moduleId] = new Module("information", moduleVerticalRank, true, null, true);
    moduleVerticalRank += 1;
    moduleId += 1;

    /* Click listener for click history logic */
    addClickListenerLogic(verticalElement);

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(verticalElement);
}

/* Setup logic for the next pages module. */
function setupNextPagesModule(nextElement) {
    nextElement.setAttribute("data-myId", moduleId);

    /* If the element isn't filled with data skip it (null) */
    if (nextElement.childNodes.length < 2) {
        return;
    }

    let innerRanks = 0;
    let currentId = moduleId;

    /* Create the parent module */
    let newModule = new Module("nextPages", moduleRank, false, null, true);
    moduleRank += 1;
    moduleId += 1;

    /* Create the children modules */
    let children = nextElement.childNodes[1].firstChild.firstChild.childNodes;
    let prevPassed = false;

    children.forEach(function(item){
        let nextType = null;
        let nextNumb = null;
        let url = null;

        if (item.hasAttribute("class") && item.getAttribute("class") == "b navend") {
            /* if previous button is passed then next button else prev button */
            if (prevPassed) {
                nextType = "next";

                if (item.firstChild.hasAttribute("href")) {
                    url = item.firstChild.getAttribute("href");
                }
            } else {
                nextType = "prev";
                prevPassed = true;

                if (item.firstChild.hasAttribute("href")) {
                    url = item.firstChild.getAttribute("href");
                }
            }
        } else if (item.hasAttribute("class") && item.getAttribute("class") == "cur") {
            nextType = "current";
            nextNumb = item.childNodes[1].data;
        } else {
            nextType = "page"
            nextNumb = item.firstChild.childNodes[1].data;
            url = item.firstChild.getAttribute("href");
        }

        let innerItem = item.firstChild;

        item.setAttribute("data-parrentId", currentId);
        item.setAttribute("data-myId", moduleId);

        let newInnerModule = new Module("nextPage", innerRanks, false, url, true);
        newInnerModule.AdditionalInf["type"] = nextType;
        newInnerModule.AdditionalInf["nextNumb"] = nextNumb;

        newModule.ChildModules[moduleId] = newInnerModule;

        moduleId += 1;
        innerRanks += 1;

        addClickListenerLogic(item);
    });

    moduleData[currentId] = newModule;

    /* Add the mouse movement advanced logic. */
    addMouseMovementAdvancedLogic(nextElement);
}

/* function to define the ranking of each search result and add listeners */
function defineRank() {
    // Get the DOM of the html body
    let documentBody = document.body.getElementsByTagName("*"),
    string = [].map.call( documentBody, function(node) {
        return node.textContent || node.innerText || "";
    }).join("");

 // console.log(documentBody);

    for (i = 0; i < documentBody.length; i++) {
        let htmlElement = documentBody.item(i);
        let element = documentBody.item(i).innerHTML;

	/* Add text on main page explaining the situation. */
        /* Add text on main page explaining the situation. */
     //   if (htmlElement.id == "resultStats") {
     //       htmlElement.style.fontSize = "10px";
     //       htmlElement.style.color = "red"
     //       htmlElement.firstChild.nodeValue = "This proxy is made to track user-interactions for research purposes. By using this proxy you agree to sharing your user interaction data. In the future it will also be possible to look at your collected data and delete this data.";
     //   }
	
        /* Set the query of the search term */
        if (htmlElement.className == "gLFyf gsfi") {
            userQuery = htmlElement.getAttribute("value");

            // TODO REMOVE THIS
            let queryMessage = "Search query is: "
        //  console.log(queryMessage.concat(userQuery));
        }

        if (htmlElement.className == "gb_Zc") {
         //   console.log(htmlElement);
        }

        /* Remove navigation bar, since the tracking doesnt work there. */
        if (htmlElement.hasAttribute("id") && htmlElement.getAttribute("id") == "top_nav") {
            // htmlElement.removeChild(htmlElement.firstChild);
        }

	/* Remove the top navigation bar, since we only support normal searche functionality */
	if (htmlElement.id == "top_nav") {
            while (htmlElement.firstChild) {
                htmlElement.removeChild(htmlElement.firstChild);
            }
        }

        /* Logic for multiple page module */
        if (htmlElement.hasAttribute("id") && htmlElement.getAttribute("id") == "navcnt") {
            setupNextPagesModule(htmlElement);
        }

        /* Logic for privacy reminder */
        if (htmlElement.id == "taw") {
	    htmlElement.childNodes[1].removeChild(htmlElement.childNodes[1].childNodes[2]);
            //setupPrivacyModule(htmlElement);
        }

        /* Logic for translation container.
         * This container contains a translation tool.
         * Possible:
         * - some image
         * - examples of the word with different meanings (tree -> boom, stamboom).
         */
        if (htmlElement.id == "tw-container") {
            setupTranslationModule(htmlElement);
        }

        /* Logic for dictionary module */
        if (htmlElement.id == "dictionary-modules") {
            setupDictionaryModule(htmlElement);
        }

        /* Logic for map image + location under module */
        if (htmlElement.className == "vk_c") {
            setupMapImageModule(htmlElement);
        }

        /* Google maps module containing additionallocal location suggestions. */
        if (htmlElement.getAttribute("class") != null && htmlElement.getAttribute("class").startsWith("AEprdc vk_c")) {
            setupMapSuggestionsModule(htmlElement);
        }

        /* Logic for videos */
        if (htmlElement.getAttribute("class") == "COEoid") {
            setupVideosModule(htmlElement, "videos");
        }

        /* Logic for news videos on online */
        if (htmlElement.getAttribute("class") == "mJVYJe") {
            setupVideosModule(htmlElement, "videos-news");
        }

        /* Logic for image boxes */
        if (htmlElement.className == "S1KrM") {
            setupImagesModule(htmlElement);
        }

        /* Logic for normal results modules */
        if (htmlElement.className == "rc") {
            setupNormalResultModule(htmlElement);
        }

        /* Logic for related search result modules */
        if (htmlElement.id == "extrares") {
            setupRelatedSearchModule(htmlElement);
        }

        /* Catch vertical blocks */
        if (element.startsWith('<div class=\"ifM9O\">')) {
            setupVerticalModule(htmlElement);
        }

        /* Force all href links to open on a new tab */
        addClickLogic(htmlElement);
    }

    if (!window.location.href.includes("/search?")) {
        let node = document.createElement("div");
        node.style.fontSize = "13px";
        node.style.color = "red";
        let textnode = document.createTextNode("This proxy is made to track user interactions for research purposes. By using this proxy you agree to sharing your user interaction data.");
        node.appendChild(textnode);
        document.body.insertBefore(node, documentBody.item(0));
    }

 // console.log("%%%%%%");
 // console.log(moduleData);
    let generalData = new GeneralData(moduleData);

    let postStructureUrl = fastHttpIp.concat("postStructure");
    httpPostAsync(postStructureUrl, generalData, handlePostResponse);

};

function addClickListenerLogic(element) {
    element.addEventListener("click", function(event) {
        let id = element.getAttribute("data-myId");
        let parrentId = null;

        if (element.hasAttribute("data-parrentId")) {
            parrentId = element.getAttribute("data-parrentId");
        }

        let click = new ClickInformation(id, parrentId, event.clientX, event.clientY);
        clickData.push(click);

     // console.log("haaalp");
     // console.log(click);

        /* Send click data to backend */
        let postClickUrl = fastHttpIp.concat("postMouseClick");
        httpPostAsync(postClickUrl, click, handlePostResponse);

	/* Send hover data */
        let currentTime = new Date();
        if (currentMouseMoveModule != null && minTimeBetweenModuleMouseMovement <= currentTime - currentMouseMoveModule.StartTime) {
            currentMouseMoveModule.EndTime = currentTime;
            mouseMoveComplicatedData.push(currentMouseMoveModule);

            /* Send data to backend */
            let postMoveComplexUrl = fastHttpIp.concat("postMouseMovementContext");
            httpPostAsync(postMoveComplexUrl, currentMouseMoveModule, handlePostResponse);
        }

        currentMouseMoveModule = null;
    });
}

function addMouseMovementAdvancedLogic(element) {
    /* When you enter a known module create a MouseMovementComplicatedInformation
     * object so the start time can be compared when the user leaves the module
     * again.
     */
    element.addEventListener("mouseenter", function(event) {
        let id = element.getAttribute("data-myId");
        let parentId = null;

        if (element.hasAttribute("data-parrentId")) {
            parentId = element.getAttribute("data-parrentId");
        }

        currentMouseMoveModule = new MouseMovementComplicatedInformation(id, parentId);
    });

    element.addEventListener("mouseleave", function(event) {
        let currentTime = new Date();

        if (currentMouseMoveModule != null && minTimeBetweenModuleMouseMovement <= currentTime - currentMouseMoveModule.StartTime) {
            currentMouseMoveModule.EndTime = currentTime;
            mouseMoveComplicatedData.push(currentMouseMoveModule);

       //   console.log("Advanced mouse movement data:");
       //   console.log(currentMouseMoveModule);

            /* Send data to backend */
            let postMoveComplexUrl = fastHttpIp.concat("postMouseMovementContext");
            httpPostAsync(postMoveComplexUrl, currentMouseMoveModule, handlePostResponse);
        }

        currentMouseMoveModule = null;
    });
}

function addClickLogic(element) {
    /* Forces all hrefs to open on a new tab */
    if (element.hasAttribute("href")) {
        let url = element.getAttribute("href");

        element.removeAttribute("href");
        element.setAttribute("style", "cursor: pointer;");

        /* Add small delay so that the click track logic can finish first,
         * otherwise it will loose its StartTime
         */
        element.addEventListener("click", function(event){
            setTimeout(function(){
                openInNewTab(url);
            }, 250);
        });
    }
}

/* Update the exact mouse location every n miliseconds. */
var exactMouseMoveInterval = 3000;

function MouseMovementExactInformation(x, y) {
    this.Xaxis = x;
    this.Yaxis = y;
    this.MouseInterval = exactMouseMoveInterval;
    this.StartLoadPageTime = startLoadPageTime;
};

var m_pos_x,m_pos_y;
window.onmousemove = function(e) { m_pos_x = e.pageX;m_pos_y = e.pageY; }
setInterval(function() {
    let exactData = new MouseMovementExactInformation(m_pos_x, m_pos_y);
    mouseMoveExactData.push(exactData);
    // console.log("exact mouseMovementData");
    // console.log(mouseMoveExactData);

    /* Send data to backend TODO Maybe turn on or in batches*/

    let postMoveComplexUrl = fastHttpIp.concat("postMouseMovementExact");
    httpPostAsync(postMoveComplexUrl, exactData, handlePostResponse);
}, exactMouseMoveInterval);

function ScreenImage(image) {
    this.Image = image;
    this.Timestamp = new Date();
    this.StartLoadPageTime = startLoadPageTime;
}

/* Reconstruct the canvas to save as an image using html2canvas */
function screenShot(scrollPosition) {
    var w = window.innerWidth || document.body.clientWidth;
    var h = window.innerHeight || document.body.clientHeight;

    html2canvas(document.body, {y: scrollPosition, scale: 1, width: w, height: h, logging: false}).then(function(canvas) {
        let postImageUrl = fastHttpIp.concat("postImage");
        let postImage = new ScreenImage(canvas.toDataURL().slice(22));
        httpPostAsync(postImageUrl, postImage, handlePostResponse);
    });
};

/* Update scroll Data initiate when the page loads */
var lastScroll = new Date();

function ScrollInformation(yAxis) {
    this.IdleTime = new Date() - lastScroll; // time passed since last scroll movement
    this.Yaxis = yAxis;
    this.StartLoadPageTime = startLoadPageTime;
};

var minimumIdleScroll = 1000;
var timer = null;
window.addEventListener('scroll', function(e) {
    if(timer !== null) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        let scrollInf = new ScrollInformation(this.scrollY);
        scrollData.push(scrollInf);
        lastScroll = new Date();
  //    console.log("scrollData");
  //    console.log(scrollInf);
	
	screenShot(this.scrollY);

        /* Send data to backend */
        let postMoveComplexUrl = fastHttpIp.concat("postScroll");
        let scrollInf2 = new ScrollInformation(this.scrollY);
        httpPostAsync(postMoveComplexUrl, scrollInf, handlePostResponse);
    }, minimumIdleScroll);
}, false);

/* Call the injection functions. */
function injection() {
    defineRank();
    setTimeout(screenShot(0),1000);
};

/* When the page is ready load the injection. */
window.onload = injection;






