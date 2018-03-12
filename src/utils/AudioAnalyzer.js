import MathUtils from "./MathUtils";
import Drawings from "./Drawings";

export default class AudioAnalyzer {
    constructor() {

        if (! window.AudioContext) {
            if (! window.webkitAudioContext) {
                alert('no audiocontext found');
            }
            window.AudioContext = window.webkitAudioContext;
        }

        this.params = {
          radioChecked : "mode1",
          color : ["#FF8888","#88FF88","#8888FF","#FF33FF","#FFFF33"],
          mGain : 1.0,
          vibPeriod : 0.1,
          ampVibration : 0.8,
          ampByFreq : 0.8,
          threshold : 180, 
          sections : [10,20,35,50,70,95],
          fileName: "./assets/Last.mp3",
          COUNT_SECTION: 5
        };

        this.mathUtils = new MathUtils();
        this.context = new AudioContext();
        this.drawings = new Drawings(this.params, this.context, this.mathUtils);

        var sourceNode = this.setupAudioNodes();
        this.loadSound(this.params.fileName,sourceNode)
    }

    setupAudioNodes() {
      var context = this.context;

      // setup a javascript node
      var javascriptNode = context.createScriptProcessor(2048, 1, 1);
      // connect to destination, else it isn't called
      javascriptNode.connect(context.destination);

      // setup a analyzer
      this.analyser = context.createAnalyser();
      this.analyser.smoothingTimeConstant = 0.0;
      this.analyser.fftSize = 256;

      this.analyser2 = context.createAnalyser();
      this.analyser2.smoothingTimeConstant = 0.0;
      this.analyser2.fftSize = 1024;

      // create a buffer source node
      var sourceNode = context.createBufferSource();
      this.sourceNode = sourceNode;
      var splitter = context.createChannelSplitter();

      // connect the source to the analyser and the splitter
      sourceNode.connect(splitter);

      // connect one of the outputs from the splitter to
      // the analyser
      splitter.connect(this.analyser,0,0);
      splitter.connect(this.analyser2,1,0);

      // connect the splitter to the javascriptnode
      // we use the javascript node to draw at a
      // specific interval.
      this.analyser.connect(javascriptNode);

      // and connect to destination
      sourceNode.connect(context.destination);

      this.masterGain = context.createGain();
      this.masterGain.gain.setValueAtTime(1,context.currentTime);

      // TODO
      var osc = [0,0,0,0,0];
      this.gain = [0,0,0,0,0];

      for(var i = 0; i < this.params.COUNT_SECTION; i++) {
          osc[i] = context.createOscillator();
          osc[i].frequency.setValueAtTime(500*(i+1), context.currentTime);
          this.gain[i] = context.createGain();

          this.gain[i].gain.setValueAtTime(0, context.currentTime);

          osc[i].type = "sine";
          osc[i].connect(this.gain[i]);
          this.gain[i].connect(this.masterGain);
          osc[i].start();
      }
      this.masterGain.connect(context.destination);

      // when the javascript node is called
      // we use information from the analyzer node
      // to draw the volume
      javascriptNode.onaudioprocess = () => {

        // get the average for the first channel
        var array =  new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        //var average = this.mathUtils.getAverageVolume(array);

        // get the average for the second channel
        /* 
        var array2 =  new Uint8Array(this.analyser2 .frequencyBinCount);
        this.analyser2 .getByteFrequencyData(array2);
        var average2 = this.mathUtils.getAverageVolume(array2);
        */

        var classes = ['c-1-color', 'c-2-color', 'c-3-color', 'c-4-color','c-5-color'];
        var color = ["#FF8888","#88FF88","#8888FF","#FF33FF","#FFFF33"]

        var sections = [10,20,35,50,70,95]; //HARD-CODE // TODO UI
        if(sections){

          this.drawings.drawFFT(array);
          this.drawings.drawGroupedFFT(this.masterGain, this.gain);
          this.drawings.drawVibration();          
          
        }
      }

      return sourceNode;

    }

    // load the specified sound
    loadSound(url, sourceNode) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = () => {
            // decode the data
            this.context.decodeAudioData(request.response, (buffer) => {
                // when the audio is decoded play the sound
                this.playSound(buffer, sourceNode);
            }, (e)=> {
                console.log('error', e)
            });
        }
        request.send();
    }

    playSound(buffer, sourceNode) {
        if(sourceNode.buffer != undefined) {
            sourceNode.stop(0);
            sourceNode.buffer = undefined;
            sourceNode = undefined;
            this.setupAudioNodes();
        }
        sourceNode.buffer = buffer;
        sourceNode.start(0);
    }
}