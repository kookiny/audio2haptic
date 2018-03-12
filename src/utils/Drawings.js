

export default class Drawings {
    constructor(params, context, mathUtils,gains) {
      this.params = params;
      this.context = context;
      this.mathUtils = mathUtils;
      this.lastAvg = [0,0,0,0,0];
      this.gains = gains;
    }

    drawFFT (array){
      var ctx = document.getElementById('ampcanvas').getContext("2d");
      // clear d current state
      ctx.clearRect(0, 0, 1000, 130);

      var color = this.params.color;

      this.sum = [0,0,0,0,0];
      this.cnt = [0,0,0,0,0];

      var sum = this.sum;
      var cnt = this.cnt;

      var sections = this.params.sections;

      for (var i = 0; i < array.length; i++){
        var flagSect = 0;
        for(var j = 0; j < this.params.COUNT_SECTION; j++) {
            if(sections[j]<=i && sections[j+1]>i){
                ctx.fillStyle = color[j];
                cnt[j]++;
                sum[j]+=array[i];
                flagSect = 1;
            }
        }
        if(flagSect == 0){
            ctx.fillStyle="#000000";
        }
        ctx.fillRect(i*10*(10/12.8),130-array[i]*0.5,10*(10/12.8),array[i]);
      }
    }

    drawGroupedFFT(masterGain, gain){ 

      var ctx2 = document.getElementById('chkcanvas').getContext("2d");
      ctx2.fillStyle = "#FFFFFF";
      ctx2.clearRect(0,0,1000, 100);

      var color = this.params.color;
      
      var avg = [0,0,0,0,0];
      this.avg2 = [0,0,0,0,0];
      var avg2 = this.avg2;

      var sum = this.sum;
      var cnt = this.cnt;
      var sections = this.params.sections;

      //TODO from parameters
      var radioChecked = this.params.radioChecked;
      var mGain = this.params.mGain;
      var vibPeriod = this.params.vibPeriod;
      var ampVibration = this.params.ampVibration;

      masterGain.gain.setValueAtTime(mGain,this.context.currentTime);

      var orgAvg = [0,0,0,0,0];
      var thresholdFinish = [0,0,0,0,0];
      var thresholdPeriod = 500;

      for(var i = 0; i < this.params.COUNT_SECTION; i++){
          avg[i] = parseInt(sum[i]/cnt[i]);
          orgAvg[i] = avg[i];

          var threshold = this.params.threshold; // TODO from slider

          if(radioChecked == "mode1"){
              if(thresholdFinish[i] <Date.now())
              {
                  if(avg[i] <= threshold ) {
                      avg[i] = 0;
                  }
                  else if(this.lastAvg[i] <= threshold){
                      this.selectStart(i, vibPeriod, ampVibration, gain);
                      thresholdFinish[i] = Date.now() + thresholdPeriod;
                  }
              }
          }
          else if (radioChecked == "mode2"){
              if(avg[i] <= threshold ) {
                  avg[i] = 0;
              }
              else if(this.lastAvg[i] <= threshold){
                  this.selectStart(i, vibPeriod, ampVibration, gain);
              }
          }

          else if (radioChecked == "mode3"){
              if(avg[i] <= threshold ) {
                  avg[i] = 0;
              }
              else{
                  this.selectStart(i, vibPeriod, ampVibration, gain);
              }
          }

          this.lastAvg[i] = orgAvg[i];
          avg2[i] = gain[i].gain.value*255;

          ctx2.beginPath();
          ctx2.arc((parseFloat(sections[i+1])+parseFloat(sections[i]))/2.0*10*(10/12.8),30,avg2[i]*0.1,0,2*Math.PI);
          ctx2.fillStyle = color[i];
          ctx2.fill();
          ctx2.closePath();
      }

    }

    drawVibration(){

      var ctx3 = document.getElementById('vibecanvas').getContext("2d");
      var avg2 = this.avg2;
      var sensors = this.mathUtils.calculateVibe(avg2);

      ctx3.fillStyle = "#000000";
      ctx3.fillRect(60,0,400, 360);
      ctx3.fillStyle = "#FFFFFF";
      ctx3.fillRect(65,5,400-10, 360-10);

      var color = this.params.color;
      var values = [];

      for(var i = 0; i < this.mathUtils.NUM_SENSOR; i++){
          ctx3.beginPath();
          ctx3.arc(100*(i%4+1), parseInt(i/4)*70+40,sensors[i].value*0.1,0,2*Math.PI);
          ctx3.fillStyle = color[sensors[i].color];
          ctx3.fill();
          ctx3.closePath();

          values[i] = sensors[i].value;
      }

      this.mathUtils.sendHaptics(values);
    }

    selectStart(i, period, amp, gains) {
        var now = this.context.currentTime;
        var gain = gains[i].gain;

        // TODO from parameter
        var ampByFreq = this.params.ampByFreq;

        gain.linearRampToValueAtTime( amp * ampByFreq, now );
        gain.linearRampToValueAtTime ( 0.0, now + period*2 );
    }
    

}