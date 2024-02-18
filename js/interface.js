window.$ = window.jQuery;
var notifications = 0;
var materialJSON = new MaterialBuffer();
var uncookMyFile = false;
var MLSBConfig = thePIT.RConfig();
var textureformat = ''

      
function notifyMe(message, warning = true){
  let Data = new Date(Date.now());
  if (warning){
    $("#NotificationCenter .offcanvas-body").prepend('<span class="text-error">[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+"</span><br>");
    notifications++
    $("#notyCounter span").text(notifications);
  }else{
    $("#NotificationCenter .offcanvas-body").prepend('[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+"<br>");
  }
  $("#foot-message").text(`${message}`);
}


//Broadcasting manager section
const bc = new BroadcastChannel("streaming"); //communication between opened interafce windows
bc.onmessage = (event)=>{
  console.log(event.data);
};

var mLsetup = new Mlsetup();

var layerSwapstart = null;

var modelType = 'default';
var mlSetupContent = '';


function checkOnSettings(){
  var checkDepot = thePIT.RConfig('paths.depot');
  checkDepot.then((result)=>{
    try {
      if (result=='') {
        //Try to setup the Depot folder.
        var setupSettings = document.getElementById('configure')
        setupSettings.showModal();
      } 
    } catch (error) {
      notifyMe(error,true);
    }
  });
}

/**
  * This function will extend the Numbercasting type
  * adding the feature of returning the lenght of numbers after the dot
*/
Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
}

const range = (start, stop, step = 1) =>  Array(Math.ceil((stop - start) / step)+1).fill(start).map((x, y) => x + y * step)

/*
async function abuildMaskSelector(listOfMasks){
	if (typeof(listOfMasks)=="object"){
			var maskSel = document.querySelector("#customMaskSelector");
			let dummytxt = '';
			for (k=0, j=listOfMasks.length;k<j;k++){
				dummytxt +="<option value='"+k+"' >"+listOfMasks[k].mask.replace("{format}",textureformat)+"</option>";
        //$("#customMaskSelector").append("<option value='"+k+"' >"+listOfMasks[k].mask+"</option>");
      }
			maskSel.innerHTML+=dummytxt;
			return;
	}
}*/

//Build the microblends gallery and compile the microblends select options
async function abuildMB(microblendObj){
  if (typeof(microblendObj)=="object"){
    if ((microblendObj.hasOwnProperty("microblends")) && (microblendObj.hasOwnProperty("package")) ){
      for (k=0, j=microblendObj.microblends.length;k<j;k++){
        //select
        $("#mbSelect optgroup[label='core']").append("<option data-package='"+microblendObj.package+"' data-thumbnail='./images/"+microblendObj.microblends[k].name+".png' value='base\\surfaces\\microblends\\"+microblendObj.microblends[k].name+".xbm'>"+microblendObj.microblends[k].name+"</option>");
        //microblend gallery
        //$("#cagethemicroblends").append("<li style=\"background-image:url('./images/thumbs/"+microblendObj.microblends[k].name+".png'); '\" data-package='"+microblendObj.package+"' title='"+microblendObj.microblends[k].name+"' data-path=''> </li>");
				$("#cagethemicroblends").append(`<li style="background-image:url('./images/thumbs/${microblendObj.microblends[k].name}.png');"  data-package='${microblendObj.package}' title='${microblendObj.microblends[k].name}' data-path='base\\surfaces\\microblends\\${microblendObj.microblends[k].name}.xbm' > </li>`);
      }
    }
  }
  return;
}

async function nubuildMB(microblendObj){
  if ((typeof(microblendObj)=="object" ) ) {
    if (microblendObj.hasOwnProperty("packages")){
      var pkgName;
      var pkgList = document.getElementById('mbListPackages');
      /* Cleanup*/
      pkgList.innerHTML="";
      $("#mbHierarchy").html("");
      $("#mbSelect optgroup:not([label='core'])").html("");
      $("#mbSelect").val($("#mbSelect option:first").val()).change();
      $("#cagetheCuMBlends").html("");
      /* Cleanup*/
      microblendObj.packages.forEach((package)=>{
        pkgName = "";
        if (package.hasOwnProperty("name")){
            pkgName = package.name;
            pkgList.innerHTML+="<option value='"+pkgName+"' />";
            $("#mbSelect").append("<optgroup label='"+pkgName+"'>");
            $("#mbHierarchy").append("<ul class='list-group list-group-flush' data-package='"+pkgName+"' ></ul>");
        }
        if (package.hasOwnProperty("microblends")){

          package.microblends.forEach((microblend)=>{
            let tmpName = microblend.path.split('.')[0].split("\\").reverse()[0];
            let hash = microblend?.hash != undefined ? `data-hash='${microblend.hash}'` : "";
            //$("#mbSelect optgroup[label='"+pkgName+"']").append("<option data-package='"+pkgName+"' data-thumbnail='./images/mblend/"+pkgName.toLowerCase()+"/"+tmpName+".png' value='"+microblend.path+"'>"+tmpName+"</option>");
            $("#mbSelect optgroup[label='"+pkgName+"']").append(`<option data-package='${pkgName}' data-thumbnail='./images/mblend/${pkgName.toLowerCase()}/${tmpName}.png' value='${microblend.path}'>${tmpName}</option>`);
            //$("#cagetheCuMBlends").append("<li style=\"background-image:url('./images/mblend/"+pkgName.toLowerCase()+"/thumbs/"+tmpName+".png'); '\" data-package='"+pkgName+"' data-path='"+microblend.path+"' title='"+tmpName+"' > </li>");
            $("#cagetheCuMBlends").append(`<li style="background-image:url('./images/mblend/${pkgName.toLowerCase()}/thumbs/${tmpName}.png');" data-package='${pkgName}' data-path='${microblend.path}' title='${tmpName}' > </li>`);
            $("#mbHierarchy ul[data-package='"+pkgName+"']").append(`<li ${hash} data-path='${microblend.path}' class='list-group-item text-white p-1 pointer'><i class=' fa-solid fa-circle-minus text-danger'></i> ${tmpName}</li>`);
          });
        }
      })
    }
  }
  return;
}

//Build the material gallery
async function abuildMaterial(materialArray){
	if (typeof(materialArray)=="object"){
		for (k=0, j=materialArray.length;k<j;k++){
			$("#cagemLibrary").append("<div style=\"background:url('images/material/"+materialArray[k].name+".jpg') no-repeat;background-size:100% auto;\" data-ref='"+materialArray[k].name+"' data-path='"+materialArray[k].path+"'>"+materialArray[k].name.replaceAll("_"," ")+"</div>");
			$("#materiaList").append("<li class='p-1 fs-80' data-ref='"+materialArray[k].name+"' data-path='"+materialArray[k].path+"'>"+materialArray[k].name.replaceAll("_"," ")+"</li>"); //<i class='fa-solid fa-magnifying-glass float-end'></i>
		}
	}
}

async function abuildHairs(aHairs){
	if (typeof(aHairs)=="object"){
		if (aHairs.hasOwnProperty('profiles')){
			var hair_colors = shade = ''
			aHairs.profiles.forEach((hair)=>{
				hair_colors = '';
				shade = ''
				if (hair.colors.hasOwnProperty('rootToTip')){
					if (hair.colors.rootToTip.length>0){
						let closeGrad = "%, ";
						hair.colors.rootToTip.forEach((item, key, arr) => {
				      if (Object.is(arr.length - 1, key)) {
								closeGrad = "% ";
							}
							hair_colors +=" "+item.c+" "+parseInt(item.p*100)+closeGrad
				    });
					}
				}
				if (hair.colors.hasOwnProperty('id')){
					if (hair.colors.id.length>0){
						let closeGrad = "%, ";
						hair.colors.id.forEach((item, key, arr) => {
				      if (Object.is(arr.length - 1, key)) {
								closeGrad = "% ";
							}
							shade +=" "+item.c+" "+parseInt(item.p*100)+closeGrad
				    });
					}
				}
				//console.log(hair_colors)
				$("#hairSwatches").append("<span data-toggle='tooltip' data-set='"+hair.set+"'  title='"+hair.name+"' data-name='"+hair.name+"' data-crtt='linear-gradient("+hair_colors+")' data-cid='linear-gradient("+shade+")' style='background:linear-gradient("+hair_colors+");order:"+hair.order+"' >"+"</span>"); //linear-gradient("+shade+");background-blend-mode: multiply
			});
		}
	}
}

function switchLegacyMat(material){
	$("#materiaList li").removeClass("active");
	$("#materiaList li[data-ref='"+material+"']").addClass("active");
}

$(window).on("load", function (e) {
  const AppLoading = document.getElementById("Loading");
  AppLoading.showModal();
})

$(function(){
  var setupModPath = document.getElementById('setupModPath');
  let buildmyHairs = abuildHairs(hairs);
  
  var Workspaces = {
    index: 0,
    alternatives: [
      './css/workspace_legacy.css',
      './css/workspace_compact.css',
      './css/workspace_substance.css'
      ],
    dom : $("#workspaceCSS"),
    config( idx = 0 ){
      this.index = Number(idx) > 0 ? Number(idx) : 0;
      return this.alternatives[this.index];
    },
    walk(){
      let size = this.alternatives.length
      // add 1 -> mod to the size of the array -> add the size -> re-mod
      this.index = (++this.index % size + size) % size;
      thePIT.savePref({workspace:Number(this.index)});
      return this.alternatives[this.index];
    }
  }

  function movecontent(){
    if (Workspaces.index==2) {
      $("#MatSelector").insertBefore("#MlEditor");
      $("#Settings").insertAfter("#layer_settings")
      $("#layer_settings").appendTo("#SettingsScroller");
      $("#micropanel").appendTo("#SettingsScroller");
      $("#materialDis").appendTo("#SettingsSummary");
      $("#mb-preview").appendTo("#SettingsSummary");
      $("#SettingsSummary").append("<div class='cube tint'> </div>");
      $("body #cagecolors span.active").click();
      $("#Mlswitcher").attr('open','');
    }else{
      $("div.cube.tint").remove()
      $("#layer_settings").insertAfter($("#MlEditor"));
      $("#micropanel").insertAfter($("#layer_settings"));
      $("#materialDis").appendTo("#matdisplay > div:nth-child(1)");
      $("#mb-preview").insertAfter("#MicroblendsLibrary");
      $("#Settings").appendTo("#modelsNavbar");
      $("#MatSelector").insertBefore("#appearanceSwitcher");
      $("#Mlswitcher").removeAttr('open');
    }
  }

  MLSBConfig.then((config)=>{
    if (config.hasOwnProperty('paths')){
      materialJSON = new MaterialBuffer(config.paths.depot);
    }
    if (config.hasOwnProperty('maskformat')){
      textureformat = config.maskformat
    }
    if (config.hasOwnProperty('workspace')){
      Workspaces.dom.attr('href',Workspaces.config(config.workspace));
      movecontent();
    }

    if (config.hasOwnProperty('paths')){
      $("dialog#setupModPath input").val(config.paths.lastmod);
    }
  }).catch((error)=>{
    notifyMe(error);
  });

  $(".friendo").on("input",function(e){
    $($(this).data("control")).val($(this).val());
    $($(this).data("control")).change();
  });

  $("input").on({
      "input":function(e){
        driveRange(e);
      },
      "change":function(e){
        driveRange(e);
      }
    });

  function driveRange(identifier){
    if ($(identifier.target.getAttribute("id"))!=undefined){
      var controller = `#${identifier.target.getAttribute("id")}`;
      if ($(`.friendo[data-control='${controller}']`).length > 0 ){
        $(`.friendo[data-control='${controller}']`).val( $(controller).val());
      }
    }
  }

  //make it as a circular array https://kittygiraudel.com/2022/02/01/circular-array-in-js/
  //canvas for contestual material
  const canvasMaterial = document.getElementById('materialDis');
  const material2D = canvasMaterial.getContext("2d");
  var lastsize = canvasMaterial.offsetWidth;
  //function to draw the image material
  function drawMaterial(materialChoose){
    var squaresize = canvasMaterial.offsetWidth
    lastsize = squaresize;
    const img = new Image();
    img.onload = ()=>{
      material2D.drawImage(img,0,0,squaresize,squaresize)
    };
    img.onerror = ()=>{
      img.src = `./images/material/unused.jpg`;
      notifyMe("Custom or wrong material name, loading a default one")
    }
    img.src = `./images/material/${materialChoose}.jpg`
  }

  drawMaterial("unused");

  /* Material.json load and interface events */
  $("#materialJson").bind('update',()=>{
    $("#appeInfo").html("");
    try {
      var materialAppearances = JSON.parse($("#materialJson").val());
      materialJSON.import($("#materialJson").val());
      $("#appeInfo").html(materialJSON.codeAppearances());
    } catch (error) {
      notifyMe(error,false);
    }
  });

  $("body").on("click","#appeInfo button[data-appearance]",function(){
    $(`#nav-appearance div.card`).removeClass('active');
    let setAppearance = $(this).attr("data-appearance");
    $(this).closest(".card").addClass('active');
    $(`body #appearanceSwitcher li a[data-name='${setAppearance}']`).click();
  });

  var mls_Offcanvas = document.getElementById('off_MLSetups')
  var off_MLSetup = new bootstrap.Offcanvas(mls_Offcanvas)

  const updblends = new Event('updMBlends');
  document.addEventListener('updMBlends',(e)=>{
      var updCustomMicroblends = thePIT.getMuBlends();
      updCustomMicroblends.then((listaMU) => {
        nubuildMB(listaMU);
      }).catch((error) => {
        console.log(error)
      })
  })

  var shiftSpeedup = false;
  var indexLayerContextual = null; //variable index for the copied Data
  var dataContextual = {};
  var newMBlendMan = {packageName:"",files:[]};

  const FolderImport = {
    groups:{},
    add : function(elm = {},type){
      if (!$.isEmptyObject(elm)){
        this.groups[type].push(elm);
      }
    },
    reset: function(){
      this.groups = {models:[],masks:[],textures:[],dirs:[]};
    }
  };

  FolderImport.reset();

	const materialsize = window.getComputedStyle(document.body).getPropertyValue('--matsizes').replace(/px/,'');

  //Building the list of microblends
  let buildmyMicroblends = abuildMB(coreMblends);

  var readCustomMicroblends = thePIT.getMuBlends();

    readCustomMicroblends
      .then((listaMU) => {
        nubuildMB(listaMU);
      })
      .catch((error) => {
        console.log(error)
      })

	let buildmyNuMaterial = abuildMaterial(materialCore);
	
	//let buildmyMasks = abuildMaskSelector(maskList)

  const ml_randomized = Object.keys(ml_libraries)
    .filter((key) => !key.match(/^(concrete|ebony|wood|asphalt|cliff|ceramic|grass|brick|terrain|mud|soil|rock|gravel|sand|factory|wallpaper|window|plaster|unused)\w+/g))
    .reduce((cur,key) => { return Object.assign(cur,{[key]:ml_libraries[key]}) },{} );

  $('[data-toggle="tooltip"]').tooltip(); //force tooltip to build up
	//not sure about this
	function slideMaterials(index,speed = 700){
		if (index/4>1){
			$("#cagemLibrary").animate({scrollTop:((Math.floor(index/4)-0.5)*(parseInt(materialsize)+3))+"px"},speed);
		}
	}

  function SOnotify(message){
    if (!("Notification" in window)) {
      // Check if the browser supports notifications
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      // Check whether notification permissions have already been granted;
      // if so, create a notification
      const notification = new Notification(message);
      // …
    } else if (Notification.permission !== "denied") {
      // We need to ask the user for permission
      Notification.requestPermission().then((permission) => {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          const notification = new Notification(message);
          // …
        }
      });
    }
  }
  /*
	var matChooser = document.getElementById('materialChoser')
	var tooltipMat = new bootstrap.Tooltip(matChooser,{placement:'left'})
  */

  $(document).on('keydown', function(e) {
    var ev = e // Event object 'ev'
    var key = ev.code; // Detecting keyCode

    var ctrl =  ev.ctrlKey ? ev.ctrlKey : ((key === 17) ? true : false);
    var shift = ev.shiftKey ? ev.shiftKey : ((key === 16) ? true : false);

    //CTRL + SHIFT + w
    if (ctrl && shift && (key=='KeyW')){
      Workspaces.dom.attr('href',Workspaces.walk());
      movecontent();
    }
    //CTRL + SHIFT + A
    if (ctrl && shift && (key=='KeyA')){
      $("#applytoMyLayer").click();
    }

  });

  function updPanelCovers(){
    let fmanager = $("#MlEditor").offset().left;
    let layersetting = $("#layer_settings").offset().left;
    $('#panelsSize').text(`
      .coverFullEditor{top: 0;right: 0;border-left: 1px solid rgba(0,0,0,.2);transform: translateX(100%);width:${parseInt($( window ).width()-fmanager+(0.5 * parseFloat(getComputedStyle(document.documentElement).fontSize)))}px !important;}
      .coverParamEditor{top: 0;right: 0;border-left: 1px solid rgba(0,0,0,.2);width:${parseInt($( window ).width()-layersetting+2)}px !important;}
    `);
  }

	$(window).resize(function(){
    updPanelCovers(); //on resize will update the position of the interface to cover
    $("#DataModelsLibrary").DataTable().draw()
	});

  const mbDropZone = document.getElementById('dropzone');

  mbDropZone.addEventListener('dragleave', (event) => {
    event.stopPropagation();
    event.preventDefault();
    mbDropZone.classList.remove('active');
  });

  mbDropZone.addEventListener('dragover', (event) => {
    event.stopPropagation();
    event.preventDefault();
    // Style the drag-and-drop as a "copy file" operation.
    event.dataTransfer.dropEffect = 'copy';
    mbDropZone.classList.add('active');
  });

  mbDropZone.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    var filteredFiles = {}
    mbDropZone.classList.remove('active');
    var md5
    Object.entries(fileList).forEach(([key, file]) => {
      if (file.name.match(/\.png$/)){
        filteredFiles[key]=file
        if ($("#mblendUserManager div[data-filepath='"+file.path+"']").length==0){
          md5 = CryptoJS.MD5(file.path)
          if ($(`#mblendUserManager div[data-hash='${md5}']`).length==0){
            $("#mblendUserManager").append(`<div data-filename='${file.name}' data-filepath='${file.path}' data-hash='${md5}'><input type="text" class="form-control form-control-sm" value="${file.name.replace(/\.png/,'.xbm').toLowerCase()}"></div>`);
          }
        }
      }
    });
    md5=null;
  });

  $("body").on("click","#mbHierarchy ul[data-package] li svg.fa-circle-minus",function(e){
    let name = $(this).parent().text();
    let package = $(this).parent().parent().data("package");
    let patapackage = $(this).parent().data("path");
    thePIT.delMBlend({package:package, file:name.trim()+".png", path:patapackage});
  });

  $("#CheckSaveMblend").click(function(){
    if (/^[a-zA-z0-9_\-]+$/.test($("#mbListPackage").val())) {
      newMBlendMan.packageName = $("#mbListPackage").val();
      var md5
      $("#mblendUserManager div[data-filename]").each((index)=>{
        if (/^[a-z0-9_\-\\\/]+\.xbm$/.test($("#mblendUserManager div[data-filename]").eq(index).children().val())){
          md5 = CryptoJS.MD5($("#mblendUserManager div[data-filename]").eq(index).children().val());
          newMBlendMan.files.push({
              name:$("#mblendUserManager div[data-filename]").eq(index).data('filename'),
              source:$("#mblendUserManager div[data-filename]").eq(index).data("filepath"),
              gamepath:$("#mblendUserManager div[data-filename]").eq(index).children().val(),
              hash:CryptoJS.enc.Hex.stringify(md5)
            })
        }
      })
      if (newMBlendMan.files.length>0){
        $("#CheckSaveMblend").append(`<div class="spinner-grow text-warning microspin" role="status"><span class="visually-hidden">Loading...</span></div>`);
        thePIT.importMBlend(newMBlendMan);
      }
      if ($("#mbLogPackager").hasClass("show")) { $("#mbLogPackager").removeClass("show");}
      newMBlendMan = {packageName:"",files:[]};
    }else{
      $("#mbLogPackager").addClass("show").html("the package name cannot be empty")
    }
  });

	$("#hairSwatches span").click(function(){
		$('#sp-gradients div:nth-child(1)').attr('style',"background:"+$(this).data('crtt')+", "+$('#bkgshades').val()+";");
		$('#sp-gradients div:nth-child(2)').attr('style',"background:"+$(this).data('cid')+", "+$('#bkgshades').val()+";");
		$('#hRootToTip').attr('style',"background:"+$(this).data('crtt').replace("linear-gradient(","linear-gradient( 90deg,")+", "+$('#bkgshades').val()+";");
		$('#hID').attr('style',"background:"+$(this).data('cid').replace("linear-gradient(","linear-gradient( 90deg,")+", "+$('#bkgshades').val()+";");
		HairTexture(hairs.profiles.filter(el => el.name==$(this).data('name'))[0].colors.rootToTip);
		hair_card.map.needsUpdate = true;
	});

	$('#bkgshades').val(window.getComputedStyle(document.body).getPropertyValue('--eq-lay1'))
	$('#sp-gradients div').css('background-color',$('#bkgshades').val());
	$('#bkgshades').on('change',function(){
		$('#sp-gradients div').css('background-color',$('#bkgshades').val());
	});

  //$(document).on('keyup', function(e) { if (e.shiftKey == false) { shiftSpeedup = false; $("#AimV, #AimU, #AimMTile").prop("step",'0.001');} });

	$("#legacyMatSector").click(function(ev){
		//console.log($("#legacyMatSector").prop('open'))
		if ($("#legacyMatSector").prop('open')==false){
			thePIT.savePref({legacymaterial:true});
		}else{
			thePIT.savePref({legacymaterial:false});
		}
	});

