const { createApp, ref, computed, nextTick } = Vue;
const GAME_CODE = window.location.pathname.split('/').pop().toUpperCase();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const roomData = ref({ users: [], isPublic: true, maxPlayers: 4, data: {}, started: false }); // template
const grid = ref({});
const currentNumber = ref(-1);

for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
        grid.value[`${i}_${j}`] = { value: randomInt(1, 50), selected: false};
    }
}

const userId = ref('<connecting...>'); // Initialize with connecting...
socket.on('connect', () => {
    userId.value = socket.id;

    socket.emit('joinGame', GAME_CODE);
});

socket.on('numberCalled', (number) => {
    currentNumber.value = number;
});

function syncData() {
    socket.emit('updateRoomData', JSON.parse(JSON.stringify(roomData.value.data[userId.value])));
}

function toggleVote() {
    roomData.value.data[userId.value].voted = !roomData.value.data[userId.value]?.voted;
    syncData();
}

socket.on('roomFull', (gameCode) => {
    alert(`Room ${gameCode} is full. Please try joining another room.`);
    location.pathname = '/'; // Redirect to home
});

socket.on('roomDataUpdated', (data) => {
    roomData.value = data;
});


function clickCell(row, col) {
    if (!roomData.value.started) return;
    console.log(row, col);
    // grid.value[`${row}_${col}`].selected = !grid.value[`${row}_${col}`].selected;

    if (currentNumber.value != grid.value[`${row}_${col}`].value) return;
    grid.value[`${row}_${col}`].selected = true;

    let win = false;
    for (let i = 0; i < 5; i++){
        if (grid.value[`0_${i}`].selected && grid.value[`1_${i}`].selected && grid.value[`2_${i}`].selected && grid.value[`3_${i}`].selected && grid.value[`4_${i}`].selected){
            win = true;
            break;
        }
        if (grid.value[`${i}_0`].selected && grid.value[`${i}_1`].selected && grid.value[`${i}_2`].selected && grid.value[`${i}_3`].selected && grid.value[`${i}_4`].selected){
            win = true;
            break;
        }
    }
    if (grid.value[`0_0`].selected && grid.value[`1_1`].selected && grid.value[`2_2`].selected && grid.value[`3_3`].selected && grid.value[`4_4`].selected) {
        win = true;
    }
    if (grid.value[`0_4`].selected && grid.value[`1_3`].selected && grid.value[`2_2`].selected && grid.value[`3_1`].selected && grid.value[`4_0`].selected) {
        win = true;
    }

    if (win) {
        setTimeout(()=>{
            socket.emit('win');
        }, 1000)
    }
}

socket.on('win', (id)=>{
    if (id == socket.id){
        alert('you won!!!')
    } else {
        alert(`player ${id} won!!`)
    }

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            grid.value[`${i}_${j}`] = { value: randomInt(1, 50), selected: false};
        }
    }
})



const app = createApp({
    setup() {
        const voteCount = computed(() => {
            return Object.values(roomData.value.data).filter(user => user.voted).length;
        });

        return { GAME_CODE, userId, roomData, toggleVote, voteCount, clickCell, grid, currentNumber };
    }
});

app.mount('body');
