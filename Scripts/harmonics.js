// js file for SineGraph.html

// Reference the sineWave generator.
var sineWaveGenerator = com.littleDebugger.daw.dsp.generator.sineWave;

var volumeWarning = com.littleDebugger.daw.volumeWarning();

var colors = ['blue', 'red', 'green', 'cyan', 'magenta', 'aqua', 'brown', 'grey', 'orange', 'purple']
var numberOfOscillators = 10;
var gainAdjustmentForNumberOfOscillators = numberOfOscillators / 3;

// Controls.
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var fundimental = document.getElementById('frequency1');

var oscillatorControls = [];
for (var i = 1; i <= numberOfOscillators; i++) {
    oscillatorControls.push({
        gain: document.getElementById('gain' + i),
        gainLabel: document.getElementById('gain' + i + 'label'),
        frequencyLabel: document.getElementById('frequency' + i + 'label'),
        frequencyControl: document.getElementById('frequency' + i),
        frequency: function(){
            if (this.frequencyControl == fundimental){
                return fundimental.value;
            }

            return this.frequencyControl.value * fundimental.value;
        }
    });
}


var start = document.getElementById('start');
var stop = document.getElementById('stop');

var audioCtx = com.littleDebugger.daw.getAudioContext();
var sampleRate;
var windowsPerSecond;
var noneCroppingHeight = canvas.height - 2;
var bufferLength = 8192;

// Set the grid colors.
var axisColor = "black";
var divideColor = "grey";

var audioPlaying = false;
var interval;

if (audioCtx == null) {
    // Setup when Web Audio API is not availalble.
    sampleRate = 48000;
    start.onclick = function () {
        alert("Web Audio API is not available. Please use a supported browser.");
    };

    windowsPerSecond = (sampleRate / canvas.width) * 2;
} else {
    // Setup when Web Audio API is available.
    sampleRate = audioCtx.sampleRate;
    
    oscillatorControls.forEach(function (oscillatorControl) {
        oscillatorControl.sineWaveGeneratorAudio = sineWaveGenerator(0, sampleRate);
    });

    windowsPerSecond = (sampleRate / canvas.width) * 2;

    var scriptNode;
    start.onclick = function () {
        scriptNode = audioCtx.createScriptProcessor(bufferLength, 1, 1);
        if (audioPlaying) {
            return;
        }

        volumeWarning.eventFired();

        audioPlaying = true;

        clearTimeout(interval);
        redrawCanvas();

        var i = 0;
        scriptNode.onaudioprocess = function (audioProcessingEvent) {
            var outputBuffer = audioProcessingEvent.outputBuffer;
            var output = outputBuffer.getChannelData(0);
            for (var sample = 0; sample < outputBuffer.length; sample++) {
                output[sample] = buffer[i];
                i++;

                if (i >= bufferLength) {
                    i = 0;
                }
            }

            redrawCanvas();
        };

        scriptNode.connect(audioCtx.destination);
    };

    // Stop audio button click event.
    stop.onclick = function () {
        if (!audioPlaying) {
            return;
        }

        audioPlaying = false;
        clearTimeout(interval);
        interval = window.setInterval(redrawCanvas, 1000 / 8);

        scriptNode.disconnect(audioCtx.destination);
        console.log('Audio stopped.');
    };
}

canvas.width = 1000;
var buffer = [bufferLength];

// Draw a horizonal line of the canvas
// <y> The point on the Y-axis where the line should be draw.
// <color> Color of the line.
function drawHorizonalLine(y, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
}

// Draw a virtical line of the canvas
// <x> The point on the X-axis where the line should be draw.
// <color> Color of the line.
function drawVirticalLine(x, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
}

// Draw a wave.
// <waveOffset> The offset of the wave.
// <color> Color of the wave.
var drawWave = function (waveOffset, gainValue, frequency, gainLabel, frequencyLabel, color) {
    // Label for the gain.
    gainLabel.innerHTML = (gainValue * 100).toFixed(0) + "%";
    // Label for the frequency.
    frequencyLabel.innerHTML = 'x' + (frequency / fundimental.value).toFixed(0);

    var sineWaveGeneratorInstance = sineWaveGenerator(waveOffset, sampleRate);

    ctx.beginPath();
    ctx.strokeStyle = color;
    // 
    var adjustedGain = gainValue / gainAdjustmentForNumberOfOscillators;
    for (var i = 0; i < canvas.width + 1; i++) {
        var amplitude = sineWaveGeneratorInstance.getSample((frequency / fundimental.value) * windowsPerSecond);
        var amplitudeWithGain = amplitude * adjustedGain;

        ctx.lineTo(i, canvas.height - ((amplitudeWithGain * noneCroppingHeight / 2) + (canvas.height / 2)));
    }

    ctx.stroke();
    ctx.closePath();
};

