import hapticPlayer from 'tact-js';

export default class MathUtils {
    constructor() {
        this.player = new hapticPlayer();
        this.lastArr = [];
        this.NUM_SENSOR = 20;
    }

    getAverageVolume(array) {
        var values = 0;
        var average;
        var length = array.length;
        var max = -1;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
            if(max<array[i]){
                max = array[i]
            }
        }

        average = values / length;
        return max;
    }


    calculateVibe(avg) {
        var sensors = [{}];

        for(var i = 0 ; i < this.NUM_SENSOR; i++){
            var sensor ={value: avg[4-parseInt(i/4)], color: 4-parseInt(i/4)};
            sensors[i] = sensor;

        }
        return sensors;
    }

    process(arr) {
        var result = [];
        for(var i = 0 ; i < arr.length ; i++) {
            var val = parseInt(arr[i] * 100 / 255)*0.5;

            result.push(val);
        }

        return result;
    }

    arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.

        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    sendHaptics(arr) {
        if (!arr) {
            return;
        }

        if (this.arraysEqual(arr, this.lastArr)) {
            //console.log('same');
            return;
        }
        var processed = this.process(arr);
        var dotPoints = [];
        for (var i = 0 ;i < 20 ;i++) {
            dotPoints.push({
                Index : i,
                Intensity : processed[i]
            })
        }

        var player = this.player;

        player.submitDot('left', 'Left', dotPoints, 50)
        player.submitDot('right', 'Right', dotPoints, 50)
        player.submitDot('vf', 'VestFront', dotPoints, 50)
        player.submitDot('vb', 'VestBack', dotPoints, 50)

        this.lastArr = arr;
    }

}