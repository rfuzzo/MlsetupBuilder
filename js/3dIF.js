var flippingdipping = thePIT.RConfig('flipmasks');
var flipdipNorm = thePIT.RConfig('flipnorm');

var imgWorker
const normalMapInfo = {
  width : 128,
  height : 128
}

function genTexture(color,size=16){
	if (parseInt(size)>0){
		var dataColor = new Uint8Array(4 * size);
		//var color = new THREE.Color( color );
		
		if (color.hasOwnProperty('r') && color.hasOwnProperty('g') && color.hasOwnProperty('b')){
			var r= Math.floor(color.r * 255);
			var g= Math.floor(color.g * 255);
			var b= Math.floor(color.b * 255);
			for ( let i = 0; i < size; i ++ ) {
				const stride = i * 4;
				dataColor[ stride ] = r;
				dataColor[ stride + 1 ] = g;
				dataColor[ stride + 2 ] = b;
				dataColor[ stride + 3 ] = 255;
			}
			return dataColor;
		}else{
			return new Uint8Array(4 *size);
		}
	}
	return false;
}

const BLACK = new THREE.DataTexture(genTexture(new THREE.Color( 0, 0 ,0 ) ),4,4);
const GRAY = new THREE.DataTexture(genTexture(new THREE.Color( 0.5, 0.5 ,0,5 ) ),4,4);
const WHITE = new THREE.DataTexture(genTexture(new THREE.Color( 1, 1 ,1 ) ),4,4);
const FlatNORM = new THREE.DataTexture(genTexture(new THREE.Color( 0.47, 0.47 ,1 )),4,4);

function checkMaps(mapName="engine\\textures\\editor\\black.xbm"){
	if (mapName=="engine\\textures\\editor\\black.xbm"){
		return 0.0;
	}
	if (mapName=="engine\\textures\\editor\\white.xbm"){
		return 1.0;
	}
	return -1.0;
}

var materialStack = new Array();
var materialSet = new Set();
var multilayerStack = new Set();
var TextureStack = new Array();

const materialTypeCheck = {
	decals: [
		"base\\materials\\mesh_decal.mt",
		"base\\materials\\mesh_decal_emissive.mt",
		"base\\materials\\vehicle_mesh_decal.mt",
		"base\\materials\\mesh_decal_double_diffuse.mt",
		"base\\materials\\mesh_decal_parallax.mt",
		"base\\materials\\mesh_decal_gradientmap_recolor.mt"
		],
	fx:[
		"base\\fx\\shaders\\parallaxscreen.mt",
		"base\\materials\\vehicle_lights.mt",
		"base\\fx\\shaders\\device_diode.mt",
		"base\\fx\\_shaders\\holo_mask.mt",
		"base\\fx\\shaders\\hologram.mt"
	],
	glass: [
		"base\\materials\\glass.mt",
		"base\\materials\\glass_onesided.mt",
		"base\\materials\\vehicle_glass"
		],
	hair: [
		"base\\materials\\hair.mt",
		"base\\characters\\common\\hair\\textures\\hair_profiles\\_master__long.mi"
		],
	metal_base : [
		"engine\\materials\\metal_base.remt"
		],
	multilayer : [
		"engine\\materials\\multilayered.mt",
		"base\\materials\\vehicle_destr_blendshape.mt"
		],
	skin: [
		"base\\materials\\skin.mt"
	]
}

if (window.Worker) {
  imgWorker = new Worker('js/workers/imgWork.js');

  imgWorker.onmessage = (event) =>{
	
    context = nMeKanv.getContext('2d');
    context.putImageData(event.data,0,0,0,0,normalMapInfo.width,normalMapInfo.height);
    //normMe = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
    //material.normalMap = normMe;
    material.normalMap.needsUpdate = true
    //material.map.needsUpdate = true;
    material.normalMap.flipY = flipdipNorm;
  }
}

/* dat.GUI.prototype.removeFolder = function(name) {
   var folder = this.__folders[name];
   if (!folder) {
     return;
   }
   folder.close();
   this.__ul.removeChild(folder.domElement.parentNode);
   delete this.__folders[name];
   this.onResize();
 } */

function notify3D(message){
	let Data = new Date(Date.now());
	var NTextarea = document.querySelector("#NotificationCenter div.offcanvas-body");
	NTextarea.innerHTML = '[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + message+'<br/>'+NTextarea.innerHTML;
}

$("#thacanvas").on('fogNew',function(ev){
	try{
		scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);
	}catch(error){
		console.error(error);
		notify3D(error);
	}
});

$("#thacanvas").on('newlights',function(event,index){
	switch (index) {
		case 0:
			ambientlight.color = new THREE.Color(PARAMS.A_light_color);
			ambientlight.intensity = PARAMS.A_light_pow;
			break;
		case 1:
			pointLights[1].color = new THREE.Color(PARAMS.p_light1_col);
			pointLights[1].intensity = PARAMS.p_light1_pow;
			break;
		case 2:
			pointLights[2].color = new THREE.Color(PARAMS.p_light2_col);
			pointLights[2].intensity = PARAMS.p_light2_pow;
		case 3:
			pointLights[3].color = new THREE.Color(PARAMS.p_light3_col);
			pointLights[3].intensity = PARAMS.p_light3_pow;
		case 4:
			pointLights[4].color = new THREE.Color(PARAMS.p_light4_col);
			pointLights[4].intensity = PARAMS.p_light4_pow;
		default:
			break;
	}
	console.log(index);
});
$("#thacanvas").on('lightpos',function(event,index){
	switch (index) {
		case 1:
			pointLights[1].position.set(PARAMS.l1_pos.x,PARAMS.l1_pos.y,PARAMS.l1_pos.z);
			break;
		case 2:
			pointLights[2].position.set(PARAMS.l2_pos.x,PARAMS.l2_pos.y,PARAMS.l2_pos.z);
		case 3:
			pointLights[3].position.set(PARAMS.l3_pos.x,PARAMS.l3_pos.y,PARAMS.l3_pos.z);
		case 4:
			pointLights[4].position.set(PARAMS.l4_pos.x,PARAMS.l4_pos.y,PARAMS.l4_pos.z);
		default:
			break;
	}
	console.log(index);
});
$("#thacanvas").on('loadScene',function(event){
	/*
	Load Materials
		if there is no Material file try to export it
	Load First Layer mask
		if not found replace with a def. one and disable all layers except 0
	Load the Models and Apply Materials
	*/
	LoadMaterials($("#materialTarget").val());
});
$("#thacanvas").on('sided',function(event){
	if (PARAMS.oneside){material.side=THREE.FrontSide;}else{material.side=THREE.DoubleSide;}
})
$("#thacanvas").on('maskAlpha',function(event){
	material.alphaTest = PARAMS.maskChannel;
});
$("#thacanvas").on("theWire",function(event){
	material.wireframe =  hair_cap.wireframe = hair_card.wireframe = hair_short.wireframe = hair_other.wireframe = PARAMS.wireframes;
})

thacanvas.addEventListener('mousedown',(event)=>{
	event.preventDefault();
	if (event.shiftKey && (event.button==0)){
		paintMaskCTX.beginPath();
	}
});

thacanvas.addEventListener('mouseup',(event)=>{
	event.preventDefault();
	if (event.shiftKey &&  (event.button==0)){
		console.log('mouseup',event.button)
		paintMaskCTX.closePath();
	}
});

thacanvas.addEventListener( 'mousemove', (event)=>{
	event.preventDefault();
});

function onMouseMove( event ) {
	event.preventDefault();
	if (paintMask3D){
		const array = getMousePosition( thacanvas, event.clientX, event.clientY );
		onClickPosition.fromArray( array );
		if (scene.children.filter(el => el.type.toLowerCase()=='group').length>0){
			const intersects = getIntersects( onClickPosition, scene.children.filter(el => el.type.toLowerCase()=='group')[0].children); //fix for GLB loaded scene
			if ( intersects.length > 0 && intersects[ 0 ].uv ) {

				const uv = intersects[ 0 ].uv;
				uvPaint.fromArray(intersects[ 0 ].uv)
				canvas.setCrossPosition( uv.x, uv.y );
				draw( paintMaskCTX, uv.x * 768, 768 - uv.y * 768 );
			}
		}
	}
}

$("body").on('click','#cagecolors span',function(){
	material.color=new THREE.Color($(this).css("background-color"));
	material.needsUpdate;
});
/*TODO Aggiungere filtro dell'attuale scena con solo i membri in gruppo filtrati per rimuovere inutili mesh da controllare.*/

