// js file for SineGraph.html

// Reference the sineWave generator.
var sineWaveGenerator = com.littleDebugger.daw.dsp.generator.sineWave;

var volumeWarning = com.littleDebugger.daw.volumeWarning();

// Controls.
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var gain1 = document.getElementById('gain1');
var gain2 = document.getElementById('gain2');
var gain3 = document.getElementById('gain3');
var gain1label = document.getElementById('gain1label');
var gain2label = document.getElementById('gain2label');
var gain3label = document.getElementById('gain3label');
var frequency1 = document.getElementById('frequency1');
var frequency2 = document.getElementById('frequency2');
var frequency3 = document.getElementById('frequency3');
var frequency1label = document.getElementById('frequency1label');
var frequency2label = document.getElementById('frequency2label');
var frequency3label = document.getElementById('frequency3label');

var start = document.getElementById('start');
var stop = document.getElementById('stop');

// Presets.
document.getElementById('preset1').onclick = function () {
    gain1.value = 1;
    gain2.value = 0.6;
    gain3.value = 0.3;
    frequency1.value = 10;
    frequency2.value = 10;
    frequency3.value = 10;
};

document.getElementById('preset2').onclick = function () {
    gain1.value = 0;
    gain2.value = 1;
    gain3.value = 1;
    frequency1.value = 3;
    frequency2.value = 74;
    frequency3.value = 69;
};

document.getElementById('preset3').onclick = function () {
    gain1.value = 0;
    gain2.value = 1;
    gain3.value = 1;
    frequency1.value = 3;
    frequency2.value = 85;
    frequency3.value = 84;
};

document.getElementById('preset4').onclick = function () {
    gain1.value = 0;
    gain2.value = 0.21;
    gain3.value = 0;
    frequency1.value = 3;
    frequency2.value = 41;
    frequency3.value = 4;
};

var audioCtx = com.littleDebugger.daw.getAudioContext();
var sampleRate;
var numberOfWaves = 3;
var windowsPerSecond = 42;
var noneCroppingHeight = canvas.height - 2;

// Set the grid colours.
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
} else {
    // Setup when Web Audio API is available.
    sampleRate = audioCtx.sampleRate;
    var scriptNode = audioCtx.createScriptProcessor(8192, 1, 1);
    start.onclick = function () {

        if (audioPlaying) {
            return;
        }

        volumeWarning.eventFired();

        audioPlaying = true;

        clearTimeout(interval);
        scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
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
        console.log('Audio playing.');
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

var bufferLength = Math.ceil(sampleRate / windowsPerSecond);
canvas.width = bufferLength;
var buffer = [bufferLength];

canvas.width = bufferLength;

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
    frequencyLabel.innerHTML = (frequency * windowsPerSecond).toFixed(0) + "Hz";
    ctx.strokeStyle = color;
    var sineWaveGeneratorInstance = sineWaveGenerator(waveOffset, sampleRate);

    ctx.beginPath();

    // 
    var adjustedGain = gainValue / numberOfWaves;
    for (var i = 0; i < canvas.width + 1; i++) {
        var amplitude = sineWaveGeneratorInstance.getSample(frequency * windowsPerSecond);
        var amplitudeWithGain = amplitude * adjustedGain;

        ctx.lineTo(i, canvas.height - ((amplitudeWithGain * noneCroppingHeight / 2) + (canvas.height / 2)));
    }

    ctx.stroke();
};

// Draw the summed wave.
// <waveControls> Array of objects for each wave.
// - objects have gain and frequency properties.
var drawSummedWave = function (waveControls, color) {
    ctx.strokeStyle = color;

    // TODO do not create a new instance each time.
    waveControls.forEach(function (waveControl) {
        waveControl.sineWaveGenerator = sineWaveGenerator(0, sampleRate);
    });

    ctx.beginPath();

    // So that the some of all sines can not be > 1 or < -1.
    var adjustedGain;
    for (var i = 0; i < canvas.width + 1; i++) {
        var amplitude = 0;

        waveControls.forEach(function (waveControl) {
            adjustedGain = (waveControl.gain / numberOfWaves);
            amplitude += (waveControl.sineWaveGenerator.getSample(waveControl.frequency * windowsPerSecond) * adjustedGain);
        });

        buffer[i] = amplitude;

        ctx.lineTo(i, canvas.height - ((amplitude * noneCroppingHeight / 2) + (canvas.height / 2)));
    }

    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 1;
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

    drawWave(0, gain1.value, frequency1.value, gain1label, frequency1label, 'blue');
    drawWave(0, gain2.value, frequency2.value, gain2label, frequency2label, 'red');
    drawWave(0, gain3.value, frequency3.value, gain3label, frequency3label, 'green');
    drawSummedWave([{
        gain: gain1.value,
        frequency: frequency1.value
    }, {
        gain: gain2.value,
        frequency: frequency2.value
    }, {
        gain: gain3.value,
        frequency: frequency3.value
    }], "black");
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