/* Contestual menu on layers */
  const contextMenu = document.getElementById("layers-contextual");
  const layerscope = document.querySelector("#layeringsystem");

  $("#layeringsystem li").on("contextmenu",function(event){
    if ($(this).attr("disabled")!="disabled"){
        event.preventDefault();
        indexLayerContextual = Number($(this).text());
        //event.target.classList.add("active");
        const { clientX: mouseX, clientY: mouseY } = event;
        $("#layers-contextual").css("top",`${mouseY-60}px`).css("left",`${mouseX}px`);
        $("#layers-contextual").addClass("visible");
    }
  });

$("#masksPanel li").click(function(){
  $("#masksPanel li.active").removeClass("active");
  $(this).addClass("active");
  $("#layeringsystem li").eq($(this).index()).click();
});

$("#resetShades span.choose").click(function(){
  let theshade = $(this).data("color").substring(0,2);
  $("#slidemask").val(parseInt(theshade,16)).change();
  $("#maskoolor").data("color",theshade+'0000');
  $("#maskoolor").attr("data-color",theshade+'0000');
  $("#maskoolor").css("background-color","#"+theshade+'0000');
});
//Change in layer displayer
	$("#matInput, #layerTile, #layerOpacity, #layerOffU, #layerOffV, #layerColor, #mbInput, #mbOffU, #mbOffV, #mbTile, #mbCont, #mbNorm, #layerNormal, #layerMetalOut, #layerRoughIn, #layerRoughOut").on("change",function(){
		if (
			($("#matInput").val() != $("#layeringsystem li.active").data("material")) ||
			(parseFloat($("#layerTile").val()) != parseFloat($("#layeringsystem li.active").data("mattile"))) ||
			(parseFloat($("#layerOpacity").val()) != parseFloat($("#layeringsystem li.active").data("opacity"))) ||
			(parseFloat($("#layerOffU").val()) != parseFloat($("#layeringsystem li.active").data("offsetu"))) ||
			(parseFloat($("#layerOffV").val()) != parseFloat($("#layeringsystem li.active").data("offsetv"))) ||
			($('#layerNormal').val() != String($("#layeringsystem li.active").data("normal"))) ||
			($('#layerMetalOut').val() != String($("#layeringsystem li.active").data("metalout"))) ||
			($('#layerRoughIn').val() != String($("#layeringsystem li.active").data("roughin"))) ||
			($('#layerRoughOut').val() != String($("#layeringsystem li.active").data("roughout"))) ||
			($('#layerColor').val() !=$("#layeringsystem li.active").data("color")) ||
			($("#mbInput").val() != $("#layeringsystem li.active").data("mblend")) ||
			(parseFloat($("#mbTile").val()) != parseFloat($("#layeringsystem li.active").data("mbtile"))) ||
			(parseFloat($("#mbCont").val()) != parseFloat($("#layeringsystem li.active").data("mbcontrast"))) ||
			(parseFloat($("#mbNorm").val()) != parseFloat($("#layeringsystem li.active").data("mbnormal"))) ||
			(parseFloat($("#mbOffU").val()) != parseFloat($("#layeringsystem li.active").data("mboffu"))) ||
			(parseFloat($("#mbOffV").val()) != parseFloat($("#layeringsystem li.active").data("mboffv")))
			){
			$("#layeringsystem li.active").addClass("notsync");
		}else{
			$("#layeringsystem li.active").removeClass("notsync");
		}
	});

  $("#layers-contextual li").click(function(){
    if ($(this).attr("disabled")!="disabled"){
      switch ($(this).data("action")) {
        case 'cpall':
          dataContextual = {};
          dataContextual.labels = $("#layeringsystem li").eq(indexLayerContextual).attr("data-labels");
          dataContextual.mattile = $("#layeringsystem li").eq(indexLayerContextual).data("mattile");
          dataContextual.material = $("#layeringsystem li").eq(indexLayerContextual).data("material");
          dataContextual.color = $("#layeringsystem li").eq(indexLayerContextual).data("color");
          dataContextual.normal = $("#layeringsystem li").eq(indexLayerContextual).data("normal");
          dataContextual.roughin = $("#layeringsystem li").eq(indexLayerContextual).data("roughin");
          dataContextual.roughout = $("#layeringsystem li").eq(indexLayerContextual).data("roughout");
          dataContextual.metalout = $("#layeringsystem li").eq(indexLayerContextual).data("metalout");
          dataContextual.offsetu = $("#layeringsystem li").eq(indexLayerContextual).data("offsetu");
          dataContextual.offsetv = $("#layeringsystem li").eq(indexLayerContextual).data("offsetv");
          dataContextual.opacity = $("#layeringsystem li").eq(indexLayerContextual).data("opacity");
          //microblend data
          dataContextual.mblend = $("#layeringsystem li").eq(indexLayerContextual).data("mblend");
          dataContextual.mbtile = $("#layeringsystem li").eq(indexLayerContextual).data("mbtile");
          dataContextual.mbcontrast = $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast");
          dataContextual.mbnormal = $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal");
          dataContextual.mboffu = $("#layeringsystem li").eq(indexLayerContextual).data("mboffu");
          dataContextual.mboffv = $("#layeringsystem li").eq(indexLayerContextual).data("mboffv");
          $("#layers-contextual li").eq(1).removeAttr("disabled");
          $("#layers-contextual li").eq(3).removeAttr("disabled");
					$("#layers-contextual li").eq(5).removeAttr("disabled");
          break;
        case 'pstall':
          $("#layeringsystem li").eq(indexLayerContextual).data("labels",dataContextual.labels);
          $("#layeringsystem li").eq(indexLayerContextual).data("mattile",dataContextual.mattile);
          $("#layeringsystem li").eq(indexLayerContextual).data("material",dataContextual.material);
          $("#layeringsystem li").eq(indexLayerContextual).data("color",dataContextual.color);
          $("#layeringsystem li").eq(indexLayerContextual).data("normal",dataContextual.normal);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughin",dataContextual.roughin);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughout",dataContextual.roughout);
          $("#layeringsystem li").eq(indexLayerContextual).data("metalout",dataContextual.metalout);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetu",dataContextual.offsetu);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetv",dataContextual.offsetv);
          $("#layeringsystem li").eq(indexLayerContextual).data("opacity",dataContextual.opacity);
          //microblend data
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          //Setup the HTML just in case
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mattile":dataContextual.mattile,
            "data-labels":dataContextual.labels,
            "data-material":dataContextual.material,
            "data-opacity":dataContextual.opacity,
            "data-color":dataContextual.color,
            "data-normal":dataContextual.normal,
            "data-roughin":dataContextual.roughin,
            "data-roughout":dataContextual.roughout,
            "data-metalout":dataContextual.metalout,
            "data-offsetU":dataContextual.offsetu,
            "data-offsetV":dataContextual.offsetv,
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
        case 'cpmb':
          dataContextual = {};
          dataContextual.mblend = $("#layeringsystem li").eq(indexLayerContextual).data("mblend");
          dataContextual.mbtile = $("#layeringsystem li").eq(indexLayerContextual).data("mbtile");
          dataContextual.mbcontrast = $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast");
          dataContextual.mbnormal = $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal");
          dataContextual.mboffu = $("#layeringsystem li").eq(indexLayerContextual).data("mboffu");
          dataContextual.mboffv = $("#layeringsystem li").eq(indexLayerContextual).data("mboffv");
          $("#layers-contextual li").eq(1).attr("disabled","disabled");
          $("#layers-contextual li").eq(3).removeAttr("disabled");
					$("#layers-contextual li").eq(5).attr("disabled","disabled");
          break;
        case 'pstmb':
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
				case 'cpcol':
					dataContextual = {};
					dataContextual.color = $("#layeringsystem li").eq(indexLayerContextual).data("color");
					$("#layers-contextual li").eq(1).attr("disabled","disabled");
          $("#layers-contextual li").eq(3).attr("disabled","disabled");
					$("#layers-contextual li").eq(5).removeAttr("disabled");
					break;
				case 'pstcol':
					$("#layeringsystem li").eq(indexLayerContextual).data("color",dataContextual.color);
					$('#layeringsystem li').eq(indexLayerContextual).attr({"data-color":dataContextual.color});
					$("#layeringsystem li").eq(indexLayerContextual).click();
					break;
        case 'swapsrc':
          layerSwapstart = indexLayerContextual
          $("#layers-contextual li").eq(7).removeAttr("disabled");
          break;
        case 'swapdest':
          if (layerSwapstart!=indexLayerContextual){
            mLsetup.swap(layerSwapstart,indexLayerContextual)
            $("#layers-contextual li").eq(7).attr("disabled",'disabled');
            console.log(mLsetup);
          }else{
            notifyMe(`You really won't swap the layer with itself, right ?!?!??!`, true);
          }
          break;
        case 'clean':
          mLsetup.reset(indexLayerContextual)
          //--- to Be resetted ---
          if ($("#layeringsystem li").eq(indexLayerContextual).click()){
        		$("#matInput").val("base\\surfaces\\materials\\special\\unused.mltemplate");//clean the material
        		//$("#layerOpacity").val("1.0").change();//zeroing the opacity
        		$("#layerColor").val("null_null");//color replace
        		$("#applytoMyLayer").click(); //trigger the application to layer
      			$("#layeringsystem li.active").click() //reselect the layer to updates the material
        	}
          break;
        case 'cleanall':
          vacuumCleaner();
          $("#layeringsystem li.active").click();
          break;
        case 'wipeall':
          vacuumCleaner(false);
          $("#layeringsystem li.active").click();
          break;
        case 'plug':
            if ($("#layeringsystem li[disabled]").length>0){
              $("#layeringsystem li[disabled]").eq(0).removeAttr('disabled');
            }
          break;
        default:
      }
      //console.log(dataContextual);
      $("#layers-contextual").removeClass("visible");
    }
  });

	//replace chars not matching the standard features
	$("#layerRandomCfg").keyup(function (event) {
		let stringa = $(this).val();
		stringa = stringa.replace(/^[,\-]+/,'').replace(/[a-zA-Z\s]+/g,'').replace(/[^0-9,\-\s]+/g,'').replace(/,{2,}/g,',').replace(/\-{2,}/g,'-');
		$(this).val(stringa);
	});

	/* Normalization layers numbers*/
  function normalizeNumbers(){
    if ($("#layerTile").val() % 1 == 0){ $("#layerTile").val(Number($("#layerTile").val()).toFixed(1));    }
    if ($("#layerOpacity").val() % 1 == 0){ $("#layerOpacity").val(Number($("#layerOpacity").val()).toFixed(1)); }
    if ($("#layerOffU").val() % 1 == 0){ $("#layerOffU").val(Number($("#layerOffU").val()).toFixed(1)); }
    if ($("#layerOffV").val() % 1 == 0){ $("#layerOffV").val(Number($("#layerOffV").val()).toFixed(1)); }
    if ($("#mbTile").val() % 1 == 0){ $("#mbTile").val(Number($("#mbTile").val()).toFixed(1)); }
    if ($("#mbNorm").val() % 1 == 0){ $("#mbNorm").val(Number($("#mbNorm").val()).toFixed(1)); }
  }

  //const maskUVs = new fabric.Canvas('fabUVDis');


  const uvmSize = $("#maskPainter").attr('width');

	localStorage = window.localStorage;
	const license = localStorage.getItem('LicenseRead');
	const licenseWindow = document.getElementById('LicenseModal');
  const lastExportFormat = localStorage.getItem('ExportFormat');
  const lastModelOpened = localStorage.getItem('lastModelOpened');
  const lastLuminosity = localStorage.getItem('luminosity');

  MLSB.TreeD.lastModel = lastModelOpened;
  $("#modelTarget").val(MLSB.TreeD.lastModel);
  
  var openCloseMBlend = localStorage.getItem('customMicroblend_I');

  if (openCloseMBlend){
    $("#cu_mu_display").removeClass("d-none");
    $("#btn_dis_cBlend svg").removeClass("fa-eye").addClass("fa-eye-slash");
  }else{
    $("#cu_mu_display").addClass("d-none");
    $("#btn_dis_cBlend svg").removeClass("fa-eye-slash").addClass("fa-eye");
  }

  if (lastExportFormat!=null){
    $("select[name='exportVersion']").val(String(lastExportFormat));
  }else{
    $("select[name='exportVersion']").val(3);
  }

  if (lastLuminosity!=null){
    $("#colorLum").val(parseFloat(lastLuminosity));
    setTimeout(()=>{$("#colorLum").change()},1000);
  }

  /*
	const modelPlace = localStorage.getItem('MLibX');
	if (Number(modelPlace)>0){
		swapModelClass();
	}
  */
  updPanelCovers();
	//modal uncooking progress
	const unCookModal = new bootstrap.Modal(document.getElementById('unCookModal'));
	//license modal
	const licenseModal = new bootstrap.Modal(licenseWindow);
	//modal information windows for loaded models
	//const wGLBInfo = new bootstrap.Modal(document.getElementById('modalInfo'));
	//modal window used for aiming the microblends over the actual used layer
  $("#AimMBlend").click(function(){
    thePIT.openAim(
      {
        horizontal:parseFloat($("#mbOffU").val()),
        vertical:parseFloat($("#mbOffV").val()),
        tiles:parseFloat($("#mbTile").val()),
        microblend:$("#mb-preview").attr('src'),
        mask:document.getElementById("maskPainter").toDataURL()
      }
    );
  });

  $("#slidemask").on("input",function(){
		let hexacol
    hexacol = String(Number($(this).val()).toString(16)).padStart(2, '0').repeat(3);
		$("#maskoolor").data("color",hexacol);
		$("#maskoolor").attr("data-color",hexacol);
		$("#maskoolor").css("background-color","#"+hexacol);
  });

  $("#maskoolor").on("dblclick",function(){
    $("#slidemask").val(128).change();
    let middleColor ="808080"
    $("#maskoolor").data("color",middlecolor);
    $("#maskoolor").attr("data-color",middlecolor);
    $("#maskoolor").css("background-color","#"+middlecolor);
  });
  
	//Displays of the license
	licenseWindow.addEventListener('hidden.bs.modal', function (event) {
    localStorage.setItem('LicenseRead',Date.now());
    checkOnSettings()
  });

	if (license==null){ licenseModal.show();}else{checkOnSettings()}
  

	//activate/deactivate wireframe display
  $("#wireFrame").click(function(){
    var sideBox = $("#dat-container ul > li:first-child li:nth-child(4) input[type='checkbox']");
    sideBox.click();//("checked",!sideBox.prop("checked"));
  });

  //activate and deactivate double layering
  $("#onlyOneSide").click(function(){
    var sideBox = $("#dat-container ul > li:first-child  li:nth-child(5) input[type='checkbox']");
    sideBox.click();//("checked",!sideBox.prop("checked"));
  });

	var TextureLoad = new Event('fire');

  //actions connected to the click onto the layers list
	$("#layeringsystem li").click(function(e){

		if (!$(this).attr("disabled")){
      MLSB.Editor.layerSelected = $(this).index();
      //activate the new one only if isn't disabled
			$('#layeringsystem li').removeClass('active notsync');
      //sync with the mask paint editor
      $("#masksPanel li.active").removeClass("active");
      $("#masksPanel li").eq(MLSB.Editor.layerSelected).addClass("active");
			$(this).addClass('active');
			$("#maskLayer").attr("value",$(this).text());
      //if the model is already loaded it fires the event to load the masks
      //in the event if the layer selected is over the maximum layers
      //it load the 0 masks for security
      if ($("#modelTarget").attr('loaded')=='true'){
  			let fireTxLoad = document.getElementById('maskLayer');
  			fireTxLoad.dispatchEvent(TextureLoad);
      }

      //setup the chosen colors for the layer

      //Load the layers infor into the fields
      let materialByClick = String($(this).data("material")).replace(/^.*[\\\/]/, '').split('.')[0];
			semaphoreCLKmBlend=true;
			//Reset material Library 1.5.99
			$("#cagemLibrary > div").removeClass("active");
			$("#cagemLibrary > div[data-ref='"+materialByClick+"']").addClass("active");
			switchLegacyMat(materialByClick);
			//$("#materialChoser").attr('src','./images/material/'+materialByClick+'.jpg');
      drawMaterial(materialByClick); //draw the material in the canvas

			slideMaterials($("#cagemLibrary > div.active").index());
			$("#materialSummary").html(materialByClick);
      /* ColorChange before the switch */
      $("#layerColor").val($(this).data("color"));
			/*trigger the material change */
      $("#cagemLibrary > div[data-ref='"+materialByClick+"']").click();
			//
      
      let materialdummy = materialJson.filter(materiale =>(materiale.text==materialByClick)); //filter the material on the layer selected
			
      //Setup the inputs

      if ( (($(this).data("color")=="000000_null") || ($(this).data("color")=="ffffff_null")) && (!$("#BWAdd").is(":checked")) ){
        $( "#BWAdd" ).click();
      }

      //$("#layerColor").val($(this).data("color"));
      $("#matInput").val($(this).data("material"));
      $("#layerTile").val($(this).data("mattile")).change();
      $("#layerOpacity").val($(this).data("opacity")).change();
      $("#layerNormal").val(String($(this).data("normal")));
      $("#layerRoughIn").val(String($(this).data("roughin")));
      $("#layerRoughOut").val(String($(this).data("roughout")));
      $("#layerMetalIn").val(String($(this).data("metalin")));
      $("#layerMetalOut").val(String($(this).data("metalout")));
      $("#layerOffU").val($(this).data("offsetu"));
      $("#layerOffV").val($(this).data("offsetv"));
      //Microblend section
      $("#mbInput").val($(this).data("mblend")).change();
      $("#mbTile").val($(this).data("mbtile")).change();
      $("#mbCont").val($(this).data("mbcontrast")).change();
      $("#mbNorm").val($(this).data("mbnormal")).change();
      $("#mbOffU").val($(this).data("mboffu"));
      $("#mbOffV").val($(this).data("mboffv"));

			let  ricercacolore = $(this).data("color");
      $("#cagecolors span").removeClass("active");
			$("#cagecolors span[title='"+ricercacolore+"']").addClass("active").click();
			$("#mbInput").focusout(); //fires up the change of material blending preview
      //$("#mbSelect").trigger('change');
		}
	});

  $("span.choose").click(function(){
    $("span.choose.active").removeClass("active");
    $(this).addClass("active");
  });

  $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    DataTable.tables({ visible: true, api: true }).columns.adjust();
  });

  function DTformatChild(d) {
    // `d` is the original data object for the row
    var maskString ='';
    var normString = '';
    if (((d.mask!=null)||(d.mask!==undefined)) && parseInt(d.mask) ){
      maskString = `<dt class="text-primary">mask:</dt><dd class="ps-4 text-break">${maskList[d.mask].mask.replace('{format}',textureformat)}</dd>`;
    }
    if (((d.normal!=null)||(d.normal!==undefined)) && parseInt(d.normal)){
      normString = `<dt class="text-primary">normal:</dt><dd class="ps-4 text-break">${normList[d.normal].replace('{format}',textureformat)}</dd>`;
    }
    return (
        `<dl class="p-2 ps-4 bg-secondary">`+
        `<dt class="text-primary">File:</dt><dd class="ps-4">${d.file}</dd>` +
        `<dt class="text-primary">Tags:</dt><dd class="ps-4">${d.tags}</dd>` +
        `${maskString}${normString}` +
        '</dl>'
    );
  }

  var CPModels = $('#DataModelsLibrary').DataTable({
    ajax: {
      dataSrc:'models',
      url:'jsons/tablemodels.json'
    },
    buttons: [
      {
        extend:'searchBuilder',
        className:'btn btn-sm btn-secondary my-1',
        config: {
          columns: [3],
          preDefined: {
            criteria: [
                {
                  condition:'contains',
                  data: 'Tags',
                },
             ],logic: 'AND'
          }
        }
      }
    ],
    columns:[
      {
        className: 'dt-control',
        orderable: false,
        data: null,
        defaultContent: ''
      },
      {data:'name'},
      {data:'file',searchable:true},
      {
        data:'tags',
        render: function( data, type, row, meta ){
          var howmany = String(data).split(",");
          tagString = '';
          howmany.forEach((el,idx)=>{
            if (idx % 2){
              tagString +=`<span class="badge rounded-pill text-bg-info me-1">${el}</span>`;
            }else{
              tagString +=`<span class="badge rounded-pill text-bg-primary me-1">${el}</span>`;
            }
          })
          return type === 'display'? tagString : String(data).replaceAll(","," ");
        },
        searchable:true
      },
      {data:'mask'},
      {data:'normal'},
      {
        data:'origin',
        defaultContent: 'vanilla',
        orderable: false,
      }
    ],
    columnDefs:[
      {target:[0,1,3],visible:true},
      {target:'_all',visible:false,searchable:false}
      ],
    deferRender: true,
    dom:"<'row g-0'<'col-sm-12 col-md-7'Bf><'col-sm-12 col-md-5'il>>" +
    "<'row g-0'<'col-sm-12'tr>>" +
    "<'row g-0'<'col-sm-12 col-md-5'><'col-sm-12 col-md-7'>>",
    language: {
      info: `<i class="fa-solid fa-eye"></i> _START_ to _END_ of _TOTAL_`,
      infoFiltered: "(filtered from _MAX_)",
      search: "",
      searchBuilder: {
        button: 'tags filter',
      }
    },
    order: [[ 2, 'asc' ]],
    processing:true,
    rowGroup:{
      dataSrc: function(row){
        return row['origin']===undefined ? 'vanilla': row['origin'];
      },
      startRender: function(rows, group){
        if (group == 'custom'){
          $(rows.nodes()).addClass('bg-primary text-dark');
        }
      }
    },
    scrollCollapse: true,
    scroller: true,
    scrollY: (window.innerHeight-320),
    search:{
      "regex": true
    },
    select: {
      style:'single',
      toggleable: false
    },
    initComplete: function(settings, json){
      var customRows = thePIT.getModels();
      if (typeof(customRows)=='object'){
        var table = $('#DataModelsLibrary').DataTable();
        for (const [key, value] of Object.entries(customRows)) {
          if (value?.li_attr?.model!==undefined){
            table.row.add({
                name:value.text,
                tags:value.type,
                file:value?.li_attr.model,
                mask:value.li_attr?.masks != undefined ? value.li_attr?.masks : null ,
                normal:value.li_attr?.normal != undefined ? value.li_attr?.normal : null,
                origin:"custom"
            });
          }
        }
        table.draw(true);
        $(".dt-buttons button" ).removeClass("dt-button");
      }
      var filtered = CPModels.data().flatten().filter((value,index)=>{ return value.file==MLSB.TreeD.lastModel});
      filtered = filtered.length==1 ? filtered[0] : {};
      $("#masksTemplate").val(filtered?.mask!=null ? maskList[filtered.mask].mask.replace('{format}',textureformat) : '');
      $("normTemplate").val(filtered?.normal!=null ? normList[filtered.normal].replace('{format}',textureformat) : '');
      notifyMe("Mesh linked :"+table.data().length,false);
      document.getElementById("Loading").close();
    }
  })
  .on('select', function(e, dt, type, indexes ) {
    var data = CPModels.row({selected:true}).data();

    MLSB.TreeD.lastModel = data.file;
    localStorage.setItem(`lastModelOpened`,data.file);
    $("#masksTemplate").val(data.mask!=null?maskList[data.mask].mask.replace('{format}',textureformat):'');
    $("#normTemplate").val(data.normal!=null?normList[data.normal].replace('{format}',textureformat):'');
    $("#modelTarget").val(MLSB.TreeD.lastModel);
    $('#btnMdlLoader').click();
    
  });

  CPModels.select.selector( 'td:not(:first-child)' ); //

  $('#DataModelsLibrary tbody').on('click', 'td.dt-control', function () {
    var tr = $(this).closest('tr');
    var row = CPModels.row(tr);
 
    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
    }else {
        // Open this row
        row.child(DTformatChild(row.data())).show();
    }
  });

  $('#DataModelsLibrary_filter input[type=search]').each(function () {
    $(this).attr("placeholder", "Search...");
  });

  //when the loading of the layer configuration setup a microblend
  //it activate the display onto the preview

	$("#mbInput").on('focusout',function(){
		$("#mbSelect option").removeAttr("selected");
		$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
	});

	$("#mbInput").keyup(function (event) {
    if (event.which === 13) {
			$("#mbSelect option").removeAttr("selected");
			$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
    }
	});

	$("#mbSelect").on('updateMblend',function(){
		test = $("#mbInput").val().replaceAll("\\","\\\\");

		if ($("#mbSelect option[value='"+test+"']").length==0){
			$("#mb-preview").prop("src","./images/_nopreview.gif");
		}else{
			//if ($("#mbSelect option[value='"+$("#mbInput").val()+"']").attr("data-thumbnail")!== undefined){
  			$("#mb-preview").prop("src",$("#mbSelect option[value='"+test+"']").attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif")});
  		//}
		}
		$("#mbInput").change();
	})

	//load a new texture to display as microblends and fille the name in the microblend file name
	$("#mbSelect").change(function(event){
      var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));
  		$("#mbInput").val($(this).val());
			$("#mbInput").change();

      if ($("#mbSelect option:selected").attr("data-thumbnail")!== undefined){
        let MBName = $(this).val().split('.')[0].split("\\").reverse()[0]

  			$("#mb-preview").prop("src",$("#mbSelect option:selected").attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif"); console.log("rilevato errore");});

        $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass("MBactive");

        if ($("#cagethemicroblends li[title='"+MBName+"']")){
          $("#cagethemicroblends li[title='"+MBName+"']").addClass("MBactive");
          //$("#microdisplay").scrollLeft($("#cagethemicroblends li[title='"+MBName+"']").index()*($("#cagethemicroblends li[data-bs-original-title='"+MBName+"']").width()+2))
          document.getElementById("microdisplay").scrollLeft = ($(`#cagethemicroblends li[title='${MBName}']`).index() * (mblendPrevSize+2))
        }

        let customSelected = $("#cagetheCuMBlends li").filter(function(el) {
           return $(this).data('path') === $("#mbSelect").val();
        })
        if (customSelected.length>0){
          customSelected.addClass("MBactive");
          document.getElementById("cu_mu_display").scrollLeft = ($(`cagetheCuMBlends li[data-path='${$(this).val().replace("\\","\\\\")}']`).index() * (mblendPrevSize+2))
          //$("#cu_mu_display").scrollLeft($("#cagetheCuMBlends li[data-path='"+$(this).val().replace("\\","\\\\")+"']").index()*($("#cagetheCuMBlends li[data-path='"+$(this).val().replace("\\","\\\\")+"']").width()+2))
        }
  		}
	});

	//chage to a new microblend
	$("#bg-changer").change(function(){	$("#mb-preview").prop("style","background-color:"+$(this).val());	});
  //reset css fx on microblend
  $("#resetMB").click(function(){
		$("#mbInput").val("base\\surfaces\\microblends\\default.xbm").focusout();
    $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass("MBactive");
    $("#cagethemicroblends li[data-bs-original-title='default']").addClass("MBactive");
    $("#microdisplay").scrollLeft($("#cagethemicroblends li[data-bs-original-title='default']").index()*($("#cagethemicroblends li[data-bs-original-title='default']").width()+2))
	});
  $("#cleanFX").click(function(){$("#mb-preview").removeClass('blend-lumi');});
  //apply luminosity on microblend preview
  $("#lumiFX").click(function(){$("#mb-preview").toggleClass("blend-lumi");});
  //apply invert on microblend preview
  //$("#invertFX").click(function(){$("#mb-preview").removeClass('blend-lumi').addClass("blend-invert");});
  //microblend flipping
	$("#mb-preview").click(function(){
	  $(this).toggleClass("flip");
	  $('i.fa-hand-point-down').toggleClass("fa-hand-point-up");
	});

  /* custom microblends behaviours*/
  $("#btn_dis_cBlend").click(function(){
    $("#btn_dis_cBlend svg").toggleClass("fa-eye fa-eye-slash");
    if ($("#btn_dis_cBlend svg").hasClass("fa-eye-slash")){
      $("#cu_mu_display").removeClass("d-none");
    }else{
      $("#cu_mu_display").addClass("d-none");
    }
    openCloseMBlend = !openCloseMBlend;
    localStorage.setItem("customMicroblend_I",openCloseMBlend);
  });
	//Material libraries and search
	var matToSearch=false;

  //every time the switch skin it's clicked, it reload automatically the mesh

	$("#legacyMatFinderCleared").click(function(){$("#legacyMatFinder").val("").keyup()})
	$("#matModFinderCleared").click(function(){$("#matModFinder").val("").keyup()})


	$("#legacyMatFinder").keyup(function () {
		if ($(this).val()==''){
			$("#materiaList li").removeClass('d-none');
		}else{
			$("#materiaList li:not(:contains('"+$(this).val()+"'))").addClass('d-none');
			$("#materiaList li:contains('"+$(this).val()+"')").removeClass('d-none');
		}
	});

  //mousemove and mouseout event over layers
  $("#layeringsystem li").mousemove(function(e){
      mouseX = e.clientX;
      mouseY = e.clientY;
      //$("#floatLayer").css({ "left": `${(mouseX + 30)}px`, "top": `${(mouseY + 10)}px`, "z-index": 1090, "background": `url(images/material/${materialName}.jpg) 0 0 no-repeat`, "background-size": " 128px,128px" });
      $("#floatLayer").css({ "left": `${(mouseX + 30)}px`, "top": `${(mouseY + 10)}px`, "z-index": 1090 });
  });

  $("#layeringsystem li").mouseenter(function (e) {
    if ((parseFloat($(this).data('opacity')) > 0) && ($(this).attr("disabled") == undefined)) {
      let materialPath = $(this).data('material');
      let materialName = materialPath.split("\\").reverse()[0].split(".")[0]
      let mblendPath = $(this).data('mblend');
      let mblendlName = mblendPath.split("\\").reverse()[0].split(".")[0]
      let colormaterial
      switch ($(this).data('color')) {
        case '000000_null':
          colormaterial = {v:[0,0,0]};
          break;
        case 'ffffff_null':
          colormaterial = { v: [1, 1, 1] };
          break;
        default:
          colormaterial = ml_libraries[materialName].overrides.colorScale.filter(e => e.n == $(this).data('color'))[0];
          break;
      }
      $("#currentMat").attr("src", `images/material/${materialName}.jpg`);
      //if the microblend is custom it has to build the attribute finding the right one

      if ((coreMblends.microblends.filter(el => el.name==mblendlName).length==1) || (mblendlName=='default')) {
        $("#currentMblend").attr("src", `images/${mblendlName}.png`);
      }else{
        let dummyMblend = $("#cagetheCuMBlends").find($(`li[title='${mblendlName}']`));
        
        if (dummyMblend.length==1){
          let bg = $(dummyMblend).css('background-image');
          bg = bg.replace('url(','').replace(')','').replace(/\"/gi, "").replace("/thumbs","");
          $("#currentMblend").attr("src", bg);
        }
      }
      
      $("#floatLayer div.colDisplayer").attr("title", $(this).data('color'));
      $("#floatLayer div.colDisplayer").css("background-color", `#${tinycolor.fromRatio({ r: colormaterial.v[0], g: colormaterial.v[1], b: colormaterial.v[2] }).toHex()}`);
      $("#floatLayer footer").html(`<strong>M:</strong> ${materialName}<br><strong>&micro;b:</strong> ${mblendlName}<br><strong>C:</strong> ${$(this).data('color')}`)
      $("#floatLayer").removeClass('d-none');
    }
  });


  $("#layeringsystem li").mouseout(function (e) {
    $("#floatLayer").addClass('d-none');
  });

	$("#materiaList li").mousemove(function(e){
      var nuPos = $(e.target).offset();
      mouseX = e.clientX;
      mouseY = e.clientY;
			$("#floatMat").css({"left":(nuPos.left - 132) + "px","top":(mouseY - 64)+"px","z-index":1090,"background":"url(images/material/"+$(this).data('ref')+".jpg) 0 0 no-repeat","background-size":" 128px,128px"});
			$("#floatMat").removeClass('d-none');
		}
	);

	$("#materiaList").mouseout(function(e){
		$("#floatMat").addClass('d-none');
	});

	$("body").on("click","#materiaList li, #cagemLibrary > div", function(event){
     let target = $( event.target );

		$("#materiaList li, #cagemLibrary > div").removeClass('active');
		$(this).addClass('active');

    if (target.is( "div" )){
      if ($(this).index()/4>1){
  			slideMaterials($(this).index());
  		}
    }

		$("#materialSummary").html($(this).data('ref'));
		$("#matInput").val($(this).data('path'));
		$("#matInput").trigger("change");

		if (ml_libraries.hasOwnProperty($(this).data('ref'))){
			var materialtoload = $(this).data('ref');
      switchLegacyMat(materialtoload);
      drawMaterial(materialtoload); //draw the material in the canvas
			notifyMe("Material override loaded for "+materialtoload,false);
      console.log("%cMaterial override loaded for "+materialtoload, "color:green"); //"%cThis is a green text", "color:green"

			$("#Rough_out_values").html('');//reset optional roughness
			$("#Metal_Out_values").html('');
			$("#Rough_In_values").html('');
			$("#Norm_Pow_values").html('');
			$("#materialcolors").html('');
			$("#cagecolors").html('');

			let toodarkClass;

      if ($("#BWAdd").is(":checked")){
        if (ml_libraries[materialtoload].overrides.colorScale.filter(el => el.n=='000000_null').length<=0){
          ml_libraries[materialtoload].overrides.colorScale.push({'n':'000000_null','v':[0,0,0]})
          ml_libraries[materialtoload].overrides.colorScale.push({'n':'ffffff_null','v':[1,1,1]})
        }
      }

			Object.entries(ml_libraries[materialtoload].overrides.colorScale).forEach(([key,value])=>{
				toodarkClass='';
				let colorchecking = tinycolor.fromRatio({r:value.v[0],g:value.v[1],b:value.v[2]});
				//if (!(colorchecking.getBrightness()>90) && (colorchecking.getBrightness()<110)){
				if (!tinycolor.isReadable(colorchecking,"#3c454d")){
					toodarkClass='bg-light';
				}
				$("#materialcolors").append('<option class="'+toodarkClass+'" style="color:rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);" value="rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);">'+value.n+' &#9632;</option>');
				$("#cagecolors").append('<span style="background-color:'+colorchecking.toRgbString()+';" data-lum="'+colorchecking.getLuminance()+'" data-order="'+key+'" data-toggle="tooltip" title="'+value.n+'" >&nbsp;</span>');
			});

			//build up the lists of data loaded from the material chosen
			Object.entries(ml_libraries[materialtoload].overrides.roughLevelsIn).forEach(([key,value])=>{
				$("#Rough_In_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
			});

			Object.entries(ml_libraries[materialtoload].overrides.roughLevelsOut).forEach(([key,value])=>{
				$("#Rough_out_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
			});

			Object.entries(ml_libraries[materialtoload].overrides.normalStrength).forEach(([key,value])=>{
				$("#Norm_Pow_values").append(`<option value="${value.n}" data-force='${value.v}' >${value.n} (${String(value.v)})</option>`);
			});

			Object.entries(ml_libraries[materialtoload].overrides.metalLevelsOut).forEach(([key,value])=>{
				$("#Metal_Out_values").append('<option value="'+value.n+'" >'+value.n+' ('+String(value.v)+')</option>');
			});

			//$("#materialChoser").attr('src','./images/material/'+materialtoload+'.jpg');
		}else{
			console.log("%cNo material override entry loaded for:  "+String($(this).data('path')).replace(/^.*[\\\/]/, '').split('.')[0], "color:blue");
			$("#materialcolors").html("");
		}

    if ($("#colororder").is(":checked")){
      $("#cagecolors").find('span').sort(function(a, b) {
      	return +a.getAttribute('data-lum') - +b.getAttribute('data-lum');
  		}).appendTo($("#cagecolors"));
    }else{
      $("#cagecolors").find('span').sort(function(a, b) {
      	return +a.getAttribute('data-order') - +b.getAttribute('data-order');
  		}).appendTo($("#cagecolors"));
    }
    let ricercacolore = $("#layerColor").val();
    $("#cagecolors span").removeClass("active");

    if ($("#cagecolors span[title='"+ricercacolore+"']").length>0){
      $("#cagecolors span[title='"+ricercacolore+"']").addClass("active");
    }else{
      notifyMe("The color "+ricercacolore+" isn't present in the material "+materialtoload);
    }
    $("#colorLbFinder").keyup();
	});

  $("#colorLbFinder").keyup(function () {
		if ($(this).val()==''){
			$("#cagecolors span").removeClass('d-none');
      $('#colorLbFinder').removeClass("filterAlert");
		}else{
			$("#cagecolors span:not([title*='"+$(this).val()+"'])").addClass('d-none');
			$("#cagecolors span[title*='"+$(this).val()+"']").removeClass('d-none');
      $('#colorLbFinder').addClass("filterAlert");
		}
  });
  $("#colorCleaner").click(function(){$("#colorLbFinder").val("").keyup()});

  $("#colororder").change(function(){
    if ($("#colororder").is(":checked")){
      $("#cagecolors").find('span').sort(function(a, b) {
      	return +a.getAttribute('data-lum') - +b.getAttribute('data-lum');
  		}).appendTo($("#cagecolors"));
    }else{
      $("#cagecolors").find('span').sort(function(a, b) {
      	return +a.getAttribute('data-order') - +b.getAttribute('data-order');
  		}).appendTo($("#cagecolors"));
    }
  });

  //Color Luminosity
  $("#colorLum").on("change input",function(ev){
    let illuminazione = $(this).val();
    $("#cagecolors").css("filter",`brightness(${illuminazione})`);
    console.log(ev.bubble);
    if(!ev.bubble){
      localStorage.setItem("luminosity",illuminazione);
    }
  });
//filter materials by name and display badge links to select them
	$("#matModFinder").keyup(function () {
		if(matToSearch) { clearTimeout(matToSearch); }
		matToSearch = setTimeout(function () {
      var v = $('#matModFinder').val();
			if (v.length<=3){
				$('#matfindresults').html('');
			}else{
				let results = $("#cagemLibrary div[data-ref]").filter(function(){ return $(this).data('ref').match(v);});
				$('#matfindresults').html('');
				$(results).each(function( index ) {
					if (index % 2){
							$('#matfindresults').append('<a class="text-decoration-none badge layer-1 text-light" href="#" data-inx="'+$(this).index()+'">'+$(this).text()+'</a> ')
					}else{
						$('#matfindresults').append('<a class="text-decoration-none badge layer-8 text-light" href="#" data-inx="'+$(this).index()+'">'+$(this).text()+'</a> ')
					}
				});
			}
			//$('#matModFinder').find()

    }, 250);
	});


	/*click in the material selection window over a searched name. it will  select
	 the new material and move to the place where it is */
	$("body").on('click',"#matfindresults a.badge",function(){
		//console.log($(this).data('inx'));
		$("#cagemLibrary div").removeClass('active');
		$("#cagemLibrary div").eq($(this).data('inx')).click();
	})

	$("#layerOpacity").change(function(){
			if (Number($(this).val())==0){
				$("#layerOpacity").addClass('bg-attention');
			}else{
				$("#layerOpacity").removeClass('bg-attention');
			}
	});

	$("#materialModal").on('show.bs.modal',function(){
		//reset the last active material
		$("#cagemLibrary > div").removeClass("active");
		//data-ref the name of the material in use
		let materialtosearch = $("#materialSummary").text();
		let matindexchose = $("#cagemLibrary > div[data-ref='"+materialtosearch+"']").index();

		$("#cagemLibrary > div[data-ref='"+materialtosearch+"']").addClass("active");
		if (matindexchose/4>1){
			slideMaterials(matindexchose,200);
		}
	});

  $("#BWAdd").on("input",function(){
    if ($(this).is(":checked")){
      if (($('#cagecolors span[data-lum="0"]').length==0) && ($('#cagecolors span[data-lum="-1"]').length==0)){
        $("#cagecolors").append("<span style='background-color:black;' data-lum='0' data-order='0' title='000000_null'>&nbsp;</span>");
        $("#cagecolors").append("<span style='background-color:white;' data-lum='1' data-order='-1' title='ffffff_null'>&nbsp;</span>");

        $("#cagecolors").find('span').sort(function(a, b) {
          return +a.getAttribute('data-lum') - +b.getAttribute('data-lum');
        }).appendTo($("#cagecolors"));
      }
    }else{
      $("#cagecolors span[data-lum='0']").remove();
      $("#cagecolors span[data-lum='1']").remove();
    }
  });

  //Clicking outside the contextual menu
  $("body").on('click',function(event){
    if (contextMenu.classList.contains("visible")){
      if (event.target.offsetParent != contextMenu) {
        contextMenu.classList.remove("visible");
      }
    }
  });
  
  /*simulate the selection of the null_null color */
  $("#colorReset").click(function(){
    $("body #cagecolors span[title='null_null']").click();
  })

	$("body").on('click','#cagecolors span',function(){
		/* retarget the colors chosen*/
		$("#cagecolors span").removeClass('active');
		$(this).addClass('active');

		let colorchanger = $(this).attr("title");
    let colorSwatchValue = $(this).css("background-color")
    $(".tint").prop('style','background-color:'+colorSwatchValue+"!important;");
	  let choosed_color = tinycolor(colorSwatchValue);
    if ($(".cube.tint")){
      let dummyCol = choosed_color.toPercentageRgb()
      $(".cube.tint").attr("data-color",`red.${dummyCol.r}\r\ngreen.${dummyCol.g}\r\nblue.${dummyCol.b}\r\n`)
    }
	  $("#colorPntage").html(choosed_color.toPercentageRgbString());
    $("#layerColor").val(colorchanger).change();
    $("#colorManagament").html(colorchanger);
	});

  $("#cagethemicroblends li").click(function(){
    var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));

    $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass('MBactive');
    $(this).addClass("MBactive");
    let theoneselected = $(this).attr('title');
    document.getElementById("microdisplay").scrollLeft = ($(`#cagethemicroblends li[title='${theoneselected}']`).index() * (mblendPrevSize+2))
    $("#mbSelect option").removeAttr("selected")
    let mbZelected = $("#mbSelect option").filter(function() { return $(this).text() === theoneselected;})
    mbZelected.attr('selected', true);
    $("#mbInput").val($(`#cagethemicroblends li[title='${theoneselected}']`).data("path"));
    $("#mbInput").focusout();
  });

  $("body").on("click","#cagetheCuMBlends li",function(){
    var mblendPrevSize = Number(window.getComputedStyle(document.documentElement).getPropertyValue('--mblendSize').replace(/px/,''));

    $("#cagethemicroblends li, #cagetheCuMBlends li").removeClass('MBactive');
    $(this).addClass("MBactive");
    let theoneselected = $(this).data('path');
    console.log(theoneselected);
    $("#mbSelect option").removeAttr("selected")
    document.getElementById("cu_mu_display").scrollLeft = ($(`#cagetheCuMBlends li[data-path='${theoneselected}']`).index() * (mblendPrevSize+2))
    
    $("#mbSelect option").removeAttr("selected");
    let mbZelected = $("#mbSelect option").filter(function() {
       return $(this).val() === theoneselected;
     });
     
    mbZelected.attr('selected', true).change();
    $("#mbInput").val(theoneselected);
  })

const scrollMBContainer = document.getElementById("microdisplay");
const scrollCustMBContainer = document.getElementById("cu_mu_display");

scrollMBContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollMBContainer.scrollLeft += evt.deltaY;
});

scrollCustMBContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    scrollCustMBContainer.scrollLeft += evt.deltaY;
});

	$("#layerRandomizer").click(function(){

    let max_blends = 5;
    let layblend;
		//get options
		var turnOnOff = $("#rndOnOff").prop('checked'); //can the randomized set opacity to e from 0 ?
		var rndMBlend = $("#rndMbWild").prop('checked');
		//get active layers to be randomized
		var layerSactive = $("#layeringsystem li:not([disabled])").length;
    var subjectlayer
		var layerfilter = $("#layerRandomCfg").val();
    var affectedByRand = [...Array(20).keys()];

		//check on random layer selections
		if (layerfilter!=""){
			//last cleanup, remove single and multiple , or - alone at the start or end of the string
			layerfilter = layerfilter.replace(/[2-9][0-9]{1}|\d{3,}/g,'19').replace(/[,\-]+$/,'');
      //retrieve the affected layers
      affectedByRand = syntheticRanges(layerfilter)
		}

    //filter disabled layers
    $("#layeringsystem li[disabled]").each(function( index, el ) {
      affectedByRand = affectedByRand.filter(idx => idx!=$(el).index());
    });

    if (!turnOnOff){
      subjectlayer = $("#layeringsystem li:not([disabled])").filter((el,ob) => {
        if (affectedByRand.includes(el) && (Number($(ob).data("opacity"))>0)){
          return true;
        }else{
          affectedByRand = affectedByRand.filter(idx => idx!=el);
        }
      });
    }else{
      subjectlayer = $("#layeringsystem li:not([disabled])").filter((el) => affectedByRand.includes(el));
    }

    if (!rndMBlend){max_blends=1;}
    let materialA = Object.keys(ml_randomized);
    let numaterial = materialA.length;
    let material_colors = 0;
    let materialselect = "unused";
    let materialrnd = "";

    let numerocicle = subjectlayer.length;
    let microblenda = $("#mbSelect option:not([disabled])");

    //choosing how to apply the microblends on the layers with restrictons layer
    if ((numerocicle > 3)){
      layblend = 1 + Math.floor(Math.random() * (numerocicle-4))
    }

    subjectlayer.each((idx,el)=>{
      let tLayer = new Layer();

      if((turnOnOff) && ($(el).index()>0)){
        if (Math.random() > 0.45){ tLayer.opacity = 0 }
      }else{
        tLayer.opacity = (parseFloat(Math.random()*0.99) + parseFloat(0.01)).toFixed(2);
      }


      tLayer.tiles = (Math.random() * 15).toFixed(2);
      tLayer.microblend.tiles = (Math.random() * 15).toFixed(2);
      tLayer.microblend.contrast = Math.random().toFixed(2)

      materialselect = materialA[(Math.floor(Math.random() * (numaterial-1)))];

      if ((((rndMBlend) && (Math.random() > 0.6)) || ($(el).index()==layblend)) && ($(el).index()>0)  && (max_blends>0)){
        tLayer.microblend.file = microblenda[Math.floor(Math.random() * microblenda.length)].value
      }

      tLayer.material = materialJson.filter(mat => mat.text == materialselect)[0].a_attr['data-val'];
      tLayer.color = ml_randomized[materialselect].overrides.colorScale[Math.floor(Math.random() * (ml_randomized[materialselect].overrides.colorScale.length - 1))].n;

      $(el).data({
        "opacity":tLayer.opacity,
        "labels":"("+tLayer.color+") "+materialselect,
        "material":tLayer.material,
        "mattile":tLayer.tiles,
        "color":tLayer.color,
        "mbtile":tLayer.microblend.tiles,
        "mbcontrast":tLayer.microblend.contrast,
        "mbtile":tLayer.microblend.tiles,
        "mblend":tLayer.microblend.file,
      })

      $(el).attr({
        "data-opacity":tLayer.opacity,
        "data-labels":"("+tLayer.color+") "+materialselect,
        "data-material":tLayer.material,
        "data-mattile":tLayer.tiles,
        "data-color":tLayer.color,
        "data-mbtile":tLayer.microblend.tiles,
        "data-mbcontrast":tLayer.microblend.contrast,
        "data-mblend":tLayer.microblend.file,
      });
    })

    $("#layeringsystem li.active").click();
	});

  //Clean the actual selected layer
  $("#clean-Layer").click(function(){
    //if a layer is active
  	if ($("#layeringsystem li.active").length>0){
  		$("#matInput").val("base\\surfaces\\materials\\special\\unused.mltemplate");//clean the material
  		$("#layerOpacity").val("0.0").change();//zeroing the opacity
  		$("#layerColor").val("null_null");//color replace
  		$("#applytoMyLayer").click(); //trigger the application to layer
			$("#layeringsystem li.active").click() //reselect the layer to updates the material
  	}
  });
	//Erase layers and put opacity at 0.0 4 all of them unless the 0 one
  $("#wash-layers").click(function(){
    $("#layerRandomCfg").keyup(); //fixes a possible layer selection
    vacuumCleaner(true,true);
    $("#layeringsystem li.active").click();
  });

  //Activate the first layer disabled
  $("#actlast-Layer").click(function(){
    if ($("#layeringsystem li[disabled]").length>0){
      $("#layeringsystem li[disabled]").eq(0).removeAttr('disabled');
    }
  });

  //Erase layers but let opacity at 1.0
  $("#wipe-layer").click(function(){
    $("#layerRandomCfg").keyup(); //fixes a possible layer selection
    vacuumCleaner(false,true);
    $("#layeringsystem li.active").click();
  });

  //applying data to the structure of li
  $("#applytoMyLayer").click(function(){
    if ($("#layeringsystem li.active").length==1){
			$("#layeringsystem li.active").removeClass("notsync");
      normalizeNumbers();
      let livelloeditato =$("#layeringsystem li.active");
      livelloeditato.attr("data-opacity",$("#layerOpacity").val());//to activate/deactivate Opacity in layers display
      livelloeditato.attr("data-labels","("+$("#layerColor").val()+") "+ String($("#matInput").val()).replace(/^.*[\\\/]/, '').split('.')[0]);
      livelloeditato.data("material",$("#matInput").val());
      livelloeditato.data("mattile",$("#layerTile").val());
      livelloeditato.data("opacity",$("#layerOpacity").val());
      livelloeditato.data("color",$("#layerColor").val());
      livelloeditato.data("normal",String($("#layerNormal").val()));
      livelloeditato.data("roughin",String($("#layerRoughIn").val()));
      livelloeditato.data("roughout",String($("#layerRoughOut").val()));
      livelloeditato.data("metalin",String($("#layerMetalIn").val()));
      livelloeditato.data("metalout",String($("#layerMetalOut").val()));
      livelloeditato.data("offsetu",$("#layerOffU").val());
      livelloeditato.data("offsetv",$("#layerOffV").val());
      livelloeditato.data("mblend",$("#mbInput").val());
      livelloeditato.data("mbtile",$("#mbTile").val());
      livelloeditato.data("mbcontrast",$("#mbCont").val());
      livelloeditato.data("mbnormal",$("#mbNorm").val());
      livelloeditato.data("mboffu",$("#mbOffU").val());
      livelloeditato.data("mboffv",$("#mbOffV").val());
      semaphoreCLKmBlend=true;
    }else{
      notifyMe("NO level selected");
    }
  });
 /*------------------------------------------------------------------------------------
  Import Export of JSON
---------------------------------------------------------------------------------------*/
$("#importLink").click(function(){  $("#importTech").click(); })