function getMousePosition( dom, x, y ) {
	const rect = dom.getBoundingClientRect();
	return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
}

function getIntersects( point, objects ) {
	mouseCurPos.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
	raycaster.setFromCamera( mouseCurPos, camera );
	return raycaster.intersectObjects( objects, false );
}

var nMeKanv = document.getElementById('normalMe');
const paintMaskHT = document.getElementById('maskPainter');
const paintMaskCTX = paintMaskHT.getContext('2d');
paintMaskCTX.willReadFrequently = true;
paintMaskCTX.lineCap = "round";
var pressure = 0.2;
var snapsManager = document.getElementById('Snapshots');
paintMaskCTX.save();

//grayscaleCheck = document.getElementById('gScalePaint');

function HairTexture(hairData=[{c:'#002250',p:0},{c:'#002250',p:1}]) {
	var size = 256;
	// get canvas
	canvas = document.getElementById( 'hairTex' );//canvas.height = size; //canvas.width = size;
	// get context
	var context = canvas.getContext( '2d' );
	// draw gradient
	context.rect( 0, 0, size, size );
	var gradient = context.createLinearGradient( 128, 0, 128, size );
	hairData.forEach((swatch)=>{
		gradient.addColorStop(swatch.p,swatch.c);
	})
	/*
	gradient.addColorStop(0, '#99ddff'); // light blue
	gradient.addColorStop(1, 'transparent');*/
	context.fillStyle = gradient;
	context.fill();
}

function clearCanvas(target,fillStyle='', squareSize = 0){
  let t_canvas = target.getContext('2d');
  t_canvas.clearRect(0,0,squareSize,squareSize)
  if (fillStyle!=''){
    t_canvas.fillStyle = fillStyle;
    t_canvas.fillRect(0,0,squareSize,squareSize)
  }
}

function safeNormal(){
	nMeKanv.width=128;
	nMeKanv.height=128;
	nctx = nMeKanv.getContext('2d');
	nctx.clearRect(0, 0, nMeKanv.width, nMeKanv.height);
	nctx.fillStyle = `rgb(120,119,255)`;
	nctx.fillRect(0, 0, 128, 128);
}

function theChecked( sons ){
  /*Find the index of the checked submesh to unwrap their UVs */
  var checked = [];
   if (sons.length != 0 ){
     for (let i = 0 , k = sons.length; i < k; i++){
       if (sons[i].checked){
         checked.push(i);
       }
     }
   }
   return checked;/*return an array of indexes*/
}

 var paintMask3D = false;
 var err_counter = 0;
 var control_reset = false;
 var control_side = false;
 var getImageData = false;
 var imgDataShot = null;
 var scene, camera, renderer, controls, axesHelper;
 let ambientlight;
 var pointLights = [];
//-------------Aiming box for the camera ----------------------

//basic material map

//-------------Material and Object Constant--------------------
//const safeMap = new THREE.TextureLoader().load( "./images/favicon.png" );
const canvasPaint = new THREE.CanvasTexture(paintMaskCTX.canvas);
canvasPaint.format = THREE.LuminanceFormat
canvasPaint.wrapS = THREE.RepeatWrapping
canvasPaint.wrapT = THREE.RepeatWrapping
const drawStartPos = new THREE.Vector2();

const material = new THREE.MeshStandardMaterial({color: 0x500000,map:canvasPaint,alphaMap:canvasPaint,alphaTest:0});
const metal_base = new THREE.MeshStandardMaterial({color: 0x808080});
const skin = new THREE.MeshNormalMaterial(); //MeshStandardMaterial({color: 0xe65c8c});
const noMaterial = new THREE.MeshStandardMaterial({color: 0x808000});

const glass = new THREE.MeshPhysicalMaterial({  roughness: 0.2,   transmission: 1, thickness: 0.005});
//material for stitches zip and other things
//-------------Hairs Materials----------------------------------
var hairShading = document.getElementById('hairTex');
HairTexture();

const hairCText = new THREE.CanvasTexture(hairShading);
const hair_card = new THREE.MeshStandardMaterial({map:hairCText,transparent:false,side:THREE.DoubleSide,fog:true});
const hair_cap = new THREE.MeshStandardMaterial({color: 0x502200,side:THREE.FrontSide});//
//const hair_card = new THREE.MeshStandardMaterial({color: 0x002250,side:THREE.DoubleSide});//
const hair_short = new THREE.MeshStandardMaterial({color: 0x225022,side:THREE.DoubleSide});//
const hair_other = new THREE.MeshStandardMaterial({color: 0x222222,side:THREE.DoubleSide});//

//__this will be for direct painting purpose
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const intersects = [];

const mouseCurPos = new THREE.Vector2();
const onClickPosition = new THREE.Vector2();
const uvPaint = new THREE.Vector2();

//

safeNormal();
var normMe = new THREE.CanvasTexture(nMeKanv);
var canvUVWrapped = document.getElementById('UVMapMe');

//const maploader = new THREE.FileLoader().setResponseType('arraybuffer');
const loader = new THREE.GLTFLoader(); //loader for Gltf and glb models
//const loader = new GLTFLoader();
//const fbxloader = new THREE.FBXLoader(); //loader for FBX Format


/*control onto the flip*/

var flipcheck = document.getElementById("flipMask");

flipcheck.onclick=function(){
  let layerSelected = document.querySelector("#layeringsystem li.active");
  flippingdipping = flipcheck.checked;
  thePIT.savePref({flipmasks:flippingdipping});
  //need to update the canvas
  material.map.flipY = flippingdipping;
  if (layerSelected){
    layerSelected.click();
  }  
}

var flipNcheck = document.getElementById("flipNorm");
flipNcheck.onclick=function(){
  flipdipNorm = flipNcheck.checked;
  thePIT.savePref({flipnorm:flipdipNorm});
  //need to update the canvas
  var test = document.getElementById("normalMe");
  var test2 = test.getContext("2d");
  var image = test2.getImageData(0,0,normalMapInfo.width,normalMapInfo.height)
  if (window.Worker) {
    imgWorker.postMessage(image)
  }
}

//document.documentElement.style.setProperty('--rendView', '700px'); //used for changing the viewport size
//Parametric Render width from CSS
//const renderwidth = Number((parseInt(document.getElementById("interface").offsetWidth/9)*4)-15)
const renderwidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--rendView').replace(/px/,''));
let resized = false; //semaphore for resizing behaviour
window.addEventListener('resize', function() {  resized = true;  });// resize event listener

document.getElementById("UVSave").addEventListener('click', (e) =>{
  let down = document.getElementById("UVSave")
  let UWUnwrapped = canvUVWrapped.toDataURL('image/png');
  down.href = UWUnwrapped;
  down.download = "uvmap.png";
});

document.getElementById("expMsk").addEventListener('click', (e) =>{
  let mylayer = document.querySelector("#masksPanel li.active").innerText;
  let down = document.getElementById("expMsk")
  let UWUPaintedMask = paintMaskHT.toDataURL('image/png');
  down.href = UWUPaintedMask;
  down.download = "newmask_layer_"+mylayer+".png";
});

document.getElementById("UVGen").addEventListener('click', (e) =>{
  canvUVWrapped.dispatchEvent(new Event("dblclick"));
});

let paint = false;
paintMaskCTX.lineWidth = 0.2;

let originalLayer = '';

// add canvas event listeners
paintMaskHT.addEventListener( 'pointerdown', function ( e ) {
	//pressure = Number(document.getElementById("strokeMsk").value) + (Number(document.getElementById("strokeMsk").value) * e.pressure)
	pressure = Number(document.getElementById("strokeMsk").value);
	paint = true;
	drawStartPos.set( e.offsetX, e.offsetY );
});

paintMaskHT.addEventListener( 'pointermove', function ( e ) {
	//pressure = Number(document.getElementById("strokeMsk").value) + (Number(document.getElementById("strokeMsk").value) * e.pressure)
	pressure = Number(document.getElementById("strokeMsk").value);
	if ( paint ) draw( paintMaskCTX, e.offsetX, e.offsetY );
});

paintMaskHT.addEventListener( 'pointerup', function (e) {
  console.log('pointerup');
	paint = false;
  paintMaskCTX.beginPath();
});

paintMaskHT.addEventListener( 'pointerleave', function () {
  console.log('pointerleave');
	paint = false;
  paintMaskCTX.closePath();
});

