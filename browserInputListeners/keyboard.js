var keyboard = {}

document.addEventListener('keydown', function(e) {

    if (keyboard[ e.code ] !== true) {

        keyboard[ e.code ] = true;
    }
})

document.addEventListener('keyup', function(e) {

    if (keyboard[ e.code ] === true) {

        keyboard[ e.code ] = false;
    }
})

export { keyboard };