//----File Auto Loader
$("#importTech").change(function(){
	var fr=new FileReader(); //new reading Object
	fr.onload=function(){
    mlSetupContent = fr.result;
    passTheMlsetup(fr.result);
    /*$("#passaggio").val(fr.result);
    $("#passaggio").change();*/
  } //get the result of the reading to the textarea
  if ($("#importTech")[0].files[0]){
    fr.readAsText($("#importTech")[0].files[0]); //Read as a text file
  }
});

$("#importFromWkit").click(function(){
  passTheMlsetup( $("#passaggio").val());
});

function passTheMlsetup(textContent=""){
  if (textContent!=""){
    $("#off_MLSetups div.offcanvas-body detail").fadeOut();
    var mls_content =" "
    try{
      mls_content = JSON.parse(textContent,mlsContRevive);
      mLsetup = new Mlsetup();
      mLsetup.import(mls_content);
      let test = $([mLsetup.template("<details {open} style='color:rgba(255,255,255,calc({opacity} + 0.3 ));'><summary >{i} {material|short}</summary><div class='row g-0'><div class='col-md-3'><img src='./images/{microblend|short}.png' class='img-fluid float-end rounded-0 me-1' width='64' ><img width='64' src='./images/material/{material|short}.jpg' data-ref='{material}' class='img-fluid float-end rounded-0' ></div><div class='col-md-9'><div class='card-body p-0'><ul><li>Opacity {opacity}</li><li>Tiles {tiles}</li><li>colorScale {color}</li></ul></div></div></div></details>")].join("\n"));
      $(".mlpreviewBody").html(test)
    }catch(error){
      notifyMe(`Error: ${error}`)
    }
    off_MLSetup.show();
  }
}