canvUVWrapped.addEventListener('dblclick',function(){
  try{
    if (scene.children.filter(elm => elm.type.toLowerCase()=='group')){
      var scena = scene.children.filter(elm => elm.type=='Group')
      if (scena[0].hasOwnProperty("children")){
        var sbmeshs = scena[0].children.filter( elm => elm.type == 'SkinnedMesh'|| elm.type == 'Mesh')
        var sz = 768;
        clearCanvas(canvUVWrapped,'',768);

        const ctxxxx = canvUVWrapped.getContext('2d');

        const abc = 'abc';
        const a = new THREE.Vector2();
        const b = new THREE.Vector2();
        const uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];
        const face = [];
        const width = height =768;

        let container = document.getElementById("unChecksMesh");
        let tocompute = theChecked(container.querySelectorAll("input[type='checkbox']"))

        var lod
        tocompute.forEach((x)=>{
          	lod = sbmeshs[x]
          	const index = lod.geometry.index;
			const uvAttribute = lod.geometry.attributes.uv;
          	ctxxxx.strokeStyle = "#"+tinycolor.fromRatio({r:(Math.random()*.5),g:(Math.random()*.4+.6),b:(Math.random()*.4+.6)}).toHex();
          	ctxxxx.lineWidth = .2;

          var il
          if ( index ) {
            il = index.count
          }else{
            il = uvAttribute.count
          }

          for ( let i = 0; i < il; i=i+3 ) {
  					face[ 0 ] = index.getX( i );
  					face[ 1 ] = index.getX( i + 1 );
  					face[ 2 ] = index.getX( i + 2 );
  					uvs[ 0 ].fromBufferAttribute( uvAttribute, face[ 0 ] );
  					uvs[ 1 ].fromBufferAttribute( uvAttribute, face[ 1 ] );
  					uvs[ 2 ].fromBufferAttribute( uvAttribute, face[ 2 ] );
  					//processFace( face, uvs, i / 3 );
            // draw contour of face
            ctxxxx.beginPath();
            a.set( 0, 0 );
            for ( let j = 0, jl = uvs.length; j < jl; j++ ) {
              const uv = uvs[ j ];
              a.x += uv.x;
              a.y += uv.y;
              if ( j === 0 ) {
                ctxxxx.moveTo( uv.x * ( width - 2 ) + 0.5, ( 1 - uv.y ) * ( height - 2 ) + 0.5 );
              } else {
                ctxxxx.lineTo( uv.x * ( width - 2 ) + 0.5, ( 1 - uv.y ) * ( height - 2 ) + 0.5 );
              }
            }
            ctxxxx.closePath();
            ctxxxx.stroke();
  				}
        })
      }
    }
  }catch(error){
    console.log(error,scena);
    notify3D("Errore di lettura",true);
  }

});

var MDLloadingButton = document.getElementById('btnMdlLoader');
var CustomLoadButton = document.getElementById('cstMdlLoader');
var UVSbmeshENA = document.getElementById('unChecksMesh');
//-------------Material and Object Constant--------------------
function paintDatas(textureData,w,h){
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  var imageData = octx.createImageData(w,h);
  var k=0;
  for (let i = 0; i < imageData.data.length; i += 4) {
 	 // Modify pixel data
 	 imageData.data[i] = textureData[k];  // R value
 		 imageData.data[i + 1] =  textureData[k]    // G value
 		 imageData.data[i + 2] =  textureData[k]  // B value
 	 imageData.data[i + 3] = 255;  // A value
 	 k++;
  }
  octx.putImageData(imageData,0,0,0,0,w,h);
  paintMaskCTX.drawImage(oc,0,0,768,768);
  oc.remove();
}

function DDSSize(binaryData){
	var bufferData = str2ab(binaryData);
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes

	if (
		(headerData[0]==0x44) &&
		(headerData[1]==0x44) &&
		(headerData[2]==0x53) ){
		//DDS Case
		const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
		let height = spaceData[3];
		let width = spaceData[4];
		return[height,width];
	}else{
		return [0,0];
	}
}

function DDSNormal(textureData,w,h){
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  var imageData = octx.createImageData(w,h);//var imageData = octx.createImageData(w,h);
  var k=0;
  for (let i = 0; i < imageData.data.length; i += 4) {
 	 // Modify pixel data
 	imageData.data[i] = textureData[k];  // R value
   	imageData.data[i + 1] = textureData[k+1];  // G value
   	imageData.data[i + 2] = 255;
 	imageData.data[i + 3] = 255;  // A value
 	k+=4;
  }
  octx.putImageData(imageData,0,0,0,0,w,h);
  nMeKanv.width=768;
  nMeKanv.height=768;
  nctx = nMeKanv.getContext('2d');
  nctx.drawImage(oc,0,0,768,768);
  oc.remove();
}

function giveToTheAim(textureData,w,h){
 var aimcanvas = document.getElementById('MaskTargettoAim');
 var ctx = aimcanvas.getContext('2d');
 aimcanvas.width=512;
 aimcanvas.height=512;

 var imageData = ctx.createImageData(w,h);
 var k=0;
 for (let i = 0; i < imageData.data.length; i += 4) {
	 // Modify pixel data
	 imageData.data[i] = textureData[k];  // R value
	 if (grayscaleCheck.checked){
		 imageData.data[i + 1] =  textureData[k]    // G value
		 imageData.data[i + 2] =  textureData[k]  // B value
	 }else{
		 imageData.data[i + 1] = 0    // G value
		 imageData.data[i + 2] = 0  // B value
	 }
	 imageData.data[i + 3] = 255;  // A value
	 k++;
 }
 //Create another temporary canvas
  var oc = document.createElement('canvas');
  oc.width=w;
  oc.height=h;
  var octx = oc.getContext('2d');
  octx.putImageData(imageData,0,0,0,0,w,h);
  //octx.putImageData(imageData,0,0,0,0,w,h);
  octx.scale(512/w,512/h);
  octx.setTransform(1,0,0,-1,0,0);
  //ctx.drawImage(oc,0,0,512,512);
  paintMaskCTX.drawImage(oc,0,0,768,768);
  oc.remove();
}

function draw( drawContext, x, y ) {
	let color = document.getElementById("maskoolor").getAttribute('data-color');
	drawContext.lineWidth = pressure;
	drawContext.moveTo( drawStartPos.x, drawStartPos.y );
	drawContext.strokeStyle = '#'+color;
	drawContext.lineTo( x, y );
	drawContext.stroke();
	// reset drawing start position to current position.
	drawStartPos.set( x, y );
	// need to flag the map as needing updating.
	material.map.needsUpdate = true;
}

function layersActive(index){
  let indicators = document.getElementById('layeringsystem');
  let listlayers = indicators.getElementsByTagName("li");

  let paintLayer = document.getElementById('masksPanel');
  let paint_L_ena = paintLayer.getElementsByTagName("li");

  for (var i=1; i < listlayers.length; i++) {
    if (Number(listlayers[i].innerText)>index){
     listlayers[i].setAttribute('disabled','disabled');
     listlayers[i].classList.remove('active');
     paint_L_ena[i].classList.add('off');
    }else{
     listlayers[i].removeAttribute('disabled');
     paint_L_ena[i].classList.remove('off');
    }
  }
}

//Revert to the original layer
document.getElementById('wipeMsk').addEventListener('click', (e) =>{
  if (originalLayer!=''){
    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
			material.map.needsUpdate = true;
    };
    img.src = originalLayer;

  }
});

document.getElementById('fillMsk').addEventListener('click', (e) =>{
  //Fills with the current colors
  clearCanvas(paintMaskHT,tinycolor('#'+$('#maskoolor').data('color')).toRgbString(),768)
  material.map.needsUpdate =true;
});

//get the actual snapshot in an image and it push in the interface
document.getElementById('snapsMsk').addEventListener('click' , (event)=>{
  if (snapsManager.children.length > 9){
    snapsManager.firstElementChild.remove();
  }
  let crapimg = paintMaskHT.toDataURL('image/png');
  snapsManager.innerHTML +="<img src='"+crapimg+"' >";
});


/* Back One snapshot */
document.getElementById('stepbackMsk').addEventListener('click', (event) =>{
  if (snapsManager.children.length >= 1){
    snapsManager.lastElementChild.remove();
    //snapsManager.lastElementChild.dispatchEvent(new Event('click'));
    let sourceimage;
    if (snapsManager.lastElementChild!=null){
      sourceimage = snapsManager.lastElementChild;
    }else{
      sourceimage = originalLayer;
    }
    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
    };
    img.src = sourceimage.src;
    //img=null;
    material.map.needsUpdate = true;
  }else{
		document.getElementById("wipeMsk").dispatchEvent(new Event('click'));
	}
});

