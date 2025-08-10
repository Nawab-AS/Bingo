const createRoomButton = document.getElementById('createRoomButton');
const joinRoomButton = document.getElementById('joinRoomButton');
const roomCodeInput = document.getElementById('roomCode');
const validGameCode = /^[a-zA-Z0-9]*$/; // alphanumeric characters only


// enable/disable joinRoomButton based on roomCodeInput value
joinRoomButton.disabled = true; // Initially disable the button
roomCodeInput.addEventListener('input', () => {
    if (!validGameCode.test(roomCodeInput.value)) {
        roomCodeInput.value = roomCodeInput.value.slice(0, -1); // Remove the last invalid character
    } else {
        roomCodeInput.value = roomCodeInput.value.toUpperCase();
    }

    if (roomCodeInput.value.length === 6) {
        joinRoomButton.disabled = false;
    } else {
        joinRoomButton.disabled = true;
    }
});


// Add event listeners for the buttons
createRoomButton.addEventListener('click', () => {
    location.pathname = '/createRoom';
});

joinRoomButton.addEventListener('click', () => {
    const roomCode = roomCodeInput.value;
    location.pathname = '/game/' + roomCode;
});