/*fix for mlsetup version .7*/
function mlsContRevive(key,value){
  if (typeof(value)=='object'){
    if (value.hasOwnProperty('$type')) {  
      switch (value['$storage']) {
        case 'string':
            return String(value['$value']);
            break;
        case 'uint64':
            return Number(value['$value']);
            break;
      }
    }
  }
  return value;
}

//Used to calculate the ranges as Documents printing notations
function syntheticRanges(text='', maxIndex = 20){
  var ranges = [];
  text = text.replaceAll(" ","");

  if (text==""){
    ranges = [...Array(maxIndex).keys()];
  }else{
    let taRanges = []; //temporary Array ranges
    taRanges = text.split(",")

    taRanges.forEach( el =>{
      let dummy = []
      if (el.includes("-") > 0){
        dummy = el.split("-").map(x=>parseInt(x))
        if (dummy[0] > dummy[1]){
          ranges.push([...range(Number(dummy[1]), Number(dummy[0])) ])
        }else{
          ranges.push([...range(Number(dummy[0]),Number(dummy[1]))])
        }
      }else{
        ranges.push(Number(el))
      }
    })
    ranges = [...new Set(ranges.flatMap(num => num))]
  }
  return ranges;
}
//Cleanep all the layers value
function vacuumCleaner(on = true, ranges = false){
  var c_opacity=1.0;

  var aRanges = [...Array(20).keys()];

  if (ranges) {
    $("#layerRandomCfg").val().replaceAll(" ","");
    aRanges = syntheticRanges($("#layerRandomCfg").val());
  }
  //Cleanup all layers value
  if(!on){ c_opacity = 0.0; }
  aRanges.forEach(id =>{
    if ($('#layeringsystem li').eq(id).attr("disabled")!="disabled"){
      $('#layeringsystem li').eq(id).data({
        mattile:'1.0',
        labels:'(null_null) unused',
        material:'base\\surfaces\\materials\\special\\unused.mltemplate',
        opacity:c_opacity,
        color:'null_null',
        normal:'null',
        roughin:'null',
        roughout:'null',
        metalin:'null',
        metalout:'null',
        offsetU:0.0,
        offsetV:0.0,
        mblend:'base\\surfaces\\microblends\\default.xbm',
        mbtile:1.0,
        mbcontrast:0.0,
        mbnormal:1.0,
        mboffu:0.0,
        mboffv:0.0
      });
      $('#layeringsystem li').eq(id).attr({
        "data-mattile":'1.0',
        "data-labels":'(null_null) unused',
        "data-material":'base\\surfaces\\materials\\special\\unused.mltemplate',
        "data-opacity":String(c_opacity),
        "data-color":'null_null',
        "data-normal":'null',
        "data-roughin":'null',
        "data-roughout":'null',
        "data-metalin":'null',
        "data-metalout":'null',
        "data-offsetU":'0.0',
        "data-offsetV":'0.0',
        "data-mblend":'base\\surfaces\\microblends\\default.xbm',
        "data-mbtile":'1.0',
        "data-mbcontrast":'0.0',
        "data-mbnormal":'1.0',
        "data-mboffu":'0.0',
        "data-mboffv":'0.0'
      });
    }
  })

  $('#layeringsystem li').eq(0).data({opacity:1.0});
  $('#layeringsystem li').eq(0).attr({"data-opacity":"1.0"});
}