document.querySelector('#Snapshots').addEventListener('click', (event) =>{
  if (event.target && event.target.tagName=="IMG"){
    let sourceimage = event.target;

    let img = new Image;
    img.onload = function(){
      paintMaskCTX.drawImage(img,0,0,768,768); // Or at whatever offset you like
    };
    img.src = sourceimage.src;
    //img=null;
    material.map.needsUpdate = true;
  }
});

function str2ab(str) {
 var buf = new ArrayBuffer(str.length); // 2 bytes for each char
 var bufView = new Uint8Array(buf);
 for (var i=0, strLen=str.length; i < strLen; i++) {
	 bufView[i] = str.charCodeAt(i);
 }
 return buf;
}

function loadNormOntheFly(path){
	let Normed = document.querySelector('#withbones i.icon-normals');
	path = path.replaceAll(/\//g,'\\')
  	var bufferimage = thePIT.ApriStream(path,'binary');
	var ab = str2ab(bufferimage);
  if (path.endsWith(".png")){
  	if (ab.byteLength>0){
  			var filePointer = 0;
  			const headerData = new Uint8Array(ab,0,8);
  			filePointer +=8;
  			//Check on PNG file signature http://www.libpng.org/pub/png/spec/1.2/PNG-Rationale.html#R.PNG-file-signature
  			if (
  				(headerData[0]==0x89)
  				&& (headerData[1]==0x50)
  				&& (headerData[2]==0x4e)
  				&& (headerData[3]==0x47)
  				&& (headerData[4]==0x0d)
  				&& (headerData[5]==0x0a)
  				&& (headerData[6]==0x1a)
  				&& (headerData[7]==0x0a)
  			){
  				//Getting the image dimesions to work with the canvas import
  				//chuckiteration
  				var chunkslenght, chunkstype
  				var pngWidth = pngHeight = 0;
  				var imgByteLenght = ab.byteLength

  				while ((pngWidth==0) && (pngWidth==0) && (filePointer<imgByteLenght)) {
  					chunkslenght = parseInt(new DataView(ab,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
  					chunkstype = new Uint8Array(ab,filePointer+4,4);
  					filePointer+=8;
  					//console.log(chunkslenght+" : "+chunkstype);
  					if ( (chunkstype[0]==0x49)
  						&&(chunkstype[1]==0x48)
  						&&(chunkstype[2]==0x44)
  						&&(chunkstype[3]==0x52) ){
  						//go for the read of the length
  						pngWidth=parseInt(new DataView(ab,filePointer,4).getUint32());
  						pngHeight=parseInt(new DataView(ab,filePointer+4,4).getUint32());
  					}
  					filePointer+=chunkslenght+4; //last 4 byte are for the checksum
  				}

  				if (pngWidth>0){
  					context = nMeKanv.getContext('2d');
  					/* Size is setted up */
					nMeKanv.width = normalMapInfo.width = pngWidth;
					nMeKanv.height = normalMapInfo.height = pngHeight;

  					var encodedData = btoa(bufferimage);
  					var dataURI = "data:image/png;base64," + encodedData;
  					var nMap = new Image();
  					nMap.onload = function(){
  						context.drawImage(nMap, 0, 0, normalMapInfo.width,normalMapInfo.height);
  						var imageData = context.getImageData(0,0,normalMapInfo.width,normalMapInfo.height);
              			if (window.Worker) { imgWorker.postMessage(imageData) }
						Normed.style.color = 'var(--normal)';
  					}
  					nMap.src = dataURI;
  				}else{
  					//console.log('no sizes found');
  					notify3D('no sizes found');
  					safeNormal();
  					
            		Normed.style.color = '';
  				}

  			}else{
          		Normed.style.color = 'rgb(255,0,0)';
  				notify3D('another format');
  			}
  	}else{
      Normed.style.color = 'rgb(255,128,0)';
  	}
  }else if(path.endsWith(".dds")){
    var data = str2ab(bufferimage);
    let offsetHeight = 3;
    let offsetwidth = 4;
    const headerData = new Uint32Array( data, 0, 5 ); //get the two dimensions data bytes
    let height = headerData[3];
    let width = headerData[4];
    let size = height * width * 4;
    const dx10Data = new Uint32Array( data, 128, 4 ); //get the type of DDS
    var normalData
   //wolvenkit 8.4.3+ and cli 1.5.0+ format
    if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
      normalData = new Uint32Array( data, 148, size );
    }else{
      //or legacy RGBA Unorm
      normalData = new Uint8Array( data, 148, size );
    }
    DDSNormal(normalData,width,height);
    Normed.style.color = 'var(--normal)';
    material.normalMap.flipY = flipdipNorm
    material.normalMap.needsUpdate = true;
  }
  material.map.flipY = flippingdipping
  material.map.needsUpdate = true;
}

function dataToTeX(binaryData, channels=4, format = THREE.RGBAFormat){
	var bufferData = str2ab(binaryData);
	const headerData = new Uint8Array( bufferData, 0, 8 ); //get the two dimensions data bytes

	if (
		(headerData[0]==0x44) &&
		(headerData[1]==0x44) &&
		(headerData[2]==0x53) ){
		try {
		//DDS Case
			const spaceData = new Uint32Array( bufferData, 0, 5 ); //get the two dimensions data bytes
			let height = spaceData[3];
			let width = spaceData[4];
			console.log(`texture ${width}x${height}px`);
			let size = height * width * channels;

			const dx10Data = new Uint32Array( bufferData, 128, 4 ); //get the type of DDS

			var imageDatas
			if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
				console.log(`DDS ${format}`);
				console.log(dx10Data);
				if (format == THREE.RGBAFormat){
					imageDatas = new Uint32Array( bufferData, 148, size );
				}else{
					imageDatas = new Uint8Array( bufferData, 148, size );
				}
			}else{
				//or legacy RGBA Unorm
				imageDatas = new Uint8Array( bufferData, 148, size );
			}
			let resultTex = new THREE.DataTexture(imageDatas,width,height,format);
			resultTex.wrapS=THREE.RepeatWrapping;
			resultTex.wrapT=THREE.RepeatWrapping;
			return resultTex;
		}catch(error){
			notify3D(error);
			return BLACK;
		}
	}else if (
		(headerData[0]==0x89)
		&& (headerData[1]==0x50)
		&& (headerData[2]==0x4e)
		&& (headerData[3]==0x47)
		&& (headerData[4]==0x0d)
		&& (headerData[5]==0x0a)
		&& (headerData[6]==0x1a)
		&& (headerData[7]==0x0a) ){

		try {
			//PNG Case
			var chunkslenght, chunkstype
			var pngWidth = pngHeight = 0;
			var imgByteLenght = bufferData.byteLength
			var filePointer = 8; /*after the header */
			//Search for the chunks with the Size of the texture
			while ((pngWidth==0) && (pngWidth==0) && (filePointer<imgByteLenght)) {
				chunkslenght = parseInt(new DataView(bufferData,filePointer,4).getInt32(),16); //from hexa I'll take the size of the chunks
				chunkstype = new Uint8Array(bufferData,filePointer+4,4);
				filePointer+=8;
				if ( (chunkstype[0]==0x49)
					&&(chunkstype[1]==0x48)
					&&(chunkstype[2]==0x44)
					&&(chunkstype[3]==0x52) ){
					//go for the read of the length
					pngWidth=parseInt(new DataView(bufferData,filePointer,4).getUint32());
					pngHeight=parseInt(new DataView(bufferData,filePointer+4,4).getUint32());
				}
				filePointer+=chunkslenght+4; //last 4 byte are for the checksum
			}
			// Connect the image to the Texture
			var texture = new THREE.Texture();
			if (pngWidth>0){
				// Connect the image to the Texture
				var texture = new THREE.Texture();
				var encodedData = btoa(bufferData);
				var dataURI = "data:image/png;base64," + encodedData;
				var pngMap = new Image();
				pngMap.onload = function () {
					texture.image = image;
					texture.wrapS=THREE.RepeatWrapping;
					texture.wrapT=THREE.RepeatWrapping;
					texture.needsUpdate = true;
					return texture;
				};
				pngMap.src = dataURI;
			}else{
				return BLACK;
			}
		}catch(error){
			notify3D(error);
			return BLACK;
		}
	}else{
		return BLACK;
	}
}

function loadMapOntheFly(path){
  //const encoder = new TextEncoder()
  path = path.replaceAll(/\//g,'\\');
  var bufferimage
  bufferimage = thePIT.ApriStream(path,'binary');

  if ((typeof(bufferimage)!="object") && (bufferimage!="") ){

    if (path.endsWith(".png")){
      var base64 = window.btoa(bufferimage);
      let img = new Image();
      img.src = "data:image/png;base64," + base64;
      img.onload = function () {
          paintMaskCTX.drawImage(img, 0, 0, 768, 768);
          //Load the layer and update the materials
          material.color.set(0x500000);
          material.map.flipY = flippingdipping
          material.map.needsUpdate = true;
      };
      originalLayer = img.src;

    }else if(path.endsWith(".dds")){
    	var data = str2ab(bufferimage);
    	let offsetHeight = 3;
		let offsetwidth = 4;
		const headerData = new Uint32Array( data, 0, 5 ); //get the two dimensions data bytes
		let height = headerData[3];
		let width = headerData[4];
		let size = height * width;
 		const dx10Data = new Uint32Array( data, 128, 4 ); //get the type of DDS
 		var luminancedata
 		 //wolvenkit 8.4.3+ and cli 1.5.0+ format
 		if ((dx10Data[0]==61) && (dx10Data[1]==3)&& (dx10Data[2]==0)&& (dx10Data[3]==1)){
 			 luminancedata = new Uint8Array( data, 148, size );
 		}else{
 			 //or legacy
 			 luminancedata = new Uint8Array( data, 128, size );
 		}

   	 	material.color.set(0x500000);

   	 //material.map = canvasPaint //material.map = dataTex;
   	  //giveToTheAim(luminancedata,width,height);
      paintDatas(luminancedata,width,height);
      originalLayer = paintMaskHT.toDataURL('image/png');
    }

     material.map.flipY = flippingdipping
     material.map.needsUpdate = true;
  }else{
    let notific = document.querySelector("#notyCounter span");
    let mipreference = document.getElementById("prefxunbundle");

    err_counter = err_counter+1;
    notific.textContent = err_counter;
    //material.color.set(0x000055);
    clearCanvas(paintMaskHT,'rgb(256,256,256)',768);//material.map = safeMap;
	material.map.needsUpdate = true;
    notify3D('An error happened during the load of the file: '+mipreference.value+path);
	for (i=$("#layeringsystem li.active").index();i<=19;i++){
		$("#layeringsystem li").eq(i).attr('disabled','disabled')
	}
  }
}

function cleanScene(){
	TextureStack.forEach( (element) => element.dispose() );
	if (scene.children.length==6){
		scene.traverse(oggetti=>{
			if (!oggetti.isMesh) return
			oggetti.material.dispose(); //Remove materials
			oggetti.geometry.dispose(); //Remove geometry
		})
		scene.children.pop(scene.children[5]);
	}
}

function targetVisible(byname='submesh_00_LOD_1',toggle=false){
	if (scene.children.length==6){
		scene.traverse(oggetti=>{
			if (oggetti.name==byname.trim()){
				oggetti.visible=toggle;
			}
		})
	}
}

function mBuildAppearances(model){
	var menuAppearances = document.querySelector("#appearanceSwitcher ul");
	menuAppearances.innerHTML="";
	//document.getElementById("appeInfo").innerHTML="";

	if ((model.length>0) && (typeof(model)=='object')){
		if (model.length<=0){ return }
		if (model[0]?.appearanceCode===undefined){
			console.log(model[0]);
			return;
		}

		if (model[0]?.appearanceCode.length <= 0) {	return }		
		model[0].appearanceCode.forEach((app,index)=>{
			menuAppearances.innerHTML += `<li><a class="dropdown-item ${index==0 ? 'active':''}"  href="#" data-name="${app}"> ${app}</a></li>`;
		});
		
		let names = model.map(x=> x.name.replace('_LOD_1',''));

	}else{
		menuAppearances.innerHTML = `<li><a class="dropdown-item" href="#" disabled>No Appearances</a></li>`;
	}
}

function LoadMaterials(path){
	path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
	tempMaterial
	if (/^[\w|\W]:\\.+/.test(path)){
		tempMaterial = thePIT.ApriStream(path.replace(/\.glb$/,".Material.json"),'binary',true)
	}else{
		tempMaterial = thePIT.ApriStream(path.replace(/\.glb$/,".Material.json"),'binary')
	}

	try {
		materialJSON.import(tempMaterial);
		//$("#appeInfo").html(materialJSON.codeAppearances());
		console.log(materialJSON);
	} catch (error) {
		notifyMe(error,false);
	}
	//$("#materialJson").val(tempMaterial).trigger('update');
}

function LoadModelOntheFly(path){
	path = path.replaceAll(/\//g,'\\'); //setup the right path to be requested
  	var mobjInfo = [];
	let Boned = false;
	let MasksOn = document.querySelector('#withbones svg:nth-child(1) path');

  	var modelStream, Decal, actualMaterial, actualTemplate, matTextureOpacity
	var MlmaskTestString


	if (/^[\w|\W]:\\.+/.test(path)){
		tempMaterial = thePIT.ApriStream(path.replace(/\.glb$/,".Material.json"),'binary',true)
		modelStream = thePIT.ApriStream(path,'binary',true);
	}else{
		tempMaterial = thePIT.ApriStream(path.replace(/\.glb$/,".Material.json"),'binary')
		modelStream = thePIT.ApriStream(path,'binary');
	}

	$("#materialJson").val(tempMaterial).trigger('update');

  	data = str2ab(modelStream);

	if (data.byteLength>0){
	  	loader.parse( data ,'', ( glbscene ) => {
			$("#sbmeshEN > ul").html("");
		
		$(window).trigger('cleanTweakPanes');
		
		UVSbmeshENA.innerHTML=""; //remove all the buttons in the uv calculator
		clearCanvas(canvUVWrapped,'',768)
	  	//Check on parser extension KHR_material_variants

		if (glbscene.parser.extensions?.KHR_binary_glTF!=undefined){
			var materialExt
			try {
				materialExt = JSON.parse(glbscene.parser.extensions.KHR_binary_glTF.content);
				//console.log(materialExt);
			} catch (error) {
				console.error(error);
			}
		}
		materialSet.clear();
		multilayerStack.clear();
		materialStack.forEach((el)=>{
			el.dispose();
		}); // Change into Clean Every material and textures

		//console.clear();
	    glbscene.scene.traverse( function ( child ) {
			Decal = false;
			actualMaterial = '';

			if ((child.type=="SkinnedMesh") && (!Boned)){Boned=true;}

			if ( child.isMesh ) {
				
          		mobjInfo.push({
					"name":child.name,
					"appearanceCode":child.userData.materialNames,
					"vertexes":child.geometry.attributes.uv.count
					});
				child.frustumCulled = false;
				
				if ((child.userData?.materialNames!=null) && (child.userData?.materialNames!=undefined)){
					
					$("#sbmeshEN > ul").append(`<li class="form-check" data-material="${child.userData.materialNames[0]}"><label for="${child.name}" class="form-check-label">${child.name}</label><input name="${child.name}" type="checkbox" class="form-check-input" checked ></li>`);

					materialSet.add(child.userData.materialNames[0]);

					actualMaterial = materialJSON.Materials.filter(el=>el.Name==child.userData.materialNames[0])[0];
					actualTemplate = actualMaterial?.MaterialTemplate==='undefined'?'':actualMaterial.MaterialTemplate;
					console.table(actualMaterial);

					if ($("#masksTemplate").val()==''){
						MlmaskTestString = '/'+
						(actualMaterial.Data?.MultilayerMask!==undefined ? actualMaterial.Data.MultilayerMask:'').replaceAll('\\','/').replace(new RegExp(/\.mlmask$/),`_X.${textureformat}`)
						if (MlmaskTestString!='/'){
							$("#masksTemplate").val(MlmaskTestString)
						}
						
					}
					if (materialTypeCheck.metal_base.includes(actualTemplate)){
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-microchip text-danger"></i>`);
						if (materialStack[actualMaterial.Name]===undefined){
							materialStack[actualMaterial.Name] = new THREE.MeshStandardMaterial({color: 0x808080});

							if (actualMaterial.Data.hasOwnProperty('BaseColor')){
								let textureMD5Code = CryptoJS.MD5(actualMaterial.Data.BaseColor)
								if (TextureStack[textureMD5Code]===undefined){
									//thePIT.ApriStream((actualMaterial.Data.DiffuseTexture).replace('.xbm',`.${textureformat}`),'binary');
									
									let temporaryTexture = thePIT.ApriStream((actualMaterial.Data.BaseColor).replace('.xbm',`.${textureformat}`),'binary');
									//dataToTeX(temporaryTexture);
									TextureStack[textureMD5Code]=dataToTeX(temporaryTexture);

									materialStack[actualMaterial.Name].map = TextureStack[textureMD5Code];
								}else{
									materialStack[actualMaterial.Name].map=TextureStack[textureMD5Code];
								}
							}

							if (actualMaterial.Data.hasOwnProperty('BaseColorScale')){
								let mb_Color = actualMaterial.Data.BaseColorScale;
								materialStack[actualMaterial.Name].color = new THREE.Color(`rgb(${parseInt(mb_Color.X*255)},${parseInt(mb_Color.Y*255)},${parseInt(mb_Color.Z*255)})`);
							}else{
								materialStack[actualMaterial.Name] = new THREE.MeshStandardMaterial({color: 0x808080});
							}

							if (actualMaterial.Data.hasOwnProperty('AlphaThreshold')){
								materialStack[actualMaterial.Name].opacity = 1 - actualMaterial.Data.AlphaThreshold;
								materialStack[actualMaterial.Name].transparent = true;
							}

							if (actualMaterial.Data.hasOwnProperty('Normal')){
								console.log("Normal:",actualMaterial.Data.Normal);

								if (actualMaterial.Data.Normal=='engine\\textures\\editor\\normal.xbm'){
									materialStack[actualMaterial.Name].normalMap = FlatNORM;
								}else{
									let normMD5Code = CryptoJS.MD5(actualMaterial.Data.Normal)
									if (TextureStack[normMD5Code]===undefined){
										let temporaryTexture = thePIT.ApriStream((actualMaterial.Data.Normal).replace('.xbm',`.${textureformat}`),'binary');
										//dataToTeX(temporaryTexture);
										TextureStack[normMD5Code]=dataToTeX(temporaryTexture);
	
										materialStack[actualMaterial.Name].normalMap = TextureStack[normMD5Code];
									}else{
										materialStack[actualMaterial.Name].normalMap = TextureStack[normMD5Code];
									}
								}
							}
							if (actualMaterial.Data.hasOwnProperty('NormalStrenght')){
								if (actualMaterial.Data.NormalStrenght!=1){
									materialStack[actualMaterial.Name].normalScale = actualMaterial.Data.NormalStrenght;
								}
							}
							child.material = materialStack[actualMaterial.Name];
							child.material.needsUpdate = true;
						}else{
							child.material = materialStack[actualMaterial.Name]
						}

						console.log(actualMaterial.Data);

					}else if (materialTypeCheck.decals.includes(actualTemplate)){

						if (actualMaterial.Data.hasOwnProperty('DiffuseColor')){
							let defColor = actualMaterial.Data.DiffuseColor;
							child.material = new THREE.MeshBasicMaterial({color:new THREE.Color(`rgb(${defColor.Red},${defColor.Green},${defColor.Blue})`), opacity: (defColor.Alpha/255), transparent:true});
						}else{
							child.material = new THREE.MeshBasicMaterial({color:new THREE.Color("rgb("+Number.parseInt(20*Math.random())+", "+Number.parseInt(50*Math.random()+100)+", 255)"), opacity:0.3,transparent:true});
						}
						child.material.side = THREE.DoubleSide;

						if (actualMaterial.Data.hasOwnProperty('DiffuseAlpha')){
							matTextureOpacity = actualMaterial.Data.DiffuseAlpha * 255;
						}else{
							matTextureOpacity = 255;
						}

						if (actualMaterial.Data.hasOwnProperty('DiffuseTexture')){
							//function to load the texture with the right alpha
							let textureMD5Code = CryptoJS.MD5(actualMaterial.Data.DiffuseTexture)
							if (TextureStack[textureMD5Code]===undefined){
								//thePIT.ApriStream((actualMaterial.Data.DiffuseTexture).replace('.xbm',`.${textureformat}`),'binary');
								
								let temporaryTexture = thePIT.ApriStream((actualMaterial.Data.DiffuseTexture).replace('.xbm',`.${textureformat}`),'binary');
								//dataToTeX(temporaryTexture);
								TextureStack[textureMD5Code]=dataToTeX(temporaryTexture);
								child.material.map = TextureStack[textureMD5Code];
							}else{
								child.material.map=TextureStack[textureMD5Code];
							}
						}

						if (actualMaterial.Data.hasOwnProperty('RoughnessTexture')){
							if (roughnessValue = checkMaps(actualMaterial.Data.RoughnessTexture)>=0){
								child.material.roughness = roughnessValue;
							}else{
								let RnessMD5Code = CryptoJS.MD5(actualMaterial.Data.RoughnessTexture)
								if (TextureStack[RnessMD5Code]===undefined){
									let RnessTempTexture = thePIT.ApriStream((actualMaterial.Data.RoughnessTexture).replace('.xbm',`.${textureformat}`),'binary');
									TextureStack[RnessMD5Code]=dataToTeX(RnessTempTexture,1,THREE.RedFormat);
									child.material.roughnessMap = TextureStack[RnessMD5Code];
								}else{
									child.material.roughnessMap = TextureStack[RnessMD5Code];
								}
							}
						}

						if (actualMaterial.Data.hasOwnProperty('MetalnessTexture')){
							if (metalnessValue = checkMaps(actualMaterial.Data.MetalnessTexture)>=0){
								child.material.metalness = metalnessValue;
							}else{
								let MnessMD5Code = CryptoJS.MD5(actualMaterial.Data.MetalnessTexture)
								if (TextureStack[MnessMD5Code]===undefined){
									let MnessTempTexture = thePIT.ApriStream((actualMaterial.Data.MetalnessTexture).replace('.xbm',`.${textureformat}`),'binary');
									TextureStack[MnessMD5Code]=dataToTeX(MnessTempTexture);
									child.material.metalnessMap = TextureStack[MnessMD5Code];
								}else{
									child.material.metalnessMap = TextureStack[MnessMD5Code];
								}
							}
						}

						if (actualMaterial.Data.hasOwnProperty('MaskTexture')){

							if (maskValue = checkMaps(actualMaterial.Data.MaskTexture)>=0){
								child.material.alphaMap = maskValue;
							}else{
								let MaskMD5Code = CryptoJS.MD5(actualMaterial.Data.MaskTexture)
								if (TextureStack[MaskMD5Code]===undefined){
									let MaskTempTexture = thePIT.ApriStream((actualMaterial.Data.MaskTexture).replace('.xbm',`.${textureformat}`),'binary');
									TextureStack[MaskMD5Code]=dataToTeX(MaskTempTexture);
									child.material.alphaMap = TextureStack[MaskMD5Code];
								}else{
									child.material.alphaMap = TextureStack[MaskMD5Code];
								}
							}
							child.material.opacity = .9;
						}

						/*
						if (actualMaterial.Data.hasOwnProperty('NormalTexture')){
							
							if (actualMaterial.Data.NormalTexture=='engine\\textures\\editor\\normal.xbm'){
								child.material.normalMap = FlatNORM;
							}else{
								let normMD5Code = CryptoJS.MD5(actualMaterial.Data.NormalTexture)

								if (TextureStack[normMD5Code]===undefined){
									console.error("Normal:",actualMaterial.Data.NormalTexture);
									let temporaryTexture = thePIT.ApriStream((actualMaterial.Data.NormalTexture).replace('.xbm',`.${textureformat}`),'binary');
									//dataToTeX(temporaryTexture);
									TextureStack[normMD5Code]=dataToTeX(temporaryTexture);
									
									//child.material.normalMap = TextureStack[normMD5Code];
								}else{
									//child.material.normalMap = TextureStack[normMD5Code];
								}
							}
						}*/
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fas fa-tag text-warning"></i>`);
						child.material.needsUpdate=true;
						
					}else if (materialTypeCheck.fx.includes(actualTemplate)){
						child.material = new THREE.MeshBasicMaterial({color:new THREE.Color("rgb("+Number.parseInt(50*Math.random())+", "+Number.parseInt(50*Math.random()+100)+", 0)"), opacity:0.7,transparent:true,wireframe:true});
						
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-lightbulb text-warning"></i>`);

					}else if (materialTypeCheck.glass.includes(actualTemplate)){
						child.material = glass;
						Decal = true;

						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-wine-glass-empty text-secondary"></i>`);

					}else if (materialTypeCheck.hair.includes(actualTemplate)){
						console.log("Hairs!")
						if ((/.+hair_profiles.+/).test(actualMaterial?.BaseMaterial)){
							child.material = new THREE.MeshBasicMaterial({opacity:.9,transparent:true,side:THREE.DoubleSide});

							if (actualMaterial.Data.hasOwnProperty('Strand_Gradient')){
								if (StrandGradient = checkMaps(actualMaterial.Data.Strand_Gradient)>=0){
									child.material.map = StrandGradient;
								}else{
									let SGradMD5Code = CryptoJS.MD5(actualMaterial.Data.Strand_Gradient)
									if (TextureStack[SGradMD5Code]===undefined){
										let SGradTempTexture = thePIT.ApriStream((actualMaterial.Data.Strand_Gradient).replace('.xbm',`.${textureformat}`),'binary');
										TextureStack[SGradMD5Code]=dataToTeX(SGradTempTexture);
										child.material.map = TextureStack[SGradMD5Code];
									}else{
										child.material.map = TextureStack[SGradMD5Code];
									}
								}
							}

							if (actualMaterial.Data.hasOwnProperty('Strand_Alpha')){
								if (StrandAlpha = checkMaps(actualMaterial.Data.Strand_Alpha)>=0){
									child.material.alphaMap = StrandAlpha;
								}else{
									let SAlphaMD5Code = CryptoJS.MD5(actualMaterial.Data.Strand_Alpha)
									if (TextureStack[SAlphaMD5Code]===undefined){
										let SAlphaTempTexture = thePIT.ApriStream((actualMaterial.Data.Strand_Alpha).replace('.xbm',`.${textureformat}`),'binary');
										TextureStack[SAlphaMD5Code]=dataToTeX(SAlphaTempTexture);
										child.material.alphaMap = TextureStack[SAlphaMD5Code];

									}else{
										child.material.alphaMap = TextureStack[SAlphaMD5Code];
									}
								}
							}
							child.material.needsUpdate = true;
						}else{
							if ((/.+_cap$/).test(actualMaterial.Name)){
								child.material = new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
								if (actualMaterial.Data.hasOwnProperty('DiffuseTexture')){

									let textureMD5Code = CryptoJS.MD5(actualMaterial.Data.DiffuseTexture)
									if (TextureStack[textureMD5Code]===undefined){
										let temporaryTexture = thePIT.ApriStream((actualMaterial.Data.DiffuseTexture).replace('.xbm',`.${textureformat}`),'binary');
										TextureStack[textureMD5Code]=dataToTeX(temporaryTexture);
										child.material.map = TextureStack[textureMD5Code];
									}else{
										child.material.map=TextureStack[textureMD5Code];
									}
								}
							}else if((/.+_short.+/).test(child.userData.materialNames.toString())){
								child.material = hair_short;
							}else if((/.+_card(s).+/).test(child.userData.materialNames.toString())){
								child.material = hair_card;
								hair_card.map.needsUpdate = true;
							}else if((/lambert/).test(child.userData.materialNames.toString())){
								child.material = material;
							}
						}

						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-scissors text-secondary"></i>`);


					}else if (materialTypeCheck.skin.includes(actualTemplate)){
						child.material = skin;
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-hand-dots"></i>`);
					}else if (materialTypeCheck.multilayer.includes(actualTemplate)){
						multilayerStack.add(actualMaterial.Name);
						child.material = material;
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-layer-group text-primary"></i>`);
					}else{
						child.material = noMaterial;
						$("#sbmeshEN > ul li:last-child label").append(` <i class="fa-solid fa-question"></i>`);
					}
		}else{
			child.material = material;
		}

		child.visible = true;

		UVSbmeshENA.innerHTML+=`<div class="form-check form-switch mx-2">
			<input class="form-check-input" type="checkbox" role="switch" id="uvchk_${child.name}" checked>
			<label class="form-check-label" for="uvchk_${child.name}" autocomplete="off">${child.name}</label>
	  	</div>`;
		}
	    });

		$("#Mlswitcher ul").remove();
		if (multilayerStack.size>0){
			$("#Mlswitcher").append(`<ul class="list-group mx-1"></ul>`);

			multilayerStack.forEach(function(name,key,set){
				$("#Mlswitcher ul").append(materialJSON.codeMaterial(materialJSON.find(name),` <li class="list-group-item p-1">
				<input class="form-check-input me-1" type="radio" name="mlSelectRadio" id="sel$_MATERIALID">
				<label class="form-check-label" for="sel$_MATERIALID">
					$_MATERIALSHORTNAME
				</label>
				</li>`));
			});
			$("#Mlswitcher ul li:nth-child(1) input").prop(`checked`,true);
		}

		mBuildAppearances(mobjInfo);
	    
		if (Boned){
			MasksOn.setAttribute("fill","red");
		}else{
			MasksOn.setAttribute("fill","currentColor");
		}

	    if (PARAMS.oneside){
			material.side=THREE.FrontSide;
		}else{
			material.side=THREE.DoubleSide;
		}

	    scene.add(glbscene.scene);
	    //Autocentering
		var helper = new THREE.BoxHelper(glbscene.scene);
	    helper.geometry.computeBoundingBox();
	    var centerPoint = new THREE.Vector3();
	    centerPoint.x = (helper.geometry.boundingBox.max.x + helper.geometry.boundingBox.min.x) / 2;
	    centerPoint.y = (helper.geometry.boundingBox.max.y + helper.geometry.boundingBox.min.y) / 2;
	    centerPoint.z = (helper.geometry.boundingBox.max.z + helper.geometry.boundingBox.min.z) / 2;
	    //camera.target = centerPoint;
	    controls.target = centerPoint;

	  }, (error) => {
	    notify3D(error);
	  });
	}else{
		notify3D(`-- The 3d model wasn't there when i try to load it --`); //https://github.com/Neurolinked/MlsetupBuilder/issues/8
    	//TODO activate an export of the file, if successeful go and do shit.
	}
}

document.getElementById("takeashot").addEventListener('click', (e) =>{
	getImageData = true;
	animate();
});

document.getElementById("maskLayer").addEventListener('fire', e => {
	 let modelTarget = document.getElementById("modelTarget").value;
	 let masksTemplate = document.getElementById("masksTemplate").value;

	 if ((masksTemplate!="") && (modelTarget!="")){
		 let maskLayer = document.getElementById("maskLayer").value;
		 let masksPath = masksTemplate.replace(/X/g,maskLayer);
		 //load of the new textures onto the models
		 loadMapOntheFly(masksPath);
	 }

});

function customLoad(e){
//custom 3d assets file loading
//document.getElementById('cstMdlLoader').addEventListener('click',(e)=>{
	cleanScene()
	let maxLayers = 0;
	layersActive(maxLayers);
  	safeNormal()
	clearCanvas(paintMaskHT,'rgb(256,256,256)',768); //material.map = safeMap;
	//var texture = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
  	material.normalMap.needsUpdate = true // = texture;
  	//material.map.needsUpdate = true;
	//CustomLoadButton.setAttribute('disabled','disabled');
	thePIT.ThreeDAsset();
  	let Normed = document.querySelector('#withbones i.icon-normals');
	//Normed.setAttribute("fill",'currentColor');
  	Normed.style.color='';
};

document.getElementById('lastCustomMDL').addEventListener('change',(e)=>{
	let file = document.getElementById('lastCustomMDL');
	//let file = MLSB.TreeD.lastModel;
	//re-enable the button
	//CustomLoadButton.disabled=false;

	if (file.value.split('.').reverse()[0]=='glb'){
		//t3Ddata = str2ab(modello);
    	safeNormal();
		cleanScene();
    	LoadModelOntheFly(file.value)
		layersActive(0);
		material.map.needsUpdate =true;
		control_reset = true;
		//TODO file.value é il nome del file da aggiungere
		//Se non ce n'è un'altro con lo stesso path
	}else{
		notify3D(`I expect a .GLB model file`);
	}
});

/*MDLloadingButton button click */
MDLloadingButton.addEventListener('click',(e)=>{
	MDLloadingButton.setAttribute('disabled','disabled');

	var nthLayer = document.querySelector("#layeringsystem").children;
	var activeLayer = MLSB.Editor.layerSelected;

 	let theMaskLayer = document.getElementById("masksTemplate").value; //template path for the textures
 	let theNormal = document.getElementById("normTemplate").value; //normal file to apply to the whole model
 	let layer = document.getElementById("maskLayer").value; //actual layer selected in the editors
 	let maxLayer_thisModel = document.getElementById("maxLayers").value; //actual numer of layer that the models support
 	layer = Number(layer);
 	maxLayer_thisModel = Number(maxLayer_thisModel);

 	if (((layer<0) | (layer>20)) | (activeLayer===null) | (layer>maxLayer_thisModel)){ layer = 0 }

 	theMaskLayer = String(theMaskLayer).replace(/X/g,layer);

	if (theMaskLayer.match(/^[/|\w|\.]+.[dds|png]$/)){
		//load textures
		loadMapOntheFly(theMaskLayer);
		//material.needUpdates =true; //setup the mask I'll set the material to update
	}else{
		clearCanvas(paintMaskHT,'rgb(256,256,256)',768);//material.map = safeMap;
		material.map.needsUpdate = true;
		notify3D('the texture '+theMaskLayer+' does not exists');
	}

	//let Normed = document.querySelector('#withbones svg:nth-child(2) path');
	let Normed = document.querySelector('#withbones i.icon-normals');

	if (theNormal.match(/^[/|\w|\.]+.[dds|png]/)){
		loadNormOntheFly(theNormal);
	}else{
		safeNormal();
		Normed.style.color = '';
		//var texture = new THREE.CanvasTexture(nMeKanv,THREE.UVMapping,THREE.RepeatWrapping)
		//material.normalMap = texture;
		material.normalMap.needsUpdate = true
		notify3D('No Normal, reset to safeNorm');
	}


 //material.needUpdates = true;
 //search for the right extension
 if (MLSB.TreeD.lastModel.match(/.+\.glb$/)){
	cleanScene();
	if (modelType=='hair'){
		if (!(/show/.test(document.getElementById('HairTool')))){
			document.querySelector("#versionDisplay a:nth-child(4)").click();
		}
	}
	LoadModelOntheFly(MLSB.TreeD.lastModel);
	//Disattivazione livelli non utilizzabili
   	//defUVUnwrap()
   	clearCanvas(canvUVWrapped,',768');
	//material.needUpdates =true;
	document.getElementById("modelTarget").setAttribute('loaded',true);
	MDLloadingButton.disabled=false;
	control_reset=true;
 }else{
	 let notific =document.querySelector("#notyCounter span");
	 err_counter=err_counter+1;
	 notific.textContent = err_counter;
	 console.error(`The model ${MLSB.TreeD.lastModel} does not exists, check that the model .glb file is on the path requested`);
	 MDLloadingButton.disabled=false;
	 notify3D(`We are searching for .glb files and then this ${MLSB.TreeD.lastModel} one showed up, we can\'t open it now`);
 }

});

init();

function init() {
	scene = new THREE.Scene();
	/* 
	const axesHelper = new THREE.AxesHelper( 1 );    scene.add( axesHelper ); to understand position of the objects */
	var thacanvas = document.getElementById('thacanvas');
	thacanvas.setAttribute('data-engine',THREE.REVISION);

  	renderer = new THREE.WebGLRenderer({canvas:thacanvas, alpha:true, antialias:true,logarithmicDepthBuffer: true });
	if (window.innerHeight-80<512){
		renderer.setSize(renderwidth,renderwidth);
	}else{
		renderer.setSize(renderwidth,window.innerHeight-80);
	}
	renderer.setPixelRatio( window.devicePixelRatio );

	renderer.gammaFactor = 2.2;
  	renderer.outputEncoding = THREE.sRGBEncoding;
  	renderer.toneMapping = THREE.ACESFilmicToneMapping;
  	renderer.toneMappingExposure = 1.25;
	//----calculating the shadows
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	//Canvas events for painting

	//---calculating the shadows
  	camera = new THREE.PerspectiveCamera(15,renderwidth/(window.innerHeight-80),0.01,10000);
  	camera.position.set(0.0,-0.4,-8);
	camera.updateProjectionMatrix();
  /*

  const helper = new THREE.CameraHelper( camera );
  scene.add( helper );
  */
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.autoRotate = PARAMS.rotation;
  controls.autoRotateSpeed = PARAMS.speed;

  controls.enableDamping = true;
  controls.enablePan = true;

  controls.target.set(0.01,0.7,0.07);

  ambientlight = new THREE.AmbientLight( PARAMS.A_light_color,PARAMS.A_light_pow ); // soft white light
  //ambientlight.intensity=1;
  scene.add( ambientlight );

  pointLights[1] = new THREE.PointLight(PARAMS.p_light1_col,PARAMS.p_light1_pow); //6C5624
  pointLights[2] = new THREE.PointLight(PARAMS.p_light2_col,PARAMS.p_light2_pow);
  pointLights[3] = new THREE.PointLight(PARAMS.p_light3_col,PARAMS.p_light3_pow);
  pointLights[4] = new THREE.PointLight(PARAMS.p_light4_col,PARAMS.p_light4_pow);

  pointLights[1].position.set(PARAMS.l1_pos.x,PARAMS.l1_pos.y,PARAMS.l1_pos.z);
  pointLights[2].position.set(PARAMS.l2_pos.x,PARAMS.l2_pos.y,PARAMS.l2_pos.z);
  pointLights[3].position.set(PARAMS.l3_pos.x,PARAMS.l3_pos.y,PARAMS.l3_pos.z);
  pointLights[4].position.set(PARAMS.l4_pos.x,PARAMS.l4_pos.y,PARAMS.l4_pos.z);

  scene.add(pointLights[1]);
  scene.add(pointLights[2]);
  scene.add(pointLights[3]);
  scene.add(pointLights[4]);

  //load a text file and output the result to the console
  //material.map = safeMap;
	material.normalMap = normMe;

	//fog
	//TODO adding fog to the scene
	scene.fog = new THREE.Fog( PARAMS.fogcolor, PARAMS.fognear,PARAMS.fogfar);
/* 
  var datpotision = document.getElementById('dat-container');
  datpotision.appendChild(gui.domElement); */
  animate();
}


function animate() {
  if (resized) resize()

	if (!paintMask3D){
		controls.autoRotate = PARAMS.rotation;
		controls.autoRotateSpeed = PARAMS.speed;
	}else{
		controls.autoRotate = false;
	}

	//check mesh reload
	if (control_reset){
		control_reset = false;
		camera.position.set(0,1,-7);
	}else{
		controls.update();
	}

	if (control_side){
		control_side=false;
	}

	renderer.render(scene, camera);

	if(getImageData == true){
		let a = document.getElementById('takeashot');
		imgDataShot = renderer.domElement.toDataURL('image/png');
		getImageData = false;
		a.href = imgDataShot;
		a.download = `screen${ new Date().valueOf()}.png`;
	}

	requestAnimationFrame(animate);
}
$("body").on("click","#sbmeshEN li, #sbmeshEN li input,#sbmeshEN li label",function(ev){
	ev.stopPropagation();
	var nome
	console.log(`activation :${$(this)[0].nodeName}`);
	switch ($(this)[0].nodeName) {
		case "LI":
			nome = $(this).text();
			var elm = $($(this).find('input')[0]);
			elm.prop("checked",!elm.is(':checked'));
			var value = elm.is(":checked");
			targetVisible(nome,$($(this).find('input')[0]).is(":checked"));	
			break;
		case "INPUT":
			nome = $(this).parent().text();
			var value = $(this).is(":checked");
			targetVisible(nome,value);	
			break;
		case "LABEL":
			nome = $(this).parent().text();
			var elm = $($(this).next('input')[0]);
			elm.prop("checked",!elm.is(':checked'));
			var value = elm.is(":checked");
			targetVisible(nome,value);	
			break;
		default:
			break;
	}
	//targetVisible(nome,$(this).find("input").is(":checked"));
})

function resize() {
		 resized = false
		 // update the size
		 if (window.innerHeight-80<512){
			 renderer.setSize(renderwidth, 512);
		 }else{
			 renderer.setSize(renderwidth, window.innerHeight-80);
		 }
		 // update the camera
		 const canvas = renderer.domElement
		 camera.aspect = canvas.clientWidth/canvas.clientHeight
		 camera.updateProjectionMatrix()
 }

 document.querySelector('body').addEventListener('keydown', (event)=>{
	 if (event.shiftKey){
		paintMask3D=true;
		controls.enabled=false;
	}else{
		paintMask3D=false;
		controls.enabled=true;
	}
 });
 document.querySelector('body').addEventListener('keyup', (event)=>{
	 if (event.shiftKey){
		 paintMask3D=true;
		 controls.enabled=false;
	 }else{
 		paintMask3D=false;
		controls.enabled = true;
 	}
 });

 
