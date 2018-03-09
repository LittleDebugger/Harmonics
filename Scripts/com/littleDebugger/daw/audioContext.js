// Create namespace.
com.littleDebugger.namespacer.createNamespace("com.littleDebugger.daw");

// The is the visualiser.
com.littleDebugger.daw.getAudioContext = (function () {
    // Support Web Audio API in different supported broswers.
    // Taken from http://chimera.labs.oreilly.com/books/1234000001552/ch01.html#s01_2
    var getAudioContext = function () {
        var ContextClass = (
            window.AudioContext ||
            window.webkitAudioContext ||
            window.mozAudioContext ||
            window.oAudioContext ||
            window.msAudioContext);
        if (ContextClass) {
            var context = new ContextClass();
            console.log("Sample Rate:" + context.sampleRate);
            return context;
        } else {
            return null;
        }
    };

    return getAudioContext;
})();