//----Button to load
$("#TheMagicIsHere").click(function(){
    off_MLSetup.hide();
    console.log(mLsetup);
    //Layer Cleanup for disabled layers
    disabledLayers = 20 - mLsetup.Layers.length;

    $(`#layeringsystem li`).removeAttr('disabled');

    if (disabledLayers>0){
      $(`#layeringsystem li:nth-last-child(-n+${disabledLayers})`).attr('disabled','disabled');
      for(h=19;h>=20-disabledLayers;h--){
        mLsetup.reset(h);
      }
    }
    //Layer data build
    for(k=0;k<20;k++){
      $('#layeringsystem li').eq(k).data({
        mattile:mLsetup.Layers[k].tiles,
        labels:'('+mLsetup.Layers[k].color+') '+ String(mLsetup.Layers[k].material).replace(/^.*[\\\/]/, '').split('.')[0],
        material:mLsetup.Layers[k].material,
        opacity:mLsetup.Layers[k].opacity,
        color:mLsetup.Layers[k].color,
        normal:mLsetup.Layers[k].normal,
        roughin:mLsetup.Layers[k].roughnessIn,
        roughout:mLsetup.Layers[k].roughnessOut,
        metalin:mLsetup.Layers[k].metalIn,
        metalout:mLsetup.Layers[k].metalOut,
        offsetU:mLsetup.Layers[k].offsetU,
        offsetV:mLsetup.Layers[k].offsetV,
        mblend:mLsetup.Layers[k].microblend.file,
        mbtile:mLsetup.Layers[k].microblend.tiles,
        mbcontrast:mLsetup.Layers[k].microblend.contrast,
        mbnormal:mLsetup.Layers[k].microblend.normal,
        mboffu:mLsetup.Layers[k].microblend.offset.h,
        mboffv:mLsetup.Layers[k].microblend.offset.v
      });
      $('#layeringsystem li').eq(k).attr({
        "data-mattile":mLsetup.Layers[k].tiles,
        "data-labels":'('+mLsetup.Layers[k].color+') '+ String(mLsetup.Layers[k].material).replace(/^.*[\\\/]/, '').split('.')[0],
        "data-material":mLsetup.Layers[k].material,
        "data-opacity":mLsetup.Layers[k].opacity,
        "data-color":mLsetup.Layers[k].color,
        "data-normal":mLsetup.Layers[k].normal,
        "data-roughin":mLsetup.Layers[k].roughnessIn,
        "data-roughout":mLsetup.Layers[k].roughnessOut,
        "data-metalin":mLsetup.Layers[k].metalIn,
        "data-metalout":mLsetup.Layers[k].metalOut,
        "data-offsetU":mLsetup.Layers[k].offsetU,
        "data-offsetV":mLsetup.Layers[k].offsetV,
        "data-mblend":mLsetup.Layers[k].microblend.file,
        "data-mbtile":mLsetup.Layers[k].microblend.tiles,
        "data-mbcontrast":mLsetup.Layers[k].microblend.contrast,
        "data-mbnormal":mLsetup.Layers[k].microblend.normal,
        "data-mboffu":mLsetup.Layers[k].microblend.offset.h,
        "data-mboffv":mLsetup.Layers[k].microblend.offset.v
      });
    }
    var nomefile  = $("#importTech").val()=="" ? $('#nametoexport').val() : $("#importTech").val().substring($("#importTech").val().lastIndexOf('\\')+1);

    console.log(`%c- Imported ${nomefile} -`,"background-color:green;color:yellow;");

    notifyMe(`Imported : ${nomefile}`,false);
    $('#nametoexport').val(nomefile);
    $("#importTech").val("");
    $("#layeringsystem li.active").click();

    return

	});

