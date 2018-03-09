com.littleDebugger.namespacer.createNamespace("com.littleDebugger.utility.ui");

// Hides the logic to show/hide elements on the DOM.
com.littleDebugger.utility.ui.controlWrapper = (function () {
    var hiddenClass = 'hidden';
    var that = {};

    var internalWrapControl = function(){

    }

    that.wrapControl = function (control) {
        var wrapper = {};

        var inputType = control.nodeName == "INPUT";

        // Hides a element.
        wrapper.hideControl = function () {
            control.classList.remove(hiddenClass);
        };

        // Shows a element.
        wrapper.showControl = function () {
            control.classList.add(hiddenClass);
        };

        wrapper.setDisabled = function(){
            control.disabled = true;
        }

        wrapper.setEnabled = function(){
            control.disabled = false;
        }        

        wrapper.setValue = function (newValue) {
            if (inputType) {
                control.value = newValue;
            } else {
                control.innerHTML = newValue;
            }
        }

        wrapper.value = control.value;

        control.onchange = function(){
            wrapper.value = control.value;
            wrapper.onchange();
        }

        control.onclick = function(){

            wrapper.onclick();
        }

        wrapper.onchange = function() {};
        wrapper.onclick = function() {};
        wrapper.getValue = function(){
            if (inputType) {
                return control.value;
            } else {
                return control.innerHTML;
            }
        }

        

        return wrapper;
    };

    that.getWrappedControl = function(element){
        return that.wrapControl(document.getElementById(element));
    };

    return that;
})();