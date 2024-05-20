onmessage = function(event){
  //Hi, I'm Grunt the image weightlifter
  var command, datas
  [command, ...datas] = event.data;
  switch (command){
    case 'alphaApply':
      var workerResult = textAlphaFix(datas[0],datas[1],datas[2],datas[3]);
      break;
    case 'roughnessSwap':
      var workerResult = roughnessFix(datas[0],datas[1],datas[2],datas[3],datas[4]);
      break;
    case 'normalFix':
    default:
      var workerResult = nMapFix(datas[0],datas[1],datas[2],datas[3],datas[4]);
      break;
  }
}

function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

/* This function will write the blue channel of the image as full blue, to trasform
the red green normal maps to sull rgb */
function nMapFix(normaldatas,width,height,fileNAME,material){
  //Took the arraybuffer color change the clue channel
  var red,green,blueVal,blue,alpha;
  for (let i = 0, l = normaldatas.length; i < l; i += 4) {
    // Modify pixel data
    red = (normaldatas[i]/255)* 2 - 1;
    green = -1 * (((normaldatas[i + 1])/255)* 2 - 1);
    blueVal = clamp(Math.sqrt(1 - (Math.pow(red,2)+ Math.pow(green,2))) , 0 , 1) ; //recalculated floating point
    blue = parseInt(((blueVal + 1 ) / 2 ) * 255)
    //blue = 255 // old concept, not recalculated
    normaldatas[i + 2] = blue;
  }

  self.postMessage(['paint',normaldatas,width,height,fileNAME,material])
}

function roughnessFix(roughnessdatas,width,height,fileNAME,material){
  //Took the arraybuffer color change the clue channel
  var red,green,blue,alpha;
  for (let i = 0, l = roughnessdatas.length; i < l; i += 4) {
    // Modify pixel data
    roughnessdatas[i+1]=roughnessdatas[i];
  }

  self.postMessage(['rough',roughnessdatas,width,height,fileNAME,material])
}

function textAlphaFix(texturedatas,width,height,fileNAME,alphaValue=1){
  if ((0<= alphaValue <=255) && (alphaValue.isInteger())) {
    //greyscale int value from 0 to 255
  }else if  (0 <= alphaValue <= 1){
    //grayscale value from 0 to 1
    //for opacity
    alphaValue *=255; //get the right persentage
  }else{
    self.postMessage(['log',`Received an alpha value of ${alphaValue} going to 255` ]);
    alphaValue = 255
  }

  for (let i = 0, l=texturedatas.length; i < l; i += 4) {
    // Modify pixel data
    texturedatas.data[i + 3] = alphaValue;  // Alpha value
   }
   self.postMessage(['alphaFix',texturedatas,width,height,fileNAME]);
}