$("select[name='exportVersion']").change(function(){
  localStorage.setItem("ExportFormat",$(this).val())
});

//3 export versions for Wkit
$(".xportJSON").click(function(){
  ver = Number($("select[name='exportVersion']").val());

  let nomefile = 'commonlayer.mlsetup.json';
  //check if there is already a chosed Names
  if (String($("#nametoexport").val()).trim()!==''){
    nomefile = String($("#nametoexport").val()).split('.')[0].replace(/\W/g, '').toLowerCase();
  }

  if ($("#layeringsystem li").length > 0 ){
    var jsonDate = (new Date()).toJSON();
    var preamble, ratiovalue, ratioIVal, useNormal, closing, jsonbody = "";

    switch(ver){
      case 0:
          preamble ='{\r\n'
            +'  "Chunks": {\r\n'
            +'    "0": {\r\n'
            +'      "Type": "Multilayer_Setup",\r\n'
            +'      "ParentIndex": -1,\r\n'
            +'      "Properties": {\r\n'
            +'        "cookingPlatform": [\r\n'
            +'          "PLATFORM_PC"\r\n'
            +'        ],\r\n'
            +'        "layers": [\r\n';
          ratiovalue='\r\n';
          ratioIVal = $("#layerRatio").val();
          if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined) && (Number(ratioIVal)!=1)){
              ratiovalue = ',\r\n        "ratio": '+Number(ratioIVal)+'\r\n';
          }
          closing = '\r\n        ]'+ratiovalue+'      }\r\n    }\r\n  }\r\n}'; //file tail
          jsonbody = '';

          for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
            jsonOpacity='';
            jsonOffsetU='';
            jsonOffsetV='';
            jsonMbOffU='';
            jsonMbOffV='';
            jsonMBTile='';
            jsonlayerRoughIn='            "roughLevelsIn": "null",\r\n';

            if (k!=0){
              //no Opacity
              //no offsetu no offsetv
              jsonOpacity='            "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('opacity')==1){
              jsonOpacity='';
            }
            if ($("#layeringsystem li").eq(k).data('offsetu')>0) {
              jsonOffsetU='            "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n';
            }

            if ($("#layeringsystem li").eq(k).data('offsetv')>0) {
              jsonOffsetV='            "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n';
            }

            if ($("#layeringsystem li").eq(k).data('mboffu')>0) {
              jsonMbOffU='            "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('mboffv')>0) {
              jsonMbOffV='            "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('mblend').replace(/^.*[\\\/]/, '').split('.')[0]!="default"){
              if (Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(2)!=1.00){
                jsonMBTile='            "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n';
              }
            }
            if ($("#layeringsystem li").eq(k).data('roughin')!='null'){
              if(($("#layeringsystem li").eq(k).data('roughin')=='2e977a') || ($("#layeringsystem li").eq(k).data('roughin')=='48a1ae')){
                jsonlayerRoughIn='            "roughLevelsIn": "'+$("#layeringsystem li").eq(k).data('roughin')+'",\r\n'
              }
            }

              jsonbody += '          {\r\n            "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
                  +jsonMBTile
                  +'            "microblend": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
                  +'            "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
                  +'            "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
                  +jsonMbOffU+jsonMbOffV+jsonOpacity+jsonOffsetU+jsonOffsetV
                  +'            "material": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
                  +'            "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
                  +'            "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
                  +jsonlayerRoughIn
                  +'            "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'",\r\n'
                  +'            "metalLevelsIn": "null",\r\n'
                  +'            "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'"\r\n'
                  +'          },\r\n';

          }
        break;
      case 1:
        preamble ='{\r\n'
            +'  "Header": {\r\n'
            +'    "WolvenKitVersion": "8.5.0",\r\n'
            +'    "WKitJsonVersion": "0.0.1",\r\n'
            +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
            +'    "DataType": "CR2W",\r\n'
            +'    "ArchiveFileName": ""\r\n'
            +'  },\r\n'
            +'  "Data": {\r\n'
            +'    "Version": 195,\r\n'
            +'    "BuildVersion": 0,\r\n'
            +'    "RootChunk": {\r\n'
            +'      "Type": "Multilayer_Setup",\r\n'
            +'      "Properties": {\r\n'
            +'        "cookingPlatform": "PLATFORM_PC",\r\n'
            +'        "layers": [\r\n';

        ratiovalue='\r\n';
        ratioIVal = $("#layerRatio").val();
        if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
            ratiovalue = ',\r\n        "ratio": '+Number(ratioIVal)+',\r\n';
        }else{
            ratiovalue = ',\r\n        "ratio": 1,\r\n';
        }
        if ($('#useNormals').is(':checked')){
          useNormal = '        "useNormal": 1\r\n'
        }else{
          useNormal = '        "useNormal": 0\r\n'
        }
        closing = '\r\n        ]'+ratiovalue+useNormal+'      }\r\n    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}'; //file tail
        jsonbody = '';
        for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
          jsonOpacity='';
          if (k!=0){
        //no Opacity
        //no offsetu no offsetv
            jsonOpacity='              "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed( Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
          }
          if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
            jsonbody += '          {\r\n            "Type": "Multilayer_Layer",\r\n            "Properties": {\r\n'
              +'              "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
              +'              "material": {\r\n'
              +'                "DepotPath": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
              +'                "Flags": "Default"\r\n'
              +'              },\r\n'
              +'              "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
              +'              "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
              +'              "metalLevelsIn": "null",\r\n'
              +'              "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'",\r\n'
              +'              "microblend": {\r\n'
              +'                "DepotPath": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
              +'                "Flags": "Default"\r\n'
              +'              },\r\n'
              +'              "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
              +'              "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
              +'              "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
              +'              "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
              +'              "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
              +'              "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
              +'              "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
              +'              "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n'
              +jsonOpacity
              +'              "overrides": 0,\r\n'
              +'              "roughLevelsIn": "null",\r\n'
              +'              "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
              +'            }\r\n          },\r\n';
          }

        break;
      case 2:
        preamble ='{\r\n'
                      +'  "Header": {\r\n'
                      +'    "WolvenKitVersion": "8.7.0",\r\n'
                      +'    "WKitJsonVersion": "0.0.2",\r\n'
                      +'    "GameVersion": 1520,\r\n'
                      +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
                      +'    "DataType": "CR2W",\r\n'
                      +'    "ArchiveFileName": ""\r\n'
                      +'  },\r\n'
                      +'  "Data": {\r\n'
                      +'    "Version": 195,\r\n'
                      +'    "BuildVersion": 0,\r\n'
                      +'    "RootChunk": {\r\n'
                      +'      "$type": "Multilayer_Setup",\r\n'
                      +'      "cookingPlatform": "PLATFORM_PC",\r\n'
                      +'      "layers": [\r\n';
        ratiovalue='\r\n';
    		ratioIVal = $("#layerRatio").val();
    		if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
    				ratiovalue = ',\r\n      "ratio": '+Number(ratioIVal)+',\r\n';
    		}else{
    				ratiovalue = ',\r\n      "ratio": 1,\r\n';
    		}

    		if ($('#useNormals').is(':checked')){
    			useNormal = '      "useNormal": 1\r\n'
    		}else{
    			useNormal = '      "useNormal": 0\r\n'
    		}
        closing = '\r\n      ]'+ratiovalue+useNormal+'    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}';
        jsonbody = '';

        //The Layers
        for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
          jsonOpacity='';
          if (k!=0){
      			//no Opacity
      			//no offsetu no offsetv
      			jsonOpacity='          "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
      		}
          if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
          jsonbody += '        {\r\n          "$type": "Multilayer_Layer",\r\n'
    					+'          "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
    					+'          "material": {\r\n'
    					+'            "DepotPath": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
    					+'            "Flags": "Default"\r\n'
    					+'          },\r\n'
    					+'          "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
    					+'          "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
    					+'          "metalLevelsIn": "null",\r\n'
    					+'          "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'",\r\n'
    					+'          "microblend": {\r\n'
    					+'            "DepotPath": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
    					+'            "Flags": "Default"\r\n'
    					+'          },\r\n'
    					+'          "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
    					+'          "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
    					+'          "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
    					+'          "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
    					+'          "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
    					+'          "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
    					+'          "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
    					+jsonOpacity
    					+'          "overrides": 0,\r\n'
    					+'          "roughLevelsIn": "null",\r\n'
    					+'          "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
    					+'        },\r\n';
        }

        break;
        case 3:
          preamble ='{\r\n'
          +'  "Header": {\r\n'
          +'    "WolvenKitVersion": "8.11.0",\r\n'
          +'    "WKitJsonVersion": "0.0.8",\r\n'
          +'    "GameVersion": 2000,\r\n'
          +'    "ExportedDateTime": "'+jsonDate+'",\r\n'
          +'    "DataType": "CR2W",\r\n'
          +'    "ArchiveFileName": ""\r\n'
          +'  },\r\n'
          +'  "Data": {\r\n'
          +'    "Version": 195,\r\n'
          +'    "BuildVersion": 0,\r\n'
          +'    "RootChunk": {\r\n'
          +'      "$type": "Multilayer_Setup",\r\n'
          +'      "cookingPlatform": "PLATFORM_PC",\r\n'
          +'      "layers": [\r\n';
          
          ratiovalue='\r\n';
    		  ratioIVal = $("#layerRatio").val();
          if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined)){
              ratiovalue = ',\r\n      "ratio": '+Number(ratioIVal)+',\r\n';
          }else{
              ratiovalue = ',\r\n      "ratio": 1,\r\n';
          }

          if ($('#useNormals').is(':checked')){
            useNormal = '      "useNormal": 1\r\n'
          }else{
            useNormal = '      "useNormal": 0\r\n'
          }
          closing = '\r\n      ]'+ratiovalue+useNormal+'    },\r\n    "EmbeddedFiles": []\r\n  }\r\n}';
          jsonbody = '';
          for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
            jsonOpacity='';
            if (k!=0){
              //no Opacity
              //no offsetu no offsetv
              jsonOpacity='          "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
            }
            if ($("#layeringsystem li").eq(k).data('opacity')==1){ jsonOpacity=''; }
            jsonbody += '        {\r\n          "$type": "Multilayer_Layer",\r\n'
                +'          "colorScale": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('color')+'"\r\n'
                +'          },\r\n'
                +'          "material": {\r\n'
                +'            "DepotPath": {\r\n'
                +'              "$type": "ResourcePath",\r\n'
                +'              "$storage": "string",\r\n'
                +'              "$value": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'"\r\n'
                +'            },\r\n'
                +'            "Flags": "Default"\r\n'
                +'          },\r\n'
                +'          "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
                +'          "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n'
                +'          "metalLevelsIn": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "null"\r\n'
                +'          },\r\n'
                +'          "metalLevelsOut": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('metalout')+'"\r\n'
                +'          },\r\n'
                +'          "microblend": {\r\n'
                +'            "DepotPath": {\r\n'
                +'              "$type": "ResourcePath",\r\n'
                +'              "$storage": "string",\r\n'
                +'              "$value": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'"\r\n'
                +'            },\r\n'
                +'            "Flags": "Default"\r\n'
                +'          },\r\n'
                +'          "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
                +'          "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
                +'          "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n'
                +'          "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n'
                +'          "normalStrength":{\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('normal')+'"\r\n'
                +'          },\r\n'
                +'          "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n'
                +'          "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n'
                +jsonOpacity
                +'          "overrides": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "None"\r\n'
                +'          },\r\n'
                +'          "roughLevelsIn": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "null"\r\n'
                +'          },\r\n'
                +'          "roughLevelsOut": {\r\n'
                +'            "$type": "CName",\r\n'
                +'            "$storage": "string",\r\n'
                +'            "$value": "'+$("#layeringsystem li").eq(k).data('roughout')+'"\r\n'
                +'          }\r\n'
                +'        },\r\n';
          }
          break;
    }

    jsonbody = jsonbody.slice(0,-3); //removes latest commas
    taskProcessBar();

    thePIT.Export({
      file:nomefile,
      content:preamble+jsonbody+closing,
      type:'mlsetup',
      compile: $("#checkCompile").is(":checked")
    });
  }
});

