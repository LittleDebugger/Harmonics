// Create namespace.
com.littleDebugger.namespacer.createNamespace("com.littleDebugger.daw");

// The volume warning handler.
com.littleDebugger.daw.volumeWarning = function (callback) {
    var showWarning = true;

    var that = {};
    that.eventFired = function () {
        if (showWarning) {
            alert('Please set volume to an appropriate level.');
            showWarning = false;
        }

        if (typeof (callback) !== 'undefined') {
            callback();
        }
    };

    return that;
};