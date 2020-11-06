  
const { desktopCapturer, remote } = require('electron');

const { writeFile } = require('fs');

const { dialog, Menu } = remote;

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

let recordingStatus = document.getElementById('recordingStatus')

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
  recordingStatus.innerHTML = ``
  recordingStatus.innerHTML = `<h1 id="recordingStatus" class='mdi mdi-record record'>Recording</h1>`
};





const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
  recordingStatus.innerHTML = `<h1 id="recordingStatus" class='mdi mdi-circle stop'>Not Recording</h1>`
};

const checkbox = document.getElementById('captureBothScreens')

let captureAllScreens = false

checkbox.onclick = e => {
  captureBothScreens()
}

function captureBothScreens() {
  captureAllScreens = document.getElementById('captureBothScreens').value
  console.log(captureAllScreens)
} 


const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );


  videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {
  if (videoElement.srcObject) {
    console.log(videoElement.srcObject)
    videoElement.srcObject = null
  }

  videoSelectBtn.innerText = source.name;

  const constraints = {
    // {
    //   mandatory: {
    //     chromeMediaSource: 'desktop',
    //   },
    // },
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        ...(!captureAllScreens && {chromeMediaSourceId: source.id})
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

}
