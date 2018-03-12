//const MUSIC_URL = "https://ia801003.us.archive.org/31/items/DWK260/Boogie_Belgique_-_03_-_Red_Steam.ogg";
//const MUSIC_URL = "./assets/Last.mp3";
//const MUSIC_URL = "./assets/Chvrches_Gun.mp3";
const MUSIC_URL = "./assets/Gift.mp3";

var context = new AudioContext();
var source = context.createBufferSource();
var canvas;
var canvasContext;
var startTime;

addEventListener("DOMContentLoaded", initialize);
addEventListener("resize", resize);

function initialize() {
	canvas = document.querySelector("canvas");
	canvasContext = canvas.getContext("2d");
	resize();
	
	loadTrack(MUSIC_URL, function(buffer) {
		playSound(buffer);
	});
	//playSound(buffer);
}

function visualize(flux, threshold, prunnedSpectralFlux) {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  //console.log("FFT",fft.spectrum);

	var xScale = 128;
	var yScale = 400;
	//plotSamples(samples, 1, context.currentTime - startTime, 0, xScale, yScale, "red");
  drawOneSample(flux, flux.length-1, context.currentTime - startTime, xScale, yScale,"green");
  drawOneSample(prunnedSpectralFlux, 0, context.currentTime - startTime, xScale+50, yScale,"blue");
  drawOneSample(threshold, 0, context.currentTime - startTime, xScale+100, yScale,"purple");

  drawThresholdSample(threshold, flux, 1024, context.currentTime - startTime, xScale+150, yScale,"red");
  drawThresholdSample(threshold, prunnedSpectralFlux, 1024, context.currentTime - startTime, xScale+200, yScale,"yellow");

	//plotSamples(flux, 1024, context.currentTime - startTime, 0, xScale, yScale, "green");
	//plotSamples(threshold, 1024, context.currentTime - startTime, 0, xScale, yScale, "purple");
	//plotSamples(prunnedSpectralFlux, 1024, context.currentTime - startTime, 0, xScale, yScale, "blue");
	
	/*requestAnimationFrame(function() {
		visualize(flux, threshold, prunnedSpectralFlux);
	});*/
}

function resize() {
	canvas.width = document.documentElement.clientWidth;
	canvas.height = document.documentElement.clientHeight;
}

function drawOneSample(samples,index, offsetSeconds, xScale, yScale,color) {

  canvasContext.fillStyle = color;
  canvasContext.fillRect(xScale,yScale-samples[index]/50,50,samples[index]/50);

}

function drawThresholdSample(thresholds, samples,resolution, offsetSeconds, xScale, yScale,color) {
  var samplesPerPixel = xScale / resolution;
  
  var startSampleRaw = offsetSeconds * context.sampleRate / resolution;
  var startSample = Math.floor(startSampleRaw);
  canvasContext.fillStyle = color;
  value = (samples[samples.length-1] > thresholds[0]) ? samples[samples.length-1] : 0;
  canvasContext.fillRect(xScale,yScale-value/50,50,value/50);

}


function plotSamples(samples, resolution, offsetSeconds, yOffset, xScale, yScale, color, notCentered) {
	canvasContext.strokeStyle = color;
	canvasContext.beginPath();
	canvasContext.moveTo(0, canvas.height / 2 + yOffset);
	
	var y;
	var samplesPerPixel = xScale / resolution;
	
	var startSampleRaw = offsetSeconds * context.sampleRate / resolution;
	var startSample = Math.floor(startSampleRaw);
	var pixelDifference;
	
	if (samplesPerPixel < 1) {
		// Each sample is wider than a pixel, so map samples to pixels
		
		pixelDifference = (startSampleRaw - startSample) / samplesPerPixel;
		
		if (!notCentered) startSample -= Math.floor(canvas.width / 2 * samplesPerPixel);
		var endSample = startSample + canvas.width * samplesPerPixel;
		
		for (let sample = startSample; sample < endSample + 2; sample++) {
			var x = (sample - startSample) / samplesPerPixel - pixelDifference;
			y = -samples[sample] * yScale;
			canvasContext.lineTo(x, y + yOffset + canvas.height / 2);
		}
	} else {
		// Each pixel is wider than a sample, so map pixels to samples
		
		startSample -= startSample % samplesPerPixel;
		
		pixelDifference = (startSampleRaw - startSample) / samplesPerPixel;
		
		if (!notCentered) startSample -= Math.floor(canvas.width / 2 * samplesPerPixel);
		
		for (let screenX = 0; screenX < canvas.width; screenX++) {
			var sampleIndex = Math.floor(screenX * samplesPerPixel) + startSample;
			y = -samples[sampleIndex] * yScale;
			canvasContext.lineTo(screenX - pixelDifference, y + yOffset + canvas.height / 2);
		}
	}
	canvasContext.stroke();
	
	// Draw playhead
	canvasContext.strokeStyle = "black";
	canvasContext.beginPath();
	canvasContext.moveTo(canvas.width / 2, 0);
	canvasContext.lineTo(canvas.width / 2, canvas.height);
	canvasContext.stroke();
}

function playSound(samples) {
	var buffer;
	var bufferSamples = samples.getChannelData(0);
	
	const THRESHOLD_WINDOW_SIZE = 10;
	const MULTIPLIER            = 1.9;
	const SAMPLE_SIZE           = 256;
	
	var javascriptNode = context.createScriptProcessor(2048, 1, 1);
  javascriptNode.connect(context.destination);

  this.analyser = context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0.0;
  this.analyser.fftSize = SAMPLE_SIZE;

  var splitter = context.createChannelSplitter();
  source.connect(splitter);
  splitter.connect(this.analyser,0,0);
  this.analyser.connect(javascriptNode);

	source.connect(context.destination);
	source.buffer = samples;
	source.start();
	startTime = context.currentTime;
	
  var spectrum     = new Float32Array(SAMPLE_SIZE );
  var prevSpectrum = new Float32Array(SAMPLE_SIZE );
  var spectralFlux = [];
  var prunnedSpectralFlux = [0,0];
  var threshold    = [];
  var peaks        = [];
  javascriptNode.onaudioprocess = () => {

    fftSpectrum =  new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(fftSpectrum);
  
    var flux = 0;
    
    for (let bin = 0; bin < fftSpectrum.length; bin++) {
      flux += Math.max(0, fftSpectrum[bin] - prevSpectrum[bin]);
      prevSpectrum[bin] = fftSpectrum[bin];
    }

    spectralFlux.push(flux);
    if(spectralFlux.length > THRESHOLD_WINDOW_SIZE)
      spectralFlux.shift();

    var sum = 0;
    for (let i = 0; i < spectralFlux.length; i++) {
      sum += spectralFlux[i];            
    }
    console.log(spectralFlux)
    
    threshold[0] = sum / (spectralFlux.length) * MULTIPLIER;
    console.log(threshold)
    prunnedSpectralFlux[1] = prunnedSpectralFlux[0];
    prunnedSpectralFlux[0] =Math.max(0, spectralFlux[spectralFlux.length-1] - threshold[0]);

    if (prunnedSpectralFlux[0] > prunnedSpectralFlux[1]) 
      peaks[0] = prunnedSpectralFlux[0];
    else 
      peaks[0] = 0;
    
    visualize(spectralFlux, threshold, peaks);
  }
  

}



function loadTrack(url, callback) {
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";
	request.onload = function() {
		context.decodeAudioData(request.response, callback);
	};
	request.send();
}