function taskProcessBar(active = true){
  onOffSwitch=!!active
  if (onOffSwitch){
    $("#pBar").addClass('progress p-0 border-0 rounded-0');
    $("#pBar").html(`<div class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" aria-label="Danger striped example" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>`);
  }else{
    $("#pBar").removeClass('progress p-0 border-0 rounded-0');
    $("#pBar").html(``);
  }
}

$("#unCookModal .modal-body .form-check-input").click(function(){
	if ($(this).is(':checked')){
		$(this).next('span.badge').addClass('bg-warning text-dark').removeClass('bg-dark text-muted');
	}else{
		$(this).next('span.badge').addClass('bg-dark text-muted').removeClass('bg-warning text-dark');
	}
})

$("#arc_GA4, #arc_AP4, #arc_NC3, #arc_FNT4, #ep1_WE, #ep1_VE, #ep1_ME, #ep1_EN").change(function(){
	//console.log($(this))
	if ($(this).is(':checked')){
		$(this).next('span.badge').addClass('bg-warning text-dark').removeClass('bg-dark text-muted');
	}else{
		$(this).next('span.badge').addClass('bg-dark text-muted').removeClass('bg-warning text-dark');
	}
});

var uncookTimer

$("#triggerUncook").click(function(){
  $("#stopUncook").prop("disabled",false);
	$("#triggerUncook").prop("disabled",true);
	$("#uncookCog").removeClass('d-none');
  $("#triggerUncook").prepend('<i class="fa-solid fa-gear fa-spin"></i> ');
	let files = new Array()
	$('#uncookCheck > details > div > input.form-check-input').each(function(){
		files.push($(this).is(':checked'))
	})
	thePIT.UnCookMe(files);
  uncookTimer = setInterval(()=>{
    $("#uncookLogger div").html("");
  },60000);
});

$("#stopUncook").click(function(){
  $("#triggerUncook svg").remove();
  thePIT.stopUncook();
  clearInterval(uncookTimer);
});

$("#MycroMe").click(function(){
	$("#MycroMe").prop("disabled",true);
	$("#mycroCog").removeClass('d-none');
	$("#uncook_micro_opt01, #uncook_micro_opt02, #uncook_micro_opt03, #uncook_mresize, #uncook_mthumbs").attr("style","0%").html('')
	$("#microLogger div").html('');
	thePIT.microMe();
});

// masks selector modal
$("body").on("click","#customMaskSelector option",function(ev){
	$("#lblmaskselected").text($( this ).text().split("\/").reverse()[0])
	$("#lblmaskselected").removeClass("text-muted").addClass("text-white")
});

$("#masksCFinder").on('keyup',function(ev){
	if ($("#masksCFinder").val()!=''){
		$("#customMaskSelector option:contains('"+encodeURI($("#masksCFinder").val())+"')").removeClass('d-none');
		$("#customMaskSelector option").not(":contains('"+encodeURI($("#masksCFinder").val())+"')").addClass('d-none');
	}else{
		$("#customMaskSelector option").removeClass('d-none');
	}
});

$("#masksFinderClearer").click(function(){
	$("#masksCFinder").val("");
	$("#masksCFinder").keyup();
})

/* let the user choose a mlmask file */
$("#pickCustMask").click(function(){
  let getinfo = thePIT.RConfig('paths.depot')
  getinfo.then((uncook)=>{
    thePIT.PickMask(uncook);
  }).catch((error)=>{
    notifyMe(error);
  })
});
/* react to a mask change */
$("#lblmasktoAdd").bind("update",function(){
  console.log($(this).attr("value"));
})


$("#modelCustomPath").click(function(e){
  customLoad();
});

$("#modelOpenPath, #masksOpenPath ,#NormOpenPath").click(function(){
  let percorso = $(this).parent().children("input[type='text']").val();
  if (percorso!=""){
    let getinfo = thePIT.RConfig('paths.depot')
    getinfo.then((uncook)=>{
      thePIT.Foldering(uncook+percorso.substring(0,percorso.lastIndexOf('\/')+1));
    }).catch((error)=>{
      notifyMe(error);
    })
  }
});
//use the copy function for paths
 $("#modelCopyPath").click(function(){
    navigator.clipboard.writeText($("#prefxunbundle").val()+$("#modelTarget").val().replaceAll(/\//g,'\\'));
  });
 $("#modelTexPath").click(function(){
   navigator.clipboard.writeText($("#prefxunbundle").val()+$("#masksTemplate").val().replaceAll(/\//g,'\\'));
  });
	$("#modelNorPath").click(function(){
    navigator.clipboard.writeText($("#prefxunbundle").val()+$("#normTemplate").val().replaceAll(/\//g,'\\'));
   });

	var legacyMatOpen = thePIT.RConfig('legacymaterial')
	legacyMatOpen.then((isopen)=>{
		$('#legacyMatSector').attr('open',isopen);
	});

/*
https://thewebdev.info/2021/09/05/how-to-flatten-javascript-object-keys-and-values-to-a-single-depth-object/#:~:text=Single%20Depth%20Object-,To%20flatten%20JavaScript%20object%20keys%20and%20values%20to%20a%20single,the%20object%20we're%20flattening.&text=to%20create%20the%20obj%20object,%2C%20parent%20%2C%20and%20res%20objects.
  const flattenObj = (obj, parent, res = {}) => {
    for (const key of Object.keys(obj)) {
      const propName = parent ? parent + '.' + key : key;
      if (key=='childrens'){
        flattenObj(obj[key], parent.hash, res);
      }
      if (typeof obj[key] === 'object') {
        flattenObj(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  }
  */

  const prepTheList = (obj, parent) =>{
    if (obj!==null && obj!==undefined){
      if (obj.hasOwnProperty("children")){
        obj.children.forEach((figlio)=>{
          prepTheList(figlio,obj)
        })
        /*
        for (i=0,k=obj.children.length;i<k;i++){
          prepTheList(obj.children[i],obj)
          console.log(FolderImport);
        }
        */
      }
      if (obj.type=="directory"){
        if (obj.relativePath==='.'){
          FolderImport.add({id:obj.hash,text:obj.name,parent:'folderScan'},'dirs');
        }else{
          FolderImport.add({id:obj.hash,text:obj.name,parent:parent.hash},'dirs');
        }
      }else{
        if (obj.name.match(/.+\.glb$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'mesh',parent:parent.hash,path:obj.path},'models');
        }else if (obj.name.match(/.+\.(png|dds|xbm)$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'texture',parent:parent.hash,path:obj.path},'textures');
        }else if (obj.name.match(/.+\.(mlmask)$/)){
          FolderImport.add({id:obj.hash,text:obj.name,type:'mask',parent:parent.hash,path:obj.path},'masks');
        }
      }
    }
  }

//Dialog section

const uncookfile = document.getElementById("uncookfile");
const unCooKonfirm = document.getElementById("unCooKonfirm");


uncookfile.addEventListener("close", (e) => {
  if (uncookfile.returnValue == "true") {
    notifyMe(`Trigger the uncook of the file: ${MLSB.TreeD.lastModel}`);
    thePIT.UnCookSingle(MLSB.TreeD.lastModel.replace(".glb",".mesh").replaceAll("\/","\\").replace("\\base\\","base\\").replaceAll("\\ep1\\","ep1\\"));
    taskProcessBar();
  }else{
    notifyMe("File uncook cancelled by the user")
  }
});

// Prevent the "confirm" button from the default behavior of submitting the form, and close the dialog with the `close()` method, which triggers the "close" event.
unCooKonfirm.addEventListener("click", (event) => {
  event.preventDefault(); // We don't want to submit this fake form
  uncookfile.close("true"); // Have to send the select box value here.
});

  $("#KofiSupportPage").click(function(){
    thePIT.ExtOpen({type:'url',param:'ko-fi'})
  })

  var flipMask = thePIT.RConfig('flipmasks')
                  .then((valore)=>{
                    if (valore){
                      $("#flipMask").prop("checked","checked");
                    }else{
                      $("#flipMask").prop("checked","");
                    }
                  }).catch((error)=>{
                    notifyMe(error);
                  });

  var flipNorm = thePIT.RConfig('flipnorm')
                  .then((valore)=>{
                    if (valore){
                      $("#flipNorm").prop("checked","checked");
                    }else{
                      $("#flipNorm").prop("checked","");
                    }
                  }).catch((error)=>{
                    notifyMe(error);
                  });
  
  $("#MBAFinder").on("input",function(e){
    
    if ($("#MBAFinder").val()!=""){

      var modelAppearances = $("#appeInfo div.card").find(".card-header");
      modelAppearances.each((index,element)=>{
        if ($(element).text().match($("#MBAFinder").val())){
          $(element).closest('div.col').show();
        }else{
          $(element).closest('div.col').hide();
        }
      });
    }else{
      $("#appeInfo div.col").show();
    }
  });

  $("body").on('click','#appearanceSwitcher .dropdown-menu li a',function(e){
    if ($(this).data("name")!==undefined){
      $("#appearanceSwitcher ul.dropdown-menu li a").removeClass('active');
      $(this).addClass('active');
      
      $(`#nav-appearance div.card`).removeClass('active');
      $(`#nav-appearance div.card button[data-appearance='${$(this).attr('data-name')}']`).closest('.card').addClass('active');
      /* Read the configuration of materials */

      console.log(materialJSON);
      
      /*
      scene.children.at(-1).children.forEach((element,index) => {
        if (element.hasOwnProperty(`type`)){
          if (element.type=='SkinnedMesh'){

            console.log(
              materialJSON.Materials.filter(el => el.Name == element.userData.materialNames[$("#appearanceSwitcher ul.dropdown-menu li a").index($(this))])
            );
          }
        }
      });
      */
    }
  });

  $("#DialogForSettings").click(function(){
    thePIT.clickTheMenuVoice('preferences');
  });

  $(".copyMe").click(function(e){
    var copyBle = $(this).prev("input").val();
    console.log(copyBle);
    navigator.clipboard.writeText(copyBle);
  });

  $("body").bind("updateMBlends",function(){
    setTimeout(()=>{
      $("#cagethemicroblends li").each((idx,elem)=>{
        let styleToGet = $(elem).attr('style');
        $(elem).attr('style',`background-image:${styleToGet.split(':')[1].replace('.png',`.png?${(new Date()).getTime()}`)}`);
      });
    },10000);
  });

  //Open the modal to setup the path of a project
  $("#btnModPaths").click(function(ev){
    setupModPath.showModal();
  });

  $("#pickProjectMod").click(function(ev){
    $("dialog#setupModPath input").val("");
    thePIT.pickPrjPath();
  });
  
  $("#emptyNotyLog").click(function(){
    $("#NotificationCenter .offcanvas-body").html("");
    notifyMe("Log reset",false);
  })

});