// Draw the summed wave.
// <oscillatorControls> Array of objects for each wave.
// - objects have gain and frequency properties.
var drawSummedWave = function (oscillatorControls, color) {
    ctx.strokeStyle = color;

    oscillatorControls.forEach(function (oscillatorControl) {
        oscillatorControl.sineWaveGenerator = sineWaveGenerator(0, sampleRate);
    });

    ctx.beginPath();

    // So that the some of all sines can not be > 1 or < -1.
    var adjustedGain;
    for (var i = 0; i < canvas.width + 1; i++) {
        var amplitude = 0;

        oscillatorControls.forEach(function (oscillatorControl) {
            adjustedGain = oscillatorControl.gain.value / gainAdjustmentForNumberOfOscillators;
            amplitude += (oscillatorControl.sineWaveGenerator.getSample((oscillatorControl.frequency() / fundimental.value) * windowsPerSecond) * adjustedGain);
        });

        ctx.lineTo(i, canvas.height - ((amplitude * noneCroppingHeight / 2) + (canvas.height / 2)));
    }

    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.closePath();
};

// Populate audio buffer.
// <oscillatorControls> Array of objects for each wave.
// - objects have gain and frequency properties.
var populateAudioBuffer = function (oscillatorControls) {
    console.log("here");
    // So that the some of all sines can not be > 1 or < -1.
    var adjustedGain;
    for (var i = 0; i < bufferLength; i++) {
        var amplitude = 0;

        oscillatorControls.forEach(function (oscillatorControl) {
            adjustedGain = (oscillatorControl.gain.value / numberOfOscillators);
            amplitude += (oscillatorControl.sineWaveGeneratorAudio.getSample(oscillatorControl.frequency() * 50) * adjustedGain);
        });

        buffer[i] = amplitude;
    }
};

var redrawCanvas = function () {
    // Clear the canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid. Will be moved out into a module.
    drawHorizonalLine(canvas.height / 4, divideColor);
    drawHorizonalLine(canvas.height / 4 * 3, divideColor);
    drawHorizonalLine(canvas.height / 2, axisColor);

    drawVirticalLine(canvas.width / 8, divideColor);
    drawVirticalLine(canvas.width / 8 * 2, divideColor);
    drawVirticalLine(canvas.width / 8 * 3, divideColor);
    drawVirticalLine(canvas.width / 8 * 5, divideColor);
    drawVirticalLine(canvas.width / 8 * 6, divideColor);
    drawVirticalLine(canvas.width / 8 * 7, divideColor);
    drawVirticalLine(canvas.width / 2, divideColor);

    for (var i = 0; i < numberOfOscillators; i++) {
        drawWave(0, oscillatorControls[i].gain.value, oscillatorControls[i].frequency(), oscillatorControls[i].gainLabel, oscillatorControls[i].frequencyLabel, colors[i]);
    }

    drawSummedWave(oscillatorControls, "black");
    populateAudioBuffer(oscillatorControls);

};

// Update the canvas 8 times per second. Each redraw gets the value from the gain range control.
// setInterval was used rather than a change event because the change event is only fired once the change is complete.

redrawCanvas();

var gainControlContainer = document.getElementById('controlsContainer');

// This displays the page better when in a blog post Iframe.
// It will be modularised or replaced (hopefully with CSS only).
var setDimensions = function () {
    canvas.style.width = (window.innerWidth - 35) + "px";
    var height = window.innerHeight > window.innerWidth ?
        window.innerWidth :
        window.innerHeight;
    canvas.style.height = (height - gainControlContainer.clientHeight) - 35 + "px";
};

window.onresize = function () {
    setDimensions();
};

window.onresize();

// setInterval used until play event.
interval = window.setInterval(redrawCanvas, 1000 / 